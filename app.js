import {
  LENSES_BY_SYSTEM,
  MICROSCOPE_OBJECTIVES_DATA,
  MACRO_ACCESSORIES_DATA,
  REFERENCE_OBJECTS
} from './data.js';
import { calculateCameraSetup, calculateObjectiveSetup } from './optics.js';

const $ = (id) => document.getElementById(id);

const elements = {
  system: $('system'),
  lens: $('lens'),
  accessory: $('accessory'),
  aperture: $('aperture'),
  megapixels: $('megapixels'),
  accessoryField: $('accessory-field'),
  apertureField: $('aperture-field'),
  sensorSvg: $('sensor-svg'),
  sensorBg: $('sensor-bg'),
  sensorBorder: $('sensor-border'),
  sensorClipRect: $('sensor-clip-rect'),
  objectLayer: $('object-layer'),
  imageCircleLayer: $('image-circle-layer'),
  sensorCaption: $('sensor-caption'),
  objectLegend: $('object-legend'),
  rigSvg: $('rig-svg'),
  status: $('status'),
  notes: $('notes'),
  imageCircleResult: $('image-circle-result'),
  out: {
    mag: $('out-mag'),
    fov: $('out-fov'),
    wd: $('out-wd'),
    total: $('out-total'),
    effective: $('out-effective'),
    dof: $('out-dof'),
    pitch: $('out-pitch'),
    airy: $('out-airy'),
    airyPx: $('out-airy-px'),
    nyquist: $('out-nyquist'),
    imageCircle: $('out-image-circle')
  }
};

const defaultState = {
  system: 'sony_e_ff',
  lens: 'sony_fe_90mm_f2_8_macro_g_oss',
  accessory: 'none',
  aperture: 8,
  megapixels: 45
};

let megapixelsUserSet = false;

function option(value, label) {
  const el = document.createElement('option');
  el.value = value;
  el.textContent = label;
  return el;
}

function currentSystem() {
  return LENSES_BY_SYSTEM[elements.system.value] ?? null;
}

function currentObjective() {
  return MICROSCOPE_OBJECTIVES_DATA[elements.lens.value] ?? null;
}

function currentLens() {
  return currentSystem()?.lenses?.[elements.lens.value] ?? null;
}

function populateSystems() {
  const entries = Object.entries(LENSES_BY_SYSTEM)
    .sort(([, a], [, b]) => a.systemName.localeCompare(b.systemName));
  elements.system.replaceChildren(...entries.map(([id, data]) => option(id, data.systemName)));
}

function populateLenses(preferredId) {
  const system = currentSystem();
  if (!system) return;

  const lensEntries = Object.entries(system.lenses ?? {})
    .sort(([, a], [, b]) => (a.f ?? 0) - (b.f ?? 0) || a.name.localeCompare(b.name));
  const macroGroup = document.createElement('optgroup');
  macroGroup.label = 'Macro / close-focus lenses';
  const otherGroup = document.createElement('optgroup');
  otherGroup.label = 'Other lenses';

  for (const [id, lens] of lensEntries) {
    (Number(lens.NM) >= 0.5 ? macroGroup : otherGroup).append(option(id, lens.name));
  }

  const objectiveGroup = document.createElement('optgroup');
  objectiveGroup.label = 'Finite 160 mm microscope objectives';
  const objectives = Object.entries(MICROSCOPE_OBJECTIVES_DATA)
    .sort(([, a], [, b]) => a.M_obj - b.M_obj || a.name.localeCompare(b.name));
  for (const [id, objective] of objectives) objectiveGroup.append(option(id, objective.name));

  elements.lens.replaceChildren();
  if (macroGroup.children.length) elements.lens.append(macroGroup);
  if (otherGroup.children.length) elements.lens.append(otherGroup);
  elements.lens.append(objectiveGroup);

  const ids = [...elements.lens.options].map((item) => item.value);
  elements.lens.value = ids.includes(preferredId) ? preferredId : ids[0] ?? '';
}

function populateAccessories() {
  const order = { none: 0, tube: 1, diopter: 2, reversal: 3 };
  const entries = Object.entries(MACRO_ACCESSORIES_DATA)
    .sort(([, a], [, b]) => (order[a.type] ?? 9) - (order[b.type] ?? 9) || (a.length ?? 0) - (b.length ?? 0));
  elements.accessory.replaceChildren(...entries.map(([id, data]) => option(id, data.name)));
}

function loadStateFromUrl() {
  const params = new URLSearchParams(location.search);
  const system = params.get('system');
  const lens = params.get('lens');
  const accessory = params.get('accessory');
  const aperture = Number(params.get('f'));
  const megapixels = Number(params.get('mp'));

  if (system && LENSES_BY_SYSTEM[system]) elements.system.value = system;
  populateLenses(lens || defaultState.lens);

  if (accessory && MACRO_ACCESSORIES_DATA[accessory]) elements.accessory.value = accessory;
  if (Number.isFinite(aperture) && aperture > 0) elements.aperture.value = aperture;
  if (Number.isFinite(megapixels) && megapixels > 0) {
    elements.megapixels.value = megapixels;
    megapixelsUserSet = true;
  }
}

function saveStateToUrl() {
  const params = new URLSearchParams();
  params.set('system', elements.system.value);
  params.set('lens', elements.lens.value);

  if (!currentObjective()) {
    params.set('accessory', elements.accessory.value);
    const aperture = Number(elements.aperture.value);
    if (Number.isFinite(aperture) && aperture > 0) params.set('f', aperture.toString());
  }

  const megapixels = Number(elements.megapixels.value);
  if (Number.isFinite(megapixels) && megapixels > 0) params.set('mp', megapixels.toString());

  history.replaceState(null, '', `${location.pathname}?${params}${location.hash}`);
}

function formatMm(value, digits = 1) {
  if (value == null || !Number.isFinite(value)) return '—';
  if (value < 0.1) return `${(value * 1000).toFixed(value < 0.01 ? 1 : 0)} µm`;
  return `${value.toFixed(digits)} mm`;
}

function formatFov(fov) {
  if (!fov) return '—';
  const digits = Math.max(fov.widthMm, fov.heightMm) < 5 ? 2 : 1;
  return `${fov.widthMm.toFixed(digits)} × ${fov.heightMm.toFixed(digits)} mm`;
}

function formatMag(value) {
  if (!value) return '—';
  return `${value < 10 ? value.toFixed(2) : value.toFixed(1)}×`;
}

function setSvgDimensions(width, height) {
  elements.sensorSvg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  for (const rect of [elements.sensorBg, elements.sensorBorder, elements.sensorClipRect]) {
    rect.setAttribute('width', width);
    rect.setAttribute('height', height);
  }
}

function drawCameraObjects(system, result) {
  const m = result.magnification;
  const { banana, quarter, rice } = REFERENCE_OBJECTS;
  const cx = system.sensorWidth / 2;
  const cy = system.sensorHeight / 2;

  const bananaW = banana.lengthMm * m;
  const bananaH = banana.widthMm * m;
  const bananaX = cx - bananaW / 2;
  const bananaY = cy - bananaH / 2;
  const quarterR = quarter.diameterMm * m / 2;
  const riceW = rice.widthMm * m;
  const riceH = rice.lengthMm * m;

  elements.objectLayer.innerHTML = `
    <g transform="translate(${bananaX} ${bananaY}) scale(${bananaW / 767} ${bananaH / 430})" opacity="0.72">
      <path class="object-fill object-outline" d="M 36 0 C 38 0 44 0 47 4 C 56 13 61 25 66 43 C 72 66 76 92 91 111 C 130 159 193 201 242 230 C 283 254 344 264 402 259 C 463 254 527 233 584 205 C 630 182 677 156 708 133 C 723 122 727 108 741 108 C 751 108 763 119 767 131 C 771 142 763 151 756 161 C 746 176 743 202 733 231 C 719 274 693 311 659 341 C 615 380 562 405 504 418 C 438 433 360 434 293 424 C 233 415 179 393 133 361 C 85 328 48 293 35 253 C 24 218 28 181 32 146 C 37 109 27 85 17 64 C 8 47 -2 33 3 25 C 10 15 24 6 36 0 Z"></path>
    </g>
    <circle class="object-fill-strong object-outline" cx="${cx}" cy="${cy}" r="${quarterR}"></circle>
    <ellipse class="object-fill-strong object-outline" cx="${cx + quarterR * 0.25}" cy="${cy + quarterR * 0.25}" rx="${riceW / 2}" ry="${riceH / 2}" transform="rotate(12 ${cx + quarterR * 0.25} ${cy + quarterR * 0.25})"></ellipse>
  `;

  elements.objectLegend.textContent = 'banana 180 mm · quarter 24.3 mm · rice 6 mm';
}

function drawObjectiveObjects(system, result) {
  const m = result.magnification;
  const { target, tardigrade, rice } = REFERENCE_OBJECTS;
  const cx = system.sensorWidth / 2;
  const cy = system.sensorHeight / 2;
  const targetSize = target.sizeMm * m;
  const tardiW = tardigrade.widthMm * m;
  const tardiH = tardigrade.lengthMm * m;
  const riceW = rice.widthMm * m;
  const riceH = rice.lengthMm * m;

  elements.objectLayer.innerHTML = `
    <rect class="object-fill object-outline" x="${cx - targetSize / 2}" y="${cy - targetSize / 2}" width="${targetSize}" height="${targetSize}"></rect>
    <g transform="translate(${cx - tardiW / 2} ${cy - tardiH / 2}) scale(${tardiW / 200} ${tardiH / 160})">
      <path class="object-fill-strong object-outline" d="M126 31 L147 32 L165 37 L171 50 L175 60 L166 72 L155 82 L144 87 L139 100 L142 109 L134 102 L130 101 L126 107 L124 98 L119 96 L119 113 L113 110 L99 99 L93 101 L90 112 L93 118 L82 116 L77 111 L68 107 L55 115 L54 106 L45 119 L41 130 L38 114 L32 118 L30 115 L26 124 L25 115 L21 125 L21 118 L26 112 L19 94 L20 87 L24 75 L37 60 L49 51 L67 42 L94 35 L114 35 Z"></path>
    </g>
    <ellipse class="object-fill-strong object-outline" cx="${cx + system.sensorWidth * 0.23}" cy="${cy + system.sensorHeight * 0.2}" rx="${riceW / 2}" ry="${riceH / 2}" transform="rotate(12 ${cx + system.sensorWidth * 0.23} ${cy + system.sensorHeight * 0.2})"></ellipse>
  `;

  elements.objectLegend.textContent = '1 mm square · tardigrade 0.4 mm · rice 6 mm';
}

function drawImageCircle(system, result) {
  elements.imageCircleLayer.replaceChildren();
  if (result.type !== 'objective' || !result.imageCircleMm) return;

  const cx = system.sensorWidth / 2;
  const cy = system.sensorHeight / 2;
  const r = result.imageCircleMm / 2;
  const outer = `M0 0H${system.sensorWidth}V${system.sensorHeight}H0Z`;
  const inner = `M${cx + r} ${cy} A${r} ${r} 0 1 0 ${cx - r} ${cy} A${r} ${r} 0 1 0 ${cx + r} ${cy}`;
  elements.imageCircleLayer.innerHTML = `
    <path class="image-circle-mask" d="${outer} ${inner}"></path>
    <circle class="image-circle-line" cx="${cx}" cy="${cy}" r="${r}"></circle>
  `;
}

function renderSensor(system, result) {
  setSvgDimensions(system.sensorWidth, system.sensorHeight);
  elements.objectLayer.replaceChildren();
  elements.imageCircleLayer.replaceChildren();

  if (!result.valid) {
    elements.sensorCaption.textContent = result.reason;
    elements.objectLegend.textContent = '';
    return;
  }

  if (result.type === 'objective') drawObjectiveObjects(system, result);
  else drawCameraObjects(system, result);
  drawImageCircle(system, result);

  elements.sensorCaption.textContent = `${system.sensorWidth} × ${system.sensorHeight} mm sensor · ${formatFov(result.fov)} subject field`;
}

function svgEscape(text) {
  return String(text).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[char]));
}

function segmentWidths(blocks, usableWidth) {
  const bases = blocks.map((item) => item.type === 'block' ? 34 : 10);
  const baseTotal = bases.reduce((sum, value) => sum + value, 0);
  const valueTotal = blocks.reduce((sum, item) => sum + Math.max(0, Number(item.value) || 0), 0);
  const extra = Math.max(0, usableWidth - baseTotal);

  return blocks.map((item, index) => bases[index] + (valueTotal ? extra * item.value / valueTotal : 0));
}

function renderRig(system, lensOrObjective, accessory, result) {
  if (!result.valid) {
    elements.rigSvg.innerHTML = '';
    return;
  }

  const width = Math.max(300, Math.round(elements.rigSvg.clientWidth || 1000));
  elements.rigSvg.setAttribute('viewBox', `0 0 ${width} 92`);
  const left = 12;
  const right = width - 12;
  const y = 47;
  let blocks;

  if (result.type === 'objective') {
    const body = lensOrObjective.PL_obj_body_mm ?? 40;
    blocks = [
      { label: `WD ${formatMm(result.workingDistanceMm, 1)}`, value: result.workingDistanceMm ?? 0, type: 'space' },
      { label: `${lensOrObjective.M_obj}×`, value: body, type: 'block' },
      { label: `${result.imageDistanceMm ?? 150} mm image distance`, value: result.imageDistanceMm ?? 150, type: 'space' }
    ];
  } else {
    const wd = result.workingDistanceMm;
    const lensLength = lensOrObjective.PL ?? 60;
    const extension = accessory.type === 'tube' ? (accessory.length ?? 0) : 0;
    const flange = system.flangeDistance ?? 18;
    blocks = [
      { label: wd == null ? 'WD unknown' : `WD ${formatMm(wd, 0)}`, value: wd ?? Math.max(lensLength * 0.8, 30), type: 'space', uncertain: wd == null },
      { label: 'lens', value: lensLength, type: 'block' },
      ...(extension > 0 ? [{ label: `${extension} mm`, value: extension, type: 'block' }] : []),
      { label: `${flange} mm`, value: flange, type: 'block' }
    ];
  }

  const widths = segmentWidths(blocks, right - left);
  let x = left;
  const pieces = [
    `<line class="rig-line" x1="${left}" y1="${y}" x2="${right}" y2="${y}"></line>`,
    `<line class="rig-line" x1="${left}" y1="20" x2="${left}" y2="74"></line>`,
    `<text class="rig-text-muted" x="${left}" y="15">subject</text>`
  ];

  blocks.forEach((item, index) => {
    const width = widths[index];
    if (item.type === 'space') {
      pieces.push(`<line class="rig-line ${item.uncertain ? 'rig-dashed' : ''}" x1="${x}" y1="${y}" x2="${x + width}" y2="${y}"></line>`);
      pieces.push(`<text class="rig-text-muted" text-anchor="middle" x="${x + width / 2}" y="${y - 9}">${svgEscape(item.label)}</text>`);
    } else {
      pieces.push(`<rect class="rig-block" x="${x}" y="${y - 15}" width="${width}" height="30"></rect>`);
      pieces.push(`<text class="rig-text" text-anchor="middle" x="${x + width / 2}" y="${y + 4}">${svgEscape(item.label)}</text>`);
    }
    x += width;
  });

  pieces.push(`<line class="rig-line" x1="${right}" y1="20" x2="${right}" y2="74"></line>`);
  pieces.push(`<text class="rig-text-muted" text-anchor="end" x="${right}" y="87">sensor</text>`);
  elements.rigSvg.innerHTML = pieces.join('');
}

function renderResults(result, objective) {
  const out = elements.out;

  if (!result.valid) {
    elements.imageCircleResult.hidden = true;
    for (const node of Object.values(out)) node.textContent = '—';
    elements.status.textContent = result.reason;
    elements.notes.replaceChildren();
    return;
  }

  out.mag.textContent = formatMag(result.magnification);
  out.fov.textContent = formatFov(result.fov);
  const wdDigits = Number.isFinite(result.workingDistanceMm) && result.workingDistanceMm < 10 ? 2 : 0;
  out.wd.textContent = formatMm(result.workingDistanceMm, wdDigits);
  out.total.textContent = formatMm(result.sensorToSubjectMm, 0);
  out.effective.textContent = `f/${result.effectiveFNumber.toFixed(1)}`;
  out.dof.textContent = formatMm(result.dofMm, result.dofMm < 1 ? 2 : 1);
  out.pitch.textContent = result.pixelPitchUm ? `${result.pixelPitchUm.toFixed(2)} µm` : '—';
  out.airy.textContent = result.airyDiameterUm ? `${result.airyDiameterUm.toFixed(1)} µm` : '—';
  out.airyPx.textContent = result.airyPixels ? `${result.airyPixels.toFixed(1)} px` : '—';
  out.nyquist.textContent = result.nyquistLpMm ? `${result.nyquistLpMm.toFixed(0)} lp/mm` : '—';

  elements.imageCircleResult.hidden = result.type !== 'objective';
  if (result.type === 'objective') {
    out.imageCircle.textContent = result.imageCircleMm
      ? `${result.imageCircleMm.toFixed(0)} mm${result.vignette ? ' · vignettes' : ''}`
      : '—';
  }

  elements.status.textContent = result.vignette ? 'Objective image circle does not cover the full sensor.' : '';

  const notes = [...result.warnings];
  if (result.type === 'camera') {
    notes.unshift('Effective aperture assumes pupil magnification = 1; internal-focus, retrofocus and reversed lenses can differ.');
    notes.push('Working distance uses catalog MFD and barrel length plus a thin-lens principal-plane estimate. Lenses that extend while focusing can be shorter in practice.');
  } else if (objective) {
    notes.unshift(`${objective.isPlan ? 'Plan' : 'Non-plan'} objective · NA ${objective.NA}${objective.sourceRef ? ` · ${objective.sourceRef}` : ''}.`);
  }
  notes.push('DOF is geometric defocus for a two-pixel circle of confusion; diffraction is shown separately as Airy diameter.');

  elements.notes.replaceChildren(...notes.map((note) => {
    const p = document.createElement('p');
    p.textContent = note;
    return p;
  }));
}

function calculate() {
  const system = currentSystem();
  const objective = currentObjective();
  const megapixels = Number(elements.megapixels.value);

  if (!system) return null;
  if (objective) return calculateObjectiveSetup({ system, objective, megapixels });

  const lens = currentLens();
  const accessory = MACRO_ACCESSORIES_DATA[elements.accessory.value] ?? MACRO_ACCESSORIES_DATA.none;
  if (!lens) return null;

  return calculateCameraSetup({
    system,
    lens,
    accessory,
    aperture: Number(elements.aperture.value),
    megapixels
  });
}

function render() {
  const system = currentSystem();
  const objective = currentObjective();
  const lens = currentLens();
  const accessory = MACRO_ACCESSORIES_DATA[elements.accessory.value] ?? MACRO_ACCESSORIES_DATA.none;
  const result = calculate();
  if (!system || !result) return;

  elements.accessoryField.hidden = Boolean(objective);
  elements.apertureField.hidden = Boolean(objective);

  renderSensor(system, result);
  renderResults(result, objective);
  renderRig(system, objective || lens, accessory, result);
  saveStateToUrl();
}

function handleSystemChange() {
  const previousLens = elements.lens.value;
  populateLenses(previousLens);
  const system = currentSystem();
  if (!megapixelsUserSet && system?.typicalMegapixels) elements.megapixels.value = system.typicalMegapixels;
  render();
}

populateSystems();
elements.system.value = defaultState.system;
populateAccessories();
elements.accessory.value = defaultState.accessory;
elements.aperture.value = defaultState.aperture;
elements.megapixels.value = defaultState.megapixels;
loadStateFromUrl();

elements.lens.addEventListener('change', render);
elements.accessory.addEventListener('change', render);
elements.aperture.addEventListener('input', render);
elements.megapixels.addEventListener('input', () => {
  megapixelsUserSet = true;
  render();
});
elements.system.addEventListener('change', handleSystemChange);
window.addEventListener('resize', render);

render();
