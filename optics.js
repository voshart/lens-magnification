const GREEN_WAVELENGTH_UM = 0.55;
const DIN_160_IMAGE_DISTANCE_MM = 150;

function positiveNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

function isZoomLens(lens) {
  return /\d+(?:\.\d+)?[-–]\d+(?:\.\d+)?mm/i.test(lens.name);
}

function nativeWorkingDistance(system, lens) {
  const catalogWd = positiveNumber(lens.nativeWorkingDistanceMm);
  if (catalogWd) return catalogWd;

  const mfd = positiveNumber(lens.MFD);
  const lensLength = positiveNumber(lens.PL);
  const flange = positiveNumber(system.flangeDistance);
  if (!mfd || !lensLength || !flange) return null;

  const wd = mfd - lensLength - flange;
  return wd > 0 ? wd : null;
}

function principalPlaneOffsetFromFront(system, lens) {
  const f = positiveNumber(lens.f);
  const m = positiveNumber(lens.NM);
  const wd = nativeWorkingDistance(system, lens);
  if (!f || !m || wd == null) return null;

  const objectDistanceFromPrincipalPlane = f * (1 + 1 / m);
  return objectDistanceFromPrincipalPlane - wd;
}

function parseReversalEstimate(text, focalLength) {
  if (!text) return null;

  if (focalLength) {
    const exact = new RegExp(`(?:~|approx\\.?\\s*)?(\\d+(?:\\.\\d+)?):1\\s*\\(at\\s*${focalLength}mm\\)`, 'i');
    const match = String(text).match(exact);
    if (match) return Number(match[1]);
  }

  const general = String(text).match(/(?:~|approx\.?\s*)?(\d+(?:\.\d+)?):1/i);
  return general ? Number(general[1]) : null;
}

function cameraMagnification(lens, accessory) {
  const f = positiveNumber(lens.f);
  const nativeMag = positiveNumber(lens.NM) ?? 0;
  if (!f) return null;

  switch (accessory.type) {
    case 'none':
      return nativeMag;

    case 'tube':
      return nativeMag + (positiveNumber(accessory.length) ?? 0) / f;

    case 'diopter': {
      // In-contact thin-lens approximation with the camera lens left at its
      // native close-focus extension: m_new = m_native + v * D.
      const powerPerMm = (positiveNumber(accessory.power) ?? 0) / 1000;
      const imageDistance = f * (1 + nativeMag);
      return nativeMag + imageDistance * powerPerMm;
    }

    case 'reversal':
      // Reversed-lens behaviour depends strongly on real lens construction.
      // Only use the prototype's researched/manual estimate; do not invent one.
      return parseReversalEstimate(lens.reversedMagEstimateManual, f);

    default:
      return nativeMag;
  }
}

function cameraWorkingDistance(system, lens, accessory, magnification) {
  if (!magnification || magnification <= 0) return null;
  if (accessory.type === 'reversal' || accessory.type === 'diopter' || isZoomLens(lens)) return null;

  const f = positiveNumber(lens.f);
  const nativeMag = positiveNumber(lens.NM);
  const principalOffset = principalPlaneOffsetFromFront(system, lens);
  if (!f || !nativeMag || principalOffset == null) return null;

  if (accessory.type === 'none') return nativeWorkingDistance(system, lens);

  const objectDistance = f * (1 + 1 / magnification);
  const wd = objectDistance - principalOffset;
  return wd > 0 ? wd : null;
}

function sensorToSubjectDistance(system, lens, accessory, workingDistance) {
  if (accessory.type === 'none') {
    // Catalog MFD is measured from the focal plane and is more defensible than
    // reconstructing the same distance from barrel geometry. For zooms only
    // use it when the MFD at maximum reproduction is explicitly known.
    if (isZoomLens(lens)) return positiveNumber(lens.maxMagnificationMFD);
    return positiveNumber(lens.MFD);
  }

  if (workingDistance == null) return null;
  const flange = positiveNumber(system.flangeDistance);
  const lensLength = positiveNumber(lens.PL);
  if (!flange || !lensLength) return null;

  const extension = accessory.type === 'tube' ? (positiveNumber(accessory.length) ?? 0) : 0;
  return workingDistance + lensLength + flange + extension;
}

function pixelPitchUm(system, megapixels) {
  const width = positiveNumber(system.sensorWidth);
  const height = positiveNumber(system.sensorHeight);
  const mp = positiveNumber(megapixels);
  if (!width || !height || !mp) return null;

  const aspect = width / height;
  const horizontalPixels = Math.sqrt(mp * 1_000_000 * aspect);
  return width / horizontalPixels * 1000;
}

function fieldOfView(system, magnification) {
  const width = positiveNumber(system.sensorWidth);
  const height = positiveNumber(system.sensorHeight);
  if (!width || !height || !magnification || magnification <= 0) return null;

  return {
    widthMm: width / magnification,
    heightMm: height / magnification
  };
}

function samplingDetails(effectiveFNumber, pitchUm) {
  if (!effectiveFNumber || !pitchUm) {
    return { airyDiameterUm: null, airyPixels: null, nyquistLpMm: null };
  }

  const airyDiameterUm = 2.44 * GREEN_WAVELENGTH_UM * effectiveFNumber;
  return {
    airyDiameterUm,
    airyPixels: airyDiameterUm / pitchUm,
    nyquistLpMm: 500 / pitchUm
  };
}

function geometricDofMm(magnification, effectiveFNumber, pitchUm) {
  if (!magnification || !effectiveFNumber || !pitchUm) return null;

  const cocMm = (pitchUm * 2) / 1000;
  return 2 * effectiveFNumber * cocMm / (magnification * magnification);
}

export function calculateCameraSetup({ system, lens, accessory, aperture, megapixels }) {
  const markedAperture = positiveNumber(aperture);
  if (!markedAperture) {
    return { type: 'camera', valid: false, reason: 'Enter a valid aperture.' };
  }

  const zoom = isZoomLens(lens);
  if (zoom && (accessory.type === 'tube' || accessory.type === 'diopter')) {
    return {
      type: 'camera',
      valid: false,
      reason: 'Extension-tube and close-up-lens estimates are not modeled for zoom lenses because maximum magnification and focal length often occur at different zoom positions.'
    };
  }

  const magnification = cameraMagnification(lens, accessory);
  if (!magnification || magnification <= 0) {
    return {
      type: 'camera',
      valid: false,
      reason: accessory.type === 'reversal'
        ? 'No reliable reversed-lens magnification estimate is available for this lens.'
        : 'Magnification cannot be calculated for this setup.'
    };
  }

  const pitchUm = pixelPitchUm(system, megapixels);
  const effectiveFNumber = markedAperture * (1 + magnification);
  const workingDistanceMm = cameraWorkingDistance(system, lens, accessory, magnification);
  const sensorToSubjectMm = sensorToSubjectDistance(system, lens, accessory, workingDistanceMm);
  const fov = fieldOfView(system, magnification);
  const sampling = samplingDetails(effectiveFNumber, pitchUm);
  const dofMm = geometricDofMm(magnification, effectiveFNumber, pitchUm);
  const warnings = [];

  if (workingDistanceMm == null) {
    warnings.push(zoom
      ? 'Working distance is not modeled for zoom lenses because published dimensions and maximum magnification can refer to different zoom positions.'
      : accessory.type === 'diopter'
        ? 'Working distance is not shown for the close-up lens because the attachment shifts the combined system principal planes.'
        : 'Working distance is unavailable or too uncertain for this lens/setup.');
  }
  if (accessory.type === 'diopter') {
    warnings.push('Close-up-lens magnification uses a thin-lens, in-contact approximation with the camera lens at native close focus; Raynox’s 109 mm figure applies with the host lens focused at infinity.');
  }
  if (accessory.type === 'tube') {
    warnings.push('Extension-tube estimates assume nominal focal length and pupil magnification = 1 at the lens’s published native maximum magnification.');
  }
  if (accessory.type === 'reversal') {
    warnings.push('Reversed-lens magnification is a legacy prototype estimate, not a catalog specification; working distance and pupil magnification are not modeled.');
  }

  return {
    type: 'camera',
    valid: true,
    magnification,
    fov,
    workingDistanceMm,
    sensorToSubjectMm,
    effectiveFNumber,
    dofMm,
    pixelPitchUm: pitchUm,
    ...sampling,
    warnings
  };
}

export function calculateObjectiveSetup({ system, objective, megapixels }) {
  const magnification = positiveNumber(objective.M_obj);
  const na = positiveNumber(objective.NA);
  if (!magnification || !na) {
    return { type: 'objective', valid: false, reason: 'Objective data is incomplete.' };
  }

  const pitchUm = pixelPitchUm(system, megapixels);
  const effectiveFNumber = magnification / (2 * na);
  const fov = fieldOfView(system, magnification);
  const workingDistanceMm = positiveNumber(objective.WD_obj_mm);
  const objectiveBodyMm = positiveNumber(objective.PL_obj_body_mm);
  const mechanicalTubeLengthMm = positiveNumber(objective.standardFiniteTubeLength) ?? 160;
  const imageDistanceMm = mechanicalTubeLengthMm === 160 ? DIN_160_IMAGE_DISTANCE_MM : null;
  const parfocalDistanceMm = objectiveBodyMm && workingDistanceMm
    ? objectiveBodyMm + workingDistanceMm
    : null;
  const sensorToSubjectMm = imageDistanceMm && parfocalDistanceMm
    ? imageDistanceMm + parfocalDistanceMm
    : null;
  const sampling = samplingDetails(effectiveFNumber, pitchUm);
  const dofMm = geometricDofMm(magnification, effectiveFNumber, pitchUm);
  const sensorDiagonalMm = Math.hypot(system.sensorWidth, system.sensorHeight);
  const imageCircleMm = positiveNumber(objective.imageCircle_mm);
  const vignette = imageCircleMm ? imageCircleMm < sensorDiagonalMm : null;
  const warnings = [
    'DIN 160 mm is the mechanical objective-to-eyepiece-flange standard; this direct-to-sensor diagram places the intermediate image about 150 mm behind the objective shoulder.'
  ];

  if (!parfocalDistanceMm) {
    warnings.push('Objective body/parfocal geometry is not published for this entry, so sensor-to-subject distance is not shown.');
  }
  if (!imageCircleMm) {
    warnings.push('No defensible field-number/image-circle value is stored for this objective, so vignetting is not predicted.');
  }

  return {
    type: 'objective',
    valid: true,
    magnification,
    fov,
    workingDistanceMm,
    sensorToSubjectMm,
    effectiveFNumber,
    dofMm,
    pixelPitchUm: pitchUm,
    ...sampling,
    imageCircleMm,
    vignette,
    imageDistanceMm,
    parfocalDistanceMm,
    warnings
  };
}