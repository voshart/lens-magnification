import test from 'node:test';
import assert from 'node:assert/strict';
import {
  diffractionContrastAtFourPixels,
  suggestedDiffractionCrop,
  calculateCameraSetup,
  calculateObjectiveSetup,
  DIFFRACTION_WARNING_CONTRAST
} from '../optics.js';
import { LENSES_BY_SYSTEM, MACRO_ACCESSORIES_DATA, MICROSCOPE_OBJECTIVES_DATA } from '../data.js';

test('ideal circular-aperture MTF is about 39.1% at half its optical cutoff', () => {
  // At f/16 and 550 nm, 4 × 4.4 µm pixels span twice the cutoff period.
  assert.ok(Math.abs(diffractionContrastAtFourPixels(16, 4.4) - 0.3910022189557707) < 1e-12);
});

test('contrast reaches zero at the diffraction cutoff and stays zero beyond it', () => {
  assert.equal(diffractionContrastAtFourPixels(32, 4.4), 0);
  assert.equal(diffractionContrastAtFourPixels(64, 4.4), 0);
});

test('missing or invalid optical inputs cannot be interpreted as zero contrast', () => {
  for (const invalid of [null, undefined, 0, -1, NaN, Infinity, '']) {
    assert.equal(diffractionContrastAtFourPixels(invalid, 4.4), null);
    assert.equal(diffractionContrastAtFourPixels(16, invalid), null);
  }
});

const cropInputs = {
  effectiveFNumber: 64, pitchUm: 4.4, widthPx: 1080, heightPx: 1350,
  sensorWidthMm: 36, sensorHeightMm: 24
};

test('suggested crop clears the output detail guide even beyond the source-pixel cutoff', () => {
  const crop = suggestedDiffractionCrop(cropInputs);
  assert.equal(crop.fitsSensor, true);
  assert.ok(crop.sourceWidthPx > cropInputs.widthPx);
  for (const scale of [crop.sourceWidthPx / 1080, crop.sourceHeightPx / 1350]) {
    assert.ok(diffractionContrastAtFourPixels(64, 4.4 * scale) >= DIFFRACTION_WARNING_CONTRAST);
  }
  assert.ok(Math.abs(crop.sourceWidthPx / crop.sourceHeightPx - 1080 / 1350) < 0.001);
});

test('suggested crop stays at native size when detail already clears the guide', () => {
  assert.deepEqual(suggestedDiffractionCrop({ ...cropInputs, effectiveFNumber: 8 }), {
    sourceWidthPx: 1080, sourceHeightPx: 1350, fitsSensor: true
  });
});

test('larger exports and stronger diffraction can exceed the available sensor crop', () => {
  assert.equal(suggestedDiffractionCrop({ ...cropInputs, widthPx: 2400, heightPx: 3000 }).fitsSensor, false);
  const stronger = suggestedDiffractionCrop({ ...cropInputs, effectiveFNumber: 128 });
  assert.ok(stronger.sourceWidthPx > suggestedDiffractionCrop(cropInputs).sourceWidthPx);
  assert.equal(stronger.fitsSensor, false);
});

test('crop guidance stays unavailable when required inputs are missing or invalid', () => {
  for (const key of Object.keys(cropInputs)) {
    for (const invalid of [null, undefined, 0, -1, NaN, Infinity, '']) {
      assert.equal(suggestedDiffractionCrop({ ...cropInputs, [key]: invalid }), null);
    }
  }
});

const system = LENSES_BY_SYSTEM.sony_e_ff;
const lens = system.lenses.sony_fe_90mm_f2_8_macro_g_oss;
const camera = (accessory, aperture = 8, megapixels = 45) => calculateCameraSetup({
  system, lens, accessory: MACRO_ACCESSORIES_DATA[accessory], aperture, megapixels
});

test('72 mm extension can cross the advisory threshold; opening the aperture can clear it', () => {
  const native = camera('none');
  const extended = camera('et72mm');
  assert.equal(extended.valid, true);
  assert.equal(extended.magnification, 1.8);
  assert.equal(extended.effectiveFNumber, 22.4);
  assert.equal(extended.pupilMagnification, 1);
  assert.equal(extended.pupilMagnificationAssumed, true);
  assert.ok(native.diffractionContrast > DIFFRACTION_WARNING_CONTRAST);
  assert.ok(extended.diffractionContrast < DIFFRACTION_WARNING_CONTRAST);
  assert.deepEqual(extended.apertureRecommendation, {
    aperture: 7.1,
    contrast: extended.apertureRecommendation.contrast,
    clearsThreshold: true
  });
  assert.ok(extended.apertureRecommendation.contrast > DIFFRACTION_WARNING_CONTRAST);
  assert.ok(camera('et72mm', 4).diffractionContrast > DIFFRACTION_WARNING_CONTRAST);
});

test('stored pupil magnification replaces the symmetric-lens assumption', () => {
  const result = calculateCameraSetup({
    system,
    lens: { ...lens, pupilMagnification: 2 },
    accessory: MACRO_ACCESSORIES_DATA.none,
    aperture: 8,
    megapixels: 45
  });
  assert.equal(result.valid, true);
  assert.equal(result.effectiveFNumber, 12);
  assert.equal(result.pupilMagnification, 2);
  assert.equal(result.pupilMagnificationAssumed, false);
});

test('recommendation falls back to the widest aperture when the guide cannot be cleared', () => {
  const m43 = LENSES_BY_SYSTEM.m43;
  const macro90 = m43.lenses.om_system_mzuiko_90mm_f3_5_macro_is_pro;
  const atF11 = calculateCameraSetup({
    system: m43,
    lens: macro90,
    accessory: MACRO_ACCESSORIES_DATA.om_mc_20,
    aperture: 11,
    megapixels: 20
  });
  assert.equal(atF11.apertureRecommendation.aperture, 7.1);
  assert.equal(atF11.apertureRecommendation.clearsThreshold, false);
  assert.ok(atF11.apertureRecommendation.contrast > atF11.diffractionContrast);

  const wideOpen = calculateCameraSetup({
    system: m43,
    lens: macro90,
    accessory: MACRO_ACCESSORIES_DATA.om_mc_20,
    aperture: 7.1,
    megapixels: 20
  });
  assert.equal(wideOpen.apertureRecommendation, null);
});

test('finer sensor sampling lowers contrast at the same four-pixel cycle', () => {
  assert.ok(camera('none', 8, 90).diffractionContrast < camera('none', 8, 45).diffractionContrast);
  assert.equal(camera('none', 8, 0).diffractionContrast, null);
});

test('objective estimates also expose finite contrast between zero and one', () => {
  for (const objective of Object.values(MICROSCOPE_OBJECTIVES_DATA)) {
    const result = calculateObjectiveSetup({ system, objective, megapixels: 45 });
    assert.equal(result.valid, true);
    assert.ok(Number.isFinite(result.diffractionContrast));
    assert.ok(result.diffractionContrast >= 0 && result.diffractionContrast <= 1);
  }
});
