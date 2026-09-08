const GREEN_WAVELENGTH_UM = 0.55;

function positiveNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

function nativeWorkingDistance(system, lens) {
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
      // Thin-lens model with the camera lens left at its native close-focus setting.
      // v = f(1+m0); adding close-up power D gives m = m0 + vD.
      const powerPerMm = (positiveNumber(accessory.power) ?? 0) / 1000;
      const imageDistance = f * (1 + nativeMag);
      return nativeMag + imageDistance * powerPerMm;
    }

    case 'reversal':
      // Reversal geometry depends strongly on lens construction and pupil placement.
      // Use only a researched/manual estimate rather than a misleading thin-lens fallback.
      return parseReversalEstimate(lens.reversedMagEstimateManual, f);

    default:
      return nativeMag;
  }
}

function cameraWorkingDistance(system, lens, accessory, magnification) {
  if (!magnification || magnification <= 0 || accessory.type === 'reversal') return null;
  if (/\d+(?:\.\d+)?[-–]\d+(?:\.\d+)?mm/i.test(lens.name)) return null;

  const f = positiveNumber(lens.f);
  const nativeMag = positiveNumber(lens.NM);
  const principalOffset = principalPlaneOffsetFromFront(system, lens);
  if (!f || !nativeMag || principalOffset == null) return null;

  if (accessory.type === 'none') return nativeWorkingDistance(system, lens);

  let objectDistance;
  if (accessory.type === 'diopter') {
    const imageDistance = f * (1 + nativeMag);
    objectDistance = imageDistance / magnification;
  } else {
    objectDistance = f * (1 + 1 / magnification);
  }

  const wd = objectDistance - principalOffset;
  return wd > 0 ? wd : null;
}

function sensorToSubjectDistance(system, lens, accessory, workingDistance) {
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

  // Approximate macro DOF with a two-pixel circle of confusion.
  const cocMm = (pitchUm * 2) / 1000;
  return 2 * effectiveFNumber * cocMm / (magnification * magnification);
}

export function calculateCameraSetup({ system, lens, accessory, aperture, megapixels }) {
  const markedAperture = positiveNumber(aperture);
  if (!markedAperture) {
    return { type: 'camera', valid: false, reason: 'Enter a valid aperture.' };
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

  const isZoom = /\d+(?:\.\d+)?[-–]\d+(?:\.\d+)?mm/i.test(lens.name);
  if (workingDistanceMm == null) {
    warnings.push(isZoom
      ? 'Working distance is not modeled for zoom lenses because focal length, physical length and published maximum magnification can refer to different zoom positions.'
      : 'Working distance is unavailable or too uncertain for this lens/setup.');
  }
  if (isZoom && accessory.type !== 'none') {
    warnings.push('Accessory magnification on zoom lenses is approximate and uses the stored focal-length endpoint.');
  }
  if (accessory.type === 'diopter') {
    warnings.push('Close-up-lens magnification and working distance use a thin-lens approximation with the camera lens at native close focus.');
  }
  if (accessory.type === 'tube') {
    warnings.push('Extension-tube estimates assume the lens behaves like a thin lens at its published native maximum magnification.');
  }
  if (accessory.type === 'reversal') {
    warnings.push('Reversed-lens magnification comes from the stored manual estimate; working distance is not modeled.');
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
  const sensorToSubjectMm = positiveNumber(objective.standardFiniteTubeLength) && workingDistanceMm
    ? objective.standardFiniteTubeLength + workingDistanceMm
    : null;
  const sampling = samplingDetails(effectiveFNumber, pitchUm);
  const dofMm = geometricDofMm(magnification, effectiveFNumber, pitchUm);
  const sensorDiagonalMm = Math.hypot(system.sensorWidth, system.sensorHeight);
  const imageCircleMm = positiveNumber(objective.imageCircle_mm);
  const vignette = imageCircleMm ? imageCircleMm < sensorDiagonalMm : null;

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
    warnings: [
      `Assumes the objective is used at its nominal ${objective.standardFiniteTubeLength || 160} mm finite tube length.`
    ]
  };
}
