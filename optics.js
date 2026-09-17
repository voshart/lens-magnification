const GREEN_WAVELENGTH_UM = 0.55;
const DIN_160_IMAGE_DISTANCE_MM = 150;
const MAGNIFICATION_EPSILON = 1e-12;
// UI heuristic, not a universal image-quality pass/fail threshold.
export const DIFFRACTION_WARNING_CONTRAST = 0.2;
const THIRD_STOP_APERTURES = [
  0.7, 0.8, 0.9, 1, 1.1, 1.2, 1.4, 1.6, 1.8, 2, 2.2, 2.5, 2.8, 3.2, 3.5,
  4, 4.5, 5, 5.6, 6.3, 7.1, 8, 9, 10, 11, 13, 14, 16, 18, 20, 22, 25, 29,
  32, 36, 40, 45, 51, 57, 64
];

function positiveNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

export function closestMagnificationCandidates(candidates, target) {
  const desired = positiveNumber(target);
  if (!desired || !Array.isArray(candidates)) return [];

  const validCandidates = candidates.filter((candidate) => positiveNumber(candidate?.magnification));
  if (!validCandidates.length) return [];

  const closest = validCandidates.reduce((best, candidate) => {
    const distance = Math.abs(Math.log(candidate.magnification / desired));
    const bestDistance = Math.abs(Math.log(best.magnification / desired));
    return distance < bestDistance ? candidate : best;
  });

  return validCandidates.filter((candidate) => (
    Math.abs(Math.log(candidate.magnification / closest.magnification)) <= MAGNIFICATION_EPSILON
  ));
}

export function closestMagnificationCandidate(candidates, target, preferredLensId = null) {
  const equivalents = closestMagnificationCandidates(candidates, target);
  if (!equivalents.length) return null;

  return equivalents.reduce((best, candidate) => {
    if (!best) return candidate;

    const workingDistance = positiveNumber(candidate.workingDistanceMm) ?? -Infinity;
    const bestWorkingDistance = positiveNumber(best.workingDistanceMm) ?? -Infinity;
    if (workingDistance !== bestWorkingDistance) return workingDistance > bestWorkingDistance ? candidate : best;

    if (candidate.lensId === preferredLensId && best.lensId !== preferredLensId) return candidate;
    return best;
  }, null);
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

    case 'teleconverter':
      return nativeMag * (positiveNumber(accessory.magnification) ?? 1);

    case 'reversal':
      // Reversed-lens behaviour depends strongly on real lens construction.
      // Only use the prototype's researched/manual estimate; do not invent one.
      return parseReversalEstimate(lens.reversedMagEstimateManual, f);

    default:
      return nativeMag;
  }
}

function accessorySupportsLens(lens, accessory) {
  return !Array.isArray(accessory.compatibleLensIds)
    || accessory.compatibleLensIds.includes(lens.id);
}

export function apertureLimits(lens, accessory = { type: 'none' }) {
  if (!lens) return { widest: null, narrowest: null };
  return {
    widest: positiveNumber(accessory.widestAperture) ?? positiveNumber(lens.widestAperture),
    narrowest: positiveNumber(accessory.narrowestAperture) ?? positiveNumber(lens.narrowestAperture)
  };
}

function closeUpWorkingDistanceAtNativeFocus(system, lens, accessory) {
  const nativeWd = nativeWorkingDistance(system, lens);
  const powerPerMm = (positiveNumber(accessory.power) ?? 0) / 1000;
  if (!nativeWd || !powerPerMm) return null;

  // First-order vergence estimate at the host lens's native close-focus setting.
  // Native WD is measured from the host-lens front; the close-up attachment is
  // approximated as thin and in contact at that plane.
  const combinedVergencePerMm = 1 / nativeWd + powerPerMm;
  const wd = 1 / combinedVergencePerMm;
  return wd > 0 ? wd : null;
}

function cameraWorkingDistance(system, lens, accessory, magnification) {
  if (!magnification || magnification <= 0) return null;
  if (accessory.type === 'reversal' || isZoomLens(lens)) return null;

  if (accessory.type === 'diopter') {
    return closeUpWorkingDistanceAtNativeFocus(system, lens, accessory);
  }
  if (accessory.type === 'teleconverter') return nativeWorkingDistance(system, lens);

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
  if (accessory.type === 'teleconverter') {
    return positiveNumber(accessory.minimumFocusDistanceMm);
  }
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

// Ideal unobstructed circular aperture, incoherent light at 550 nm.
// MTF at 0.25 cycles/source pixel: a light/dark cycle spanning four pixels.
// See Optikos, How to Measure MTF and other Properties of Lenses, pp. 46–47.
export function diffractionContrastAtFourPixels(effectiveFNumber, pitchUm) {
  const fNumber = positiveNumber(effectiveFNumber);
  const pitch = positiveNumber(pitchUm);
  if (!fNumber || !pitch) return null;

  const frequencyRatio = GREEN_WAVELENGTH_UM * fNumber / (4 * pitch);
  if (frequencyRatio >= 1) return 0;
  return 2 / Math.PI * (Math.acos(frequencyRatio)
    - frequencyRatio * Math.sqrt(1 - frequencyRatio * frequencyRatio));
}

// Find a wider source crop for a fixed export size. Four output pixels
// cover more sensor area after downsampling; this models diffraction only.
export function suggestedDiffractionCrop({
  effectiveFNumber, pitchUm, widthPx, heightPx, sensorWidthMm, sensorHeightMm
}) {
  if (![effectiveFNumber, pitchUm, widthPx, heightPx, sensorWidthMm, sensorHeightMm]
    .every((value) => positiveNumber(value))) return null;

  let lower = 1;
  let upper = diffractionContrastAtFourPixels(effectiveFNumber, pitchUm) >= DIFFRACTION_WARNING_CONTRAST
    ? 1 : Math.max(1, GREEN_WAVELENGTH_UM * effectiveFNumber / (2 * pitchUm));
  for (let i = 0; i < 50; i += 1) {
    const scale = (lower + upper) / 2;
    if (diffractionContrastAtFourPixels(effectiveFNumber, pitchUm * scale) < DIFFRACTION_WARNING_CONTRAST) {
      lower = scale;
    } else {
      upper = scale;
    }
  }
  const sourceWidthPx = Math.ceil(widthPx * upper);
  const sourceHeightPx = Math.ceil(heightPx * upper);
  return {
    sourceWidthPx,
    sourceHeightPx,
    fitsSensor: sourceWidthPx * pitchUm / 1000 <= sensorWidthMm
      && sourceHeightPx * pitchUm / 1000 <= sensorHeightMm
  };
}

function diffractionApertureRecommendation(
  markedAperture,
  lensSideMagnification,
  pupilMagnification,
  pitchUm,
  limits
) {
  const current = positiveNumber(markedAperture);
  const pupil = positiveNumber(pupilMagnification);
  const pitch = positiveNumber(pitchUm);
  const widest = positiveNumber(limits.widest);
  if (!current || !pupil || !pitch || !widest) return null;

  const choices = [...new Set([...THIRD_STOP_APERTURES, widest])]
    .filter((aperture) => aperture >= widest && aperture < current)
    .sort((a, b) => b - a);
  if (!choices.length) return null;

  const contrastAt = (aperture) => diffractionContrastAtFourPixels(
    aperture * (1 + lensSideMagnification / pupil),
    pitch
  );
  const clearingAperture = choices.find((aperture) => (
    contrastAt(aperture) >= DIFFRACTION_WARNING_CONTRAST
  ));
  const aperture = clearingAperture ?? widest;
  const contrast = contrastAt(aperture);
  return {
    aperture,
    contrast,
    clearsThreshold: contrast >= DIFFRACTION_WARNING_CONTRAST
  };
}

function samplingDetails(effectiveFNumber, pitchUm) {
  if (!effectiveFNumber || !pitchUm) {
    return { airyDiameterUm: null, airyPixels: null, nyquistLpMm: null, diffractionContrast: null };
  }

  const airyDiameterUm = 2.44 * GREEN_WAVELENGTH_UM * effectiveFNumber;
  return {
    airyDiameterUm,
    airyPixels: airyDiameterUm / pitchUm,
    nyquistLpMm: 500 / pitchUm,
    diffractionContrast: diffractionContrastAtFourPixels(effectiveFNumber, pitchUm)
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

  if (!accessorySupportsLens(lens, accessory)) {
    return {
      type: 'camera',
      valid: false,
      reason: `${accessory.name} is not compatible with this lens.`
    };
  }

  if (lens.accessoryModel === false && accessory.type !== 'none') {
    return {
      type: 'camera',
      valid: false,
      reason: 'Accessory stacking is not modeled for this dedicated high-magnification lens preset.'
    };
  }

  const limits = apertureLimits(lens, accessory);
  if (limits.widest && markedAperture < limits.widest) {
    return {
      type: 'camera',
      valid: false,
      reason: `This setup cannot open wider than f/${limits.widest}.`
    };
  }
  if (limits.narrowest && markedAperture > limits.narrowest) {
    return {
      type: 'camera',
      valid: false,
      reason: `This setup cannot stop down beyond f/${limits.narrowest}.`
    };
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
  // A teleconverter's composite f-number is what the camera displays. Its
  // magnification has already been included in that number, so macro bellows
  // factor uses the lens-side magnification rather than multiplying it twice.
  const teleconverterFactor = accessory.type === 'teleconverter'
    ? (positiveNumber(accessory.magnification) ?? 1)
    : 1;
  const lensSideMagnification = magnification / teleconverterFactor;
  // Working f-number is N * (1 + m / P), where P is exit-pupil diameter
  // divided by entrance-pupil diameter. Camera manufacturers rarely publish
  // P, so retain the common symmetric-lens approximation when it is unknown
  // and expose that assumption to the interface instead of implying measured
  // lens-specific performance.
  const catalogPupilMagnification = positiveNumber(lens.pupilMagnification);
  const pupilMagnification = catalogPupilMagnification ?? 1;
  const pupilMagnificationAssumed = catalogPupilMagnification == null;
  const effectiveFNumber = markedAperture * (1 + lensSideMagnification / pupilMagnification);
  const workingDistanceMm = cameraWorkingDistance(system, lens, accessory, magnification);
  const sensorToSubjectMm = sensorToSubjectDistance(system, lens, accessory, workingDistanceMm);
  const fov = fieldOfView(system, magnification);
  const sampling = samplingDetails(effectiveFNumber, pitchUm);
  const apertureRecommendation = Number.isFinite(sampling.diffractionContrast)
    && sampling.diffractionContrast < DIFFRACTION_WARNING_CONTRAST
    ? diffractionApertureRecommendation(
      markedAperture,
      lensSideMagnification,
      pupilMagnification,
      pitchUm,
      limits
    )
    : null;
  const dofMm = geometricDofMm(magnification, effectiveFNumber, pitchUm);
  const warnings = [];

  if (workingDistanceMm == null) {
    warnings.push(zoom
      ? 'Working distance is not modeled for zoom lenses because published dimensions and maximum magnification can refer to different zoom positions.'
      : accessory.type === 'diopter'
        ? 'Close-up-lens working distance cannot be estimated because the host lens native working distance is unavailable or too uncertain.'
        : 'Working distance is unavailable or too uncertain for this lens/setup.');
  }
  if (accessory.type === 'diopter') {
    warnings.push(workingDistanceMm == null
      ? 'Close-up-lens magnification still uses a thin-lens, in-contact approximation with the camera lens at native close focus; actual distance depends on attachment design, spacing, host lens, and focus setting.'
      : 'Close-up-lens working distance is a first-order estimate at the host lens’s native close-focus / maximum-magnification setting. It combines the host native working distance with nominal diopter power and approximates the attachment as thin and in contact at the lens front; real attachment thickness, spacing, principal planes, and internal focusing can shift the result.');
  }
  if (accessory.type === 'tube') {
    warnings.push('Extension-tube magnification and distance estimates assume the lens remains at its published native maximum-magnification setting, with nominal focal length and fixed principal-plane/front-barrel geometry.');
  }
  if (accessory.type === 'teleconverter') {
    warnings.push('Teleconverter magnification, composite aperture and closest-focus distance use the manufacturer-published combination data. Optical sharpness loss from the converter is not modeled.');
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
    pupilMagnification,
    pupilMagnificationAssumed,
    markedAperture,
    widestAperture: limits.widest,
    apertureRecommendation,
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
  const imageCircleEstimated = Boolean(imageCircleMm && objective.imageCircleEstimated);
  const vignette = imageCircleMm ? imageCircleMm < sensorDiagonalMm : null;
  const warnings = [
    'DIN 160 mm is the mechanical objective-to-eyepiece-flange standard; this direct-to-sensor diagram places the intermediate image about 150 mm behind the objective shoulder.'
  ];

  if (!parfocalDistanceMm) {
    warnings.push('Objective body/parfocal geometry is not published for this entry, so sensor-to-subject distance is not shown.');
  }
  if (imageCircleEstimated) {
    warnings.push('The 18 mm field-number/image-circle value is a conservative typical DIN estimate, not a manufacturer specification. The vignette is illustrative and the actual illuminated field may differ.');
  } else if (!imageCircleMm) {
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
    imageCircleEstimated,
    vignette,
    imageDistanceMm,
    parfocalDistanceMm,
    warnings
  };
}
