import test from 'node:test';
import assert from 'node:assert/strict';
import { cameraNavigationSetup, calculateCameraSetup, closestMagnificationCandidate } from '../optics.js';
import { LENSES_BY_SYSTEM, MACRO_ACCESSORIES_DATA } from '../data.js';

const system = LENSES_BY_SYSTEM.m43;
const mc20 = MACRO_ACCESSORIES_DATA.om_mc_20;
const macro90 = system.lenses.om_system_mzuiko_90mm_f3_5_macro_is_pro;
const navigate = (lens, accessory = mc20, aperture = 7.1) =>
  cameraNavigationSetup({ system, lens, accessory, aperture, megapixels: 22 });

test('reported MC-20 setup can navigate below 4× even with the old f/7.1 URL', () => {
  for (const aperture of [7.1, 10]) {
    const candidates = Object.values(system.lenses).map(lens => {
      const setup = navigate(lens, mc20, aperture);
      return { lens, ...setup, magnification: setup.result.magnification };
    });
    assert.ok(Math.min(...candidates.map(candidate => candidate.magnification)) < 1);
    const selected = closestMagnificationCandidate(candidates, 1);
    assert.equal(selected.magnification, 1);
    assert.equal(selected.accessory.type, 'none');
    assert.equal(calculateCameraSetup({ system, ...selected, megapixels: 22 }).valid, true);
  }
});

test('navigation retains compatible MC-20 and corrects its aperture', () => {
  const setup = navigate(macro90);
  assert.equal(setup.accessory, mc20);
  assert.equal(setup.aperture, 10);
  assert.equal(setup.result.magnification, 4);
});

test('narrow aperture and incompatible accessory do not hide dedicated macro endpoints', () => {
  const lens = system.lenses.laowa_aksen_17_5mm_f1_7_5x;
  const setup = navigate(lens, mc20, 22);
  assert.equal(setup.accessory.type, 'none');
  assert.equal(setup.aperture, 5.6);
  assert.equal(setup.result.magnification, 5);
});

test('navigation keeps an accessory and aperture when the destination supports both', () => {
  const accessory = Object.values(MACRO_ACCESSORIES_DATA).find(item => item.type === 'tube');
  const lens = system.lenses.olympus_mzuiko_60mm_f2_8_macro;
  const setup = navigate(lens, accessory, 8);
  assert.equal(setup.accessory, accessory);
  assert.equal(setup.aperture, 8);
  assert.ok(setup.result.magnification > lens.NM);
});
