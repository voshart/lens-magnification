import test from 'node:test';
import assert from 'node:assert/strict';
import { apertureLimits, calculateCameraSetup } from '../optics.js';
import { LENSES_BY_SYSTEM, MACRO_ACCESSORIES_DATA } from '../data.js';

const none = MACRO_ACCESSORIES_DATA.none;

test('every catalog camera lens has a widest aperture parsed from its name or stored explicitly', () => {
  for (const [systemId, system] of Object.entries(LENSES_BY_SYSTEM)) {
    for (const [lensId, lens] of Object.entries(system.lenses)) {
      assert.ok(lens.widestAperture > 0, `${systemId}/${lensId} has no widest aperture`);
    }
  }
});

test('a marked aperture wider than the selected lens is rejected', () => {
  const system = LENSES_BY_SYSTEM.nikon_z_ff;
  const lens = system.lenses.nikon_z_mc_105mm_f2_8_vr_s;
  const result = calculateCameraSetup({ system, lens, accessory: none, aperture: 1.4, megapixels: 45 });
  assert.equal(result.valid, false);
  assert.match(result.reason, /cannot open wider than f\/2\.8/);
});

test('Aksen endpoints and documented aperture ranges are present on Nikon Z', () => {
  const lenses = LENSES_BY_SYSTEM.nikon_z_ff.lenses;
  assert.equal(lenses.laowa_aksen_45mm_f2_8_1x.NM, 1);
  assert.equal(lenses.laowa_aksen_45mm_f2_8_5x.NM, 5);
  assert.equal(lenses.laowa_aksen_17_5mm_f1_7_5x.NM, 5);
  assert.equal(lenses.laowa_aksen_17_5mm_f1_7_10x.NM, 10);
  assert.deepEqual(apertureLimits(lenses.laowa_aksen_45mm_f2_8_5x, none), { widest: 2.8, narrowest: 11 });
  assert.deepEqual(apertureLimits(lenses.laowa_aksen_17_5mm_f1_7_10x, none), { widest: 1.7, narrowest: 5.6 });

  const tooNarrow = calculateCameraSetup({
    system: LENSES_BY_SYSTEM.nikon_z_ff,
    lens: lenses.laowa_aksen_17_5mm_f1_7_10x,
    accessory: none,
    aperture: 8,
    megapixels: 45
  });
  assert.equal(tooNarrow.valid, false);
  assert.match(tooNarrow.reason, /cannot stop down beyond f\/5\.6/);
});

test('Aksen full-frame mount choices propagate to matching crop-sensor systems', () => {
  for (const systemId of ['sony_e_apsc', 'nikon_z_apsc', 'canon_rf_apsc']) {
    assert.ok(LENSES_BY_SYSTEM[systemId].lenses.laowa_aksen_45mm_f2_8_1x);
    assert.ok(LENSES_BY_SYSTEM[systemId].lenses.laowa_aksen_17_5mm_f1_7_10x);
  }
});

test('MC-14 and MC-20 model the official 90 mm S-MACRO combinations', () => {
  const system = LENSES_BY_SYSTEM.m43;
  const lens = system.lenses.om_system_mzuiko_90mm_f3_5_macro_is_pro;
  const mc14 = MACRO_ACCESSORIES_DATA.om_mc_14;
  const mc20 = MACRO_ACCESSORIES_DATA.om_mc_20;
  assert.deepEqual(apertureLimits(lens, mc14), { widest: 5, narrowest: 22 });
  assert.deepEqual(apertureLimits(lens, mc20), { widest: 7.1, narrowest: 22 });

  const with14 = calculateCameraSetup({ system, lens, accessory: mc14, aperture: 5, megapixels: 20 });
  assert.equal(with14.valid, true);
  assert.equal(with14.magnification, 2.8);
  assert.equal(with14.effectiveFNumber, 15);
  assert.equal(with14.sensorToSubjectMm, 239);

  const with20 = calculateCameraSetup({ system, lens, accessory: mc20, aperture: 7.1, megapixels: 20 });
  assert.equal(with20.valid, true);
  assert.equal(with20.magnification, 4);
  assert.ok(Math.abs(with20.effectiveFNumber - 21.3) < 1e-12);
  assert.equal(with20.sensorToSubjectMm, 250);
});

test('OM teleconverters are rejected on incompatible lenses', () => {
  const system = LENSES_BY_SYSTEM.m43;
  const result = calculateCameraSetup({
    system,
    lens: system.lenses.olympus_mzuiko_60mm_f2_8_macro,
    accessory: MACRO_ACCESSORIES_DATA.om_mc_14,
    aperture: 5,
    megapixels: 20
  });
  assert.equal(result.valid, false);
  assert.match(result.reason, /not compatible/);
});
