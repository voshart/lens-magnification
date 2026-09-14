import {
  LENSES_BY_SYSTEM,
  MICROSCOPE_OBJECTIVES_DATA,
  OPTIC_CATALOG,
  ACCESSORY_CATALOG,
  MACRO_ACCESSORIES_DATA,
  REFERENCE_OBJECTS
} from './data.js';
import {
  calculateCameraSetup,
  calculateObjectiveSetup,
  closestMagnificationCandidate,
  closestMagnificationCandidates
} from './optics.js';

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
  magnificationSlider: $('magnification-slider'),
  magnificationNotches: $('magnification-notches'),
  magnificationTarget: $('magnification-target'),
  magnificationMin: $('magnification-min'),
  magnificationMax: $('magnification-max'),
  magnificationMatch: $('magnification-match'),
  equivalentLens: $('equivalent-lens'),
  out: {
    mag: $('out-mag'),
    fov: $('out-fov'),
    wd: $('out-wd'),
    total: $('out-total'),
    effective: $('out-effective'),
    dof: $('out-dof'),
    pitch: $('out-pitch'),
    subjectPitch: $('out-subject-pitch'),
    airy: $('out-airy'),
    airyPx: $('out-airy-px'),
    subjectAiry: $('out-subject-airy'),
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
let requestedMagnification = null;
let equivalentPreference = null;

const QUARTER_ARTWORK_HREF = './Coin-Face_low-contrast-grey-circle.svg';
const BANANA_ARTWORK_HREF = './banana-optimized-5kb.svg';

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

function isZoomLens(lens) {
  return Boolean(lens && /\d+(?:\.\d+)?[-–]\d+(?:\.\d+)?mm/i.test(lens.name));
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

function accessorySortValue(accessory) {
  if (accessory.type === 'diopter') return Number(accessory.power) || 0;
  if (accessory.type === 'tube') return Number(accessory.length) || 0;
  return 0;
}

function accessoryDisplayName(accessory) {
  const name = accessory?.name ?? '';
  if (accessory?.type !== 'diopter') return name;
  return name
    .replace(/\s+Close-Up Lens\b/gi, '')
    .replace(/\s+Close-Up\b/gi, '');
}

function populateAccessories() {
  const order = { none: 0, tube: 1, diopter: 2, reversal: 3 };
  const entries = Object.entries(MACRO_ACCESSORIES_DATA)
    .sort(([, a], [, b]) => (
      (order[a.type] ?? 9) - (order[b.type] ?? 9)
      || accessorySortValue(a) - accessorySortValue(b)
      || accessoryDisplayName(a).localeCompare(accessoryDisplayName(b))
    ));

  const tubeGroup = document.createElement('optgroup');
  tubeGroup.label = 'Extension tubes';
  const closeUpGroup = document.createElement('optgroup');
  closeUpGroup.label = 'Close-up lenses';
  const otherGroup = document.createElement('optgroup');
  otherGroup.label = 'Other accessories';
  let noneOption = option('none', MACRO_ACCESSORIES_DATA.none?.name ?? 'No Accessory');

  for (const [id, data] of entries) {
    if (data.type === 'none') {
      noneOption = option(id, data.name);
      continue;
    }
    const group = data.type === 'tube'
      ? tubeGroup
      : data.type === 'diopter'
        ? closeUpGroup
        : otherGroup;
    group.append(option(id, accessoryDisplayName(data)));
  }

  elements.accessory.replaceChildren(noneOption);
  for (const group of [tubeGroup, closeUpGroup, otherGroup]) {
    if (group.children.length) elements.accessory.append(group);
  }
}

function setFieldAvailability(field, control, available, unavailableText) {
  field.classList.toggle('is-unavailable', !available);
  control.disabled = !available;

  if (available) {
    delete field.dataset.unavailable;
    control.removeAttribute('aria-label');
    control.removeAttribute('title');
    return;
  }

  field.dataset.unavailable = unavailableText;
  const fieldName = field.querySelector('span')?.textContent || control.name;
  control.setAttribute('aria-label', `${fieldName}: ${unavailableText}`);
  control.setAttribute('title', unavailableText);
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

function referenceObjectAnchor(system) {
  return {
    x: system.sensorWidth / 2,
    y: system.sensorHeight / 2
  };
}

/*
 * Preview unit contract:
 * - The outer sensor SVG uses sensor-plane millimetres as its user units.
 * - Reference-object data uses real subject-space millimetres.
 * - Projected size on the sensor is subject size × optical magnification.
 *
 * Keeping source artwork inside a nested SVG isolates its arbitrary vector or
 * raster coordinates from the sensor coordinate system. An image subject can
 * provide imageViewBox for its full source canvas and artworkViewBox for the crop
 * representing lengthMm.
 */
function referenceArtworkMarkup({ subject, system, magnification, vectorMarkup = '', imageHref = null }) {
  const [sourceX, sourceY, sourceWidth, sourceHeight] = subject.artworkViewBox ?? [];
  if (![sourceX, sourceY, sourceWidth, sourceHeight].every(Number.isFinite)) return '';
  if (sourceWidth <= 0 || sourceHeight <= 0 || !Number.isFinite(subject.lengthMm)) return '';

  const artworkLengthUnits = subject.artworkLengthUnits ?? sourceWidth;
  if (!Number.isFinite(artworkLengthUnits) || artworkLengthUnits <= 0) return '';
  const artworkScale = subject.lengthMm * magnification / artworkLengthUnits;
  const projectedWidth = sourceWidth * artworkScale;
  const projectedHeight = sourceHeight * artworkScale;
  const anchor = referenceObjectAnchor(system);
  const x = anchor.x - projectedWidth / 2;
  const y = anchor.y - projectedHeight / 2;
  let content = vectorMarkup;
  if (imageHref) {
    const [imageX, imageY, imageWidth, imageHeight] = subject.imageViewBox ?? subject.artworkViewBox;
    content = `<image href="${svgEscape(imageHref)}" x="${imageX}" y="${imageY}" width="${imageWidth}" height="${imageHeight}" preserveAspectRatio="none"></image>`;
  }

  return `
    <svg x="${x}" y="${y}" width="${projectedWidth}" height="${projectedHeight}" viewBox="${sourceX} ${sourceY} ${sourceWidth} ${sourceHeight}" preserveAspectRatio="xMidYMid meet" overflow="${imageHref ? 'hidden' : 'visible'}" aria-hidden="true">
      ${content}
    </svg>`;
}

function quarterArtworkMarkup(system, magnification) {
  const size = REFERENCE_OBJECTS.quarter.diameterMm * magnification;
  const anchor = referenceObjectAnchor(system);

  return `<image class="preview-quarter" href="${QUARTER_ARTWORK_HREF}" x="${anchor.x - size / 2}" y="${anchor.y - size / 2}" width="${size}" height="${size}" preserveAspectRatio="xMidYMid meet" aria-hidden="true"></image>`;
}

function drawCameraObjects(system, result) {
  const m = result.magnification;
  const { banana, rice } = REFERENCE_OBJECTS;

  const riceW = rice.widthMm * m;
  const riceH = rice.lengthMm * m;
  const riceAnchor = referenceObjectAnchor(system);
  const quarterMarkup = quarterArtworkMarkup(system, m);
  const bananaMarkup = referenceArtworkMarkup({
    subject: banana,
    system,
    magnification: m,
    imageHref: BANANA_ARTWORK_HREF
  });

  elements.objectLayer.innerHTML = `
    ${quarterMarkup}
    ${bananaMarkup}
    <ellipse class="preview-rice object-outline" cx="${riceAnchor.x}" cy="${riceAnchor.y}" rx="${riceW / 2}" ry="${riceH / 2}" transform="rotate(12 ${riceAnchor.x} ${riceAnchor.y})"></ellipse>
  `;

  elements.objectLegend.textContent = 'banana ≈180 mm · US quarter 24.26 mm · rice ≈6 mm';
}

function drawObjectiveObjects(system, result) {
  const m = result.magnification;
  const { target, tardigrade, rice } = REFERENCE_OBJECTS;
  const cx = system.sensorWidth / 2;
  const cy = system.sensorHeight / 2;
  const targetSize = target.sizeMm * m;
  const riceW = rice.widthMm * m;
  const riceH = rice.lengthMm * m;
  const riceAnchor = referenceObjectAnchor(system);
  const showTardigrade = m >= 10;
  const quarterMarkup = quarterArtworkMarkup(system, m);
  const targetMarkup = showTardigrade ? '' : `
    <rect class="preview-target object-outline" x="${cx - targetSize / 2}" y="${cy - targetSize / 2}" width="${targetSize}" height="${targetSize}"></rect>`;
  const tardigradeMarkup = showTardigrade ? referenceArtworkMarkup({
    subject: tardigrade,
    system,
    magnification: m,
    vectorMarkup: `
        <path class="preview-tardigrade" d="M126 31 L147 32 L165 37 L171 50 L175 60 L166 72 L155 82 L144 87 L139 100 L142 109 L134 102 L130 101 L126 107 L124 98 L119 96 L119 113 L113 110 L99 99 L93 101 L90 112 L93 118 L82 116 L77 111 L68 107 L55 115 L54 106 L45 119 L41 130 L38 114 L32 118 L30 115 L26 124 L25 115 L21 125 L21 118 L26 112 L19 94 L20 87 L24 75 L37 60 L49 51 L67 42 L94 35 L114 35 Z"></path>
        <polyline class="preview-tardigrade-detail" points="26.83,107.37 34.51,103.53 38.67,109.93 41.22,113.12 47.30,112.81"></polyline>
        <polyline class="preview-tardigrade-detail" points="53.05,101.61 48.58,91.06 60.41,88.83 66.80,90.74"></polyline>
        <polyline class="preview-tardigrade-detail" points="76.04,109.40 83.05,102.09 93.10,101.48"></polyline>
        <polyline class="preview-tardigrade-detail" points="75.13,59.46 69.34,77.12 72.39,84.74 80.61,93.26 92.79,97.53 95.23,99.96 98.88,93.26 103.14,86.26 100.10,78.95 97.97,74.38 94.92,72.86 83.05,77.43 81.52,82.30"></polyline>
        <polyline class="preview-tardigrade-detail" points="111.32,46.80 109.80,64.46 109.50,71.77 114.67,79.08 119.55,90.96"></polyline>
        <polyline class="preview-tardigrade-detail" points="133.86,88.83 141.77,77.56 138.42,68.42 133.55,58.68 133.25,53.50 131.12,51.37 136.60,45.59"></polyline>
        <polyline class="preview-tardigrade-detail" points="174.64,59.40 167.94,60.32 167.03,50.57 170.37,52.40"></polyline>
        <polyline class="preview-tardigrade-detail" points="163.07,72.19 153.63,60.01 151.80,46.62"></polyline>
        <line class="preview-tardigrade-detail" x1="101.93" y1="98.82" x2="113.50" y2="95.78"></line>
        <polyline class="preview-tardigrade-detail" points="56.25,102.47 63.56,104.91 71.48,97.60"></polyline>`
  }) : '';

  elements.objectLayer.innerHTML = `
    ${quarterMarkup}
    ${targetMarkup}
    <ellipse class="preview-rice object-outline" cx="${riceAnchor.x}" cy="${riceAnchor.y}" rx="${riceW / 2}" ry="${riceH / 2}" transform="rotate(12 ${riceAnchor.x} ${riceAnchor.y})"></ellipse>
    ${tardigradeMarkup}
  `;

  elements.objectLegend.textContent = showTardigrade
    ? 'US quarter 24.26 mm · tardigrade ≈0.4 mm · rice ≈6 mm'
    : 'US quarter 24.26 mm · 1 mm square · rice ≈6 mm';
}

function drawImageCircle(system, result) {
  elements.imageCircleLayer.replaceChildren();
  if (result.type !== 'objective' || !result.imageCircleMm) return;

  const cx = system.sensorWidth / 2;
  const cy = system.sensorHeight / 2;
  const r = result.imageCircleMm / 2;
  const feather = Math.min(0.9, Math.max(0.35, r * 0.07));
  const gradientRadius = r + feather;
  const clearOffset = Math.max(0, (r - feather) / gradientRadius);
  const edgeOffset = r / gradientRadius;
  elements.imageCircleLayer.innerHTML = `
    <defs>
      <radialGradient id="image-circle-vignette" gradientUnits="userSpaceOnUse" cx="${cx}" cy="${cy}" r="${gradientRadius}" spreadMethod="pad">
        <stop offset="${clearOffset}" stop-color="#000" stop-opacity="0"></stop>
        <stop offset="${edgeOffset}" stop-color="#000" stop-opacity="0.425"></stop>
        <stop offset="1" stop-color="#000" stop-opacity="0.85"></stop>
      </radialGradient>
    </defs>
    <rect class="image-circle-vignette" x="0" y="0" width="${system.sensorWidth}" height="${system.sensorHeight}"></rect>
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
    const bodyKnown = Number.isFinite(lensOrObjective.PL_obj_body_mm) && lensOrObjective.PL_obj_body_mm > 0;
    const body = bodyKnown ? lensOrObjective.PL_obj_body_mm : 40;
    blocks = [
      { label: `WD ${formatMm(result.workingDistanceMm, 1)}`, value: result.workingDistanceMm ?? 0, type: 'space' },
      { label: `${lensOrObjective.M_obj}×`, value: body, type: 'block', uncertain: !bodyKnown },
      { label: `${result.imageDistanceMm ?? 150} mm image distance`, value: result.imageDistanceMm ?? 150, type: 'space' }
    ];
  } else {
    const wd = result.workingDistanceMm;
    const lensLength = lensOrObjective.PL ?? 60;
    const extension = accessory.type === 'tube' ? (accessory.length ?? 0) : 0;
    const isCloseUp = accessory.type === 'diopter';
    const isEstimatedDistance = accessory.type === 'tube' || isCloseUp;
    const power = Number(accessory.power);
    const flange = system.flangeDistance ?? 18;
    const wdLabel = wd == null
      ? 'WD unknown'
      : `${isEstimatedDistance ? 'WD ≈' : 'WD '}${formatMm(wd, 0)}`;
    blocks = [
      { label: wdLabel, value: wd ?? Math.max(lensLength * 0.8, 30), type: 'space', uncertain: wd == null || isEstimatedDistance },
      ...(isCloseUp ? [{ label: Number.isFinite(power) ? `+${power} D` : 'diopter', value: 1, type: 'block' }] : []),
      { label: 'lens', value: lensLength, type: 'block', uncertain: !lensOrObjective.PL },
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
    const blockWidth = widths[index];
    if (item.type === 'space') {
      pieces.push(`<line class="rig-line ${item.uncertain ? 'rig-dashed' : ''}" x1="${x}" y1="${y}" x2="${x + blockWidth}" y2="${y}"></line>`);
      pieces.push(`<text class="rig-text-muted" text-anchor="middle" x="${x + blockWidth / 2}" y="${y - 9}">${svgEscape(item.label)}</text>`);
    } else {
      pieces.push(`<rect class="rig-block ${item.uncertain ? 'rig-dashed' : ''}" x="${x}" y="${y - 15}" width="${blockWidth}" height="30"></rect>`);
      pieces.push(`<text class="rig-text" text-anchor="middle" x="${x + blockWidth / 2}" y="${y + 4}">${svgEscape(item.label)}</text>`);
    }
    x += blockWidth;
  });

  pieces.push(`<line class="rig-line" x1="${right}" y1="20" x2="${right}" y2="74"></line>`);
  pieces.push(`<text class="rig-text-muted" text-anchor="end" x="${right}" y="87">sensor</text>`);
  elements.rigSvg.innerHTML = pieces.join('');
}

function catalogSummary(lens, objective) {
  if (objective) {
    return `${objective.M_obj}× · NA ${objective.NA} · WD ${formatMm(objective.WD_obj_mm, objective.WD_obj_mm < 10 ? 2 : 1)}`;
  }
  if (!lens) return '';

  const bits = [`${formatMag(lens.NM)} max`];
  if (!isZoomLens(lens)) {
    if (Number.isFinite(lens.MFD) && lens.MFD > 0) bits.push(`MFD ${formatMm(lens.MFD, 0)}`);
    if (Number.isFinite(lens.PL) && lens.PL > 0) bits.push(`length ${formatMm(lens.PL, 1)}`);
  } else if (Number.isFinite(lens.maxMagnificationMFD) && lens.maxMagnificationMFD > 0) {
    bits.push(`MFD at max ${formatMm(lens.maxMagnificationMFD, 0)}`);
  }
  return bits.join(' · ');
}

function catalogNodes(lens, objective) {
  const entry = OPTIC_CATALOG[elements.lens.value];
  if (!entry) {
    const p = document.createElement('p');
    p.textContent = 'Catalog source not yet independently verified; this entry still comes from the prototype dataset.';
    return [p];
  }

  const p = document.createElement('p');
  p.append('Catalog: ');
  const a = document.createElement('a');
  a.href = entry.url;
  a.textContent = entry.label;
  a.rel = 'external';
  p.append(a);
  const summary = catalogSummary(lens, objective);
  if (summary) p.append(` · ${summary}`);

  const nodes = [p];
  if (entry.note) {
    const note = document.createElement('p');
    note.textContent = entry.note;
    nodes.push(note);
  }
  return nodes;
}

function accessoryCatalogNodes(accessory) {
  const entry = ACCESSORY_CATALOG[elements.accessory.value];
  if (!entry || accessory.type === 'none') return [];

  const p = document.createElement('p');
  if (entry.url) {
    p.append('Accessory: ');
    const a = document.createElement('a');
    a.href = entry.url;
    a.textContent = entry.label;
    a.rel = 'external';
    p.append(a);
  } else {
    p.textContent = `Accessory: ${entry.label}`;
  }

  const nodes = [p];
  if (entry.note) {
    const note = document.createElement('p');
    note.textContent = entry.note;
    nodes.push(note);
  }
  return nodes;
}

function renderResults(result, objective, lens) {
  const out = elements.out;
  const accessory = MACRO_ACCESSORIES_DATA[elements.accessory.value] ?? MACRO_ACCESSORIES_DATA.none;
  const provenance = [...catalogNodes(lens, objective), ...(!objective ? accessoryCatalogNodes(accessory) : [])];

  if (!result.valid) {
    elements.imageCircleResult.hidden = true;
    for (const node of Object.values(out)) node.textContent = '—';
    elements.status.textContent = result.reason;
    elements.notes.replaceChildren(...provenance);
    return;
  }

  out.mag.textContent = formatMag(result.magnification);
  out.fov.textContent = formatFov(result.fov);
  const wdDigits = Number.isFinite(result.workingDistanceMm) && result.workingDistanceMm < 10 ? 2 : 0;
  const wdText = formatMm(result.workingDistanceMm, wdDigits);
  const estimatedAccessoryDistance = result.type === 'camera'
    && (accessory.type === 'tube' || accessory.type === 'diopter');
  out.wd.textContent = estimatedAccessoryDistance && result.workingDistanceMm != null ? `≈${wdText}` : wdText;
  const totalText = formatMm(result.sensorToSubjectMm, 0);
  out.total.textContent = estimatedAccessoryDistance && result.sensorToSubjectMm != null ? `≈${totalText}` : totalText;
  out.effective.textContent = `f/${result.effectiveFNumber.toFixed(1)}`;
  out.dof.textContent = formatMm(result.dofMm, result.dofMm < 1 ? 2 : 1);
  out.pitch.textContent = result.pixelPitchUm ? `${result.pixelPitchUm.toFixed(2)} µm` : '—';
  out.subjectPitch.textContent = result.pixelPitchUm && result.magnification
    ? `${(result.pixelPitchUm / result.magnification).toFixed(2)} µm/px`
    : '—';
  out.airy.textContent = result.airyDiameterUm ? `${result.airyDiameterUm.toFixed(1)} µm` : '—';
  out.airyPx.textContent = result.airyPixels ? `${result.airyPixels.toFixed(1)} px` : '—';
  out.subjectAiry.textContent = result.airyDiameterUm && result.magnification
    ? `${(result.airyDiameterUm / result.magnification).toFixed(2)} µm`
    : '—';
  out.nyquist.textContent = result.nyquistLpMm ? `${result.nyquistLpMm.toFixed(0)} lp/mm` : '—';

  elements.imageCircleResult.hidden = result.type !== 'objective' || !result.imageCircleMm;
  if (result.type === 'objective' && result.imageCircleMm) {
    const estimate = result.imageCircleEstimated ? '≈' : '';
    const uncertainty = result.imageCircleEstimated ? ' · estimated' : '';
    out.imageCircle.textContent = `${estimate}${result.imageCircleMm.toFixed(0)} mm${uncertainty}${result.vignette ? ' · vignettes' : ''}`;
  }

  elements.status.textContent = result.vignette
    ? result.imageCircleEstimated
      ? 'Estimated objective field may not cover the full sensor.'
      : 'Objective field number does not cover the full sensor.'
    : '';

  const notes = [...result.warnings];
  if (result.type === 'camera') {
    notes.unshift('Effective aperture assumes pupil magnification = 1; internal-focus, retrofocus and reversed lenses can differ.');
    notes.push('Working distance uses catalog MFD/barrel geometry or a published free-working-distance value when available. Lenses that extend while focusing can differ.');
  } else if (objective) {
    notes.unshift(`${objective.isPlan ? 'Plan' : 'Non-plan'} objective · NA ${objective.NA}${objective.sourceRef ? ` · ${objective.sourceRef}` : ''}.`);
  }
  notes.push('DOF is geometric defocus for a two-pixel circle of confusion; diffraction is shown separately as Airy diameter.');

  const noteNodes = notes.map((note) => {
    const p = document.createElement('p');
    p.textContent = note;
    return p;
  });
  elements.notes.replaceChildren(...provenance, ...noteNodes);
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

function magnificationCandidates() {
  const system = currentSystem();
  if (!system) return [];

  const aperture = Number(elements.aperture.value) > 0
    ? Number(elements.aperture.value)
    : defaultState.aperture;
  const megapixels = Number(elements.megapixels.value) > 0
    ? Number(elements.megapixels.value)
    : system.typicalMegapixels || defaultState.megapixels;
  const accessory = MACRO_ACCESSORIES_DATA[elements.accessory.value] ?? MACRO_ACCESSORIES_DATA.none;
  const candidates = [];

  for (const [lensId, lens] of Object.entries(system.lenses ?? {})) {
    const result = calculateCameraSetup({ system, lens, accessory, aperture, megapixels });
    if (result.valid && Number.isFinite(result.magnification) && result.magnification > 0) {
      candidates.push({
        lensId,
        magnification: result.magnification,
        workingDistanceMm: result.workingDistanceMm,
        kind: 'lens',
        label: lens.name
      });
    }
  }

  for (const [lensId, objective] of Object.entries(MICROSCOPE_OBJECTIVES_DATA)) {
    const result = calculateObjectiveSetup({ system, objective, megapixels });
    if (result.valid && Number.isFinite(result.magnification) && result.magnification > 0) {
      candidates.push({
        lensId,
        magnification: result.magnification,
        workingDistanceMm: result.workingDistanceMm,
        kind: 'objective',
        label: objective.name
      });
    }
  }

  return candidates.sort((a, b) => a.magnification - b.magnification || a.label.localeCompare(b.label));
}

function selectedSetupLabel(objective, lens) {
  const name = objective?.name || lens?.name || elements.lens.selectedOptions[0]?.textContent || 'Unknown setup';
  if (objective) return name;

  const accessory = MACRO_ACCESSORIES_DATA[elements.accessory.value] ?? MACRO_ACCESSORIES_DATA.none;
  return accessory.type === 'none' ? name : `${name} + ${accessoryDisplayName(accessory)}`;
}

function sameMagnification(a, b) {
  return Number.isFinite(a) && Number.isFinite(b) && Math.abs(Math.log(a / b)) <= 1e-12;
}

function distinctMagnifications(candidates) {
  return candidates.reduce((magnifications, candidate) => {
    const previous = magnifications[magnifications.length - 1];
    if (previous == null || !sameMagnification(previous, candidate.magnification)) {
      magnifications.push(candidate.magnification);
    }
    return magnifications;
  }, []);
}

function renderMagnificationNotches(candidates, minimum, maximum) {
  const magnifications = distinctMagnifications(candidates);
  const sliderMinimum = Math.log10(minimum);
  const sliderRange = Math.log10(maximum) - sliderMinimum;

  elements.magnificationNotches.replaceChildren(...magnifications.map((magnification) => {
    const notch = document.createElement('span');
    const position = sliderRange > 0
      ? (Math.log10(magnification) - sliderMinimum) / sliderRange
      : 0.5;
    notch.className = 'magnification-notch';
    notch.style.left = `${position * 100}%`;
    return notch;
  }));
}

function compareEquivalentCandidates(a, b) {
  const aDistance = Number.isFinite(a.workingDistanceMm) && a.workingDistanceMm > 0
    ? a.workingDistanceMm
    : -Infinity;
  const bDistance = Number.isFinite(b.workingDistanceMm) && b.workingDistanceMm > 0
    ? b.workingDistanceMm
    : -Infinity;
  return bDistance - aDistance || a.label.localeCompare(b.label);
}

function equivalentOptionLabel(candidate) {
  if (!Number.isFinite(candidate.workingDistanceMm) || candidate.workingDistanceMm <= 0) {
    return `${candidate.label} — WD unknown`;
  }

  const digits = candidate.workingDistanceMm < 10 ? 2 : 1;
  const accessoryType = MACRO_ACCESSORIES_DATA[elements.accessory.value]?.type;
  const estimated = candidate.kind === 'lens'
    && (accessoryType === 'tube' || accessoryType === 'diopter');
  const prefix = estimated ? '≈' : '';
  return `${candidate.label} — WD ${prefix}${formatMm(candidate.workingDistanceMm, digits)}`;
}

function renderEquivalentPicker(candidates, target) {
  const equivalents = closestMagnificationCandidates(candidates, target)
    .sort(compareEquivalentCandidates);

  if (!equivalents.length) {
    elements.magnificationMatch.textContent = 'No valid setup available';
    elements.equivalentLens.replaceChildren(option('', '—'));
    elements.equivalentLens.disabled = true;
    return;
  }

  const magnification = equivalents[0].magnification;
  const allObjectives = equivalents.every((candidate) => candidate.kind === 'objective');
  const allLenses = equivalents.every((candidate) => candidate.kind === 'lens');
  const equivalentType = allObjectives ? 'objectives' : allLenses ? 'lenses' : 'setups';
  const equivalentCount = equivalents.length > 1
    ? ` · ${equivalents.length} equivalent ${equivalentType}`
    : '';
  elements.magnificationMatch.textContent = `Closest available · ${formatMag(magnification)}${equivalentCount}`;
  elements.equivalentLens.replaceChildren(
    ...equivalents.map((candidate) => option(candidate.lensId, equivalentOptionLabel(candidate)))
  );

  const selectedIsEquivalent = equivalents.some((candidate) => candidate.lensId === elements.lens.value);
  elements.equivalentLens.value = selectedIsEquivalent
    ? elements.lens.value
    : equivalents[0].lensId;
  elements.equivalentLens.disabled = equivalents.length === 1;
}

function renderMagnificationPicker(result, objective, lens) {
  const candidates = magnificationCandidates();
  if (!candidates.length) {
    elements.magnificationSlider.disabled = true;
    elements.magnificationNotches.replaceChildren();
    elements.magnificationTarget.textContent = '—';
    elements.magnificationMin.textContent = '—';
    elements.magnificationMax.textContent = '—';
    renderEquivalentPicker([], 1);
    return;
  }

  elements.magnificationSlider.disabled = false;
  const minimum = candidates[0].magnification;
  const maximum = candidates[candidates.length - 1].magnification;
  const sliderMinimum = Math.log10(minimum);
  const sliderMaximum = Math.log10(maximum);
  const fallback = result.valid ? result.magnification : minimum;
  const target = Math.min(maximum, Math.max(minimum, requestedMagnification ?? fallback));

  elements.magnificationSlider.min = sliderMinimum.toString();
  elements.magnificationSlider.max = sliderMaximum.toString();
  elements.magnificationSlider.value = Math.log10(target).toString();
  const selectedMagnification = result.valid ? formatMag(result.magnification) : '—';
  elements.magnificationTarget.value = selectedMagnification;
  elements.magnificationTarget.textContent = selectedMagnification;
  elements.magnificationMin.textContent = formatMag(minimum);
  elements.magnificationMax.textContent = formatMag(maximum);
  renderMagnificationNotches(candidates, minimum, maximum);
  renderEquivalentPicker(candidates, target);

  if (result.valid) {
    const setup = selectedSetupLabel(objective, lens);
    elements.magnificationSlider.setAttribute(
      'aria-valuetext',
      `Selected ${formatMag(result.magnification)} with ${setup}`
    );
  } else {
    elements.magnificationSlider.setAttribute('aria-valuetext', `No setup selected; ${result.reason}`);
  }
}

function selectMagnificationTarget(target) {
  const candidates = magnificationCandidates();
  const equivalents = closestMagnificationCandidates(candidates, target);
  if (!equivalents.length) return;

  const magnification = equivalents[0].magnification;
  if (equivalentPreference && !sameMagnification(equivalentPreference.magnification, magnification)) {
    equivalentPreference = null;
  }

  const preferred = equivalentPreference
    ? equivalents.find((candidate) => candidate.lensId === equivalentPreference.lensId)
    : null;
  const candidate = preferred || closestMagnificationCandidate(equivalents, target);
  if (!candidate) return;

  requestedMagnification = target;
  elements.lens.value = candidate.lensId;
  render();
}

function handleMagnificationInput() {
  selectMagnificationTarget(10 ** Number(elements.magnificationSlider.value));
}

function handleMagnificationCommit() {
  const target = 10 ** Number(elements.magnificationSlider.value);
  const equivalents = closestMagnificationCandidates(magnificationCandidates(), target);
  if (!equivalents.length) return;
  selectMagnificationTarget(equivalents[0].magnification);
}

function handleMagnificationKeydown(event) {
  const direction = {
    ArrowLeft: -1,
    ArrowDown: -1,
    ArrowRight: 1,
    ArrowUp: 1
  }[event.key];
  const magnifications = distinctMagnifications(magnificationCandidates());
  if (!magnifications.length) return;

  let target = null;
  if (event.key === 'Home') target = magnifications[0];
  if (event.key === 'End') target = magnifications[magnifications.length - 1];

  const current = 10 ** Number(elements.magnificationSlider.value);
  if (direction < 0) {
    target = [...magnifications].reverse().find((magnification) => magnification < current && !sameMagnification(magnification, current))
      ?? magnifications[0];
  }
  if (direction > 0) {
    target = magnifications.find((magnification) => magnification > current && !sameMagnification(magnification, current))
      ?? magnifications[magnifications.length - 1];
  }

  if (target == null) return;
  event.preventDefault();
  selectMagnificationTarget(target);
}

function render() {
  const system = currentSystem();
  const objective = currentObjective();
  const lens = currentLens();
  const lockAccessory = !objective && lens?.accessoryModel === false;
  if (lockAccessory && elements.accessory.value !== 'none') elements.accessory.value = 'none';
  const accessory = MACRO_ACCESSORIES_DATA[elements.accessory.value] ?? MACRO_ACCESSORIES_DATA.none;
  const result = calculate();
  if (!system || !result) return;

  setFieldAvailability(
    elements.accessoryField,
    elements.accessory,
    !objective && !lockAccessory,
    objective ? 'Not applicable' : 'Unavailable for this lens'
  );
  setFieldAvailability(
    elements.apertureField,
    elements.aperture,
    !objective,
    'Set by objective'
  );

  renderSensor(system, result);
  renderResults(result, objective, lens);
  renderRig(system, objective || lens, accessory, result);
  renderMagnificationPicker(result, objective, lens);
  saveStateToUrl();
}

function handleSystemChange() {
  requestedMagnification = null;
  equivalentPreference = null;
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

elements.lens.addEventListener('change', () => {
  requestedMagnification = null;
  equivalentPreference = null;
  render();
});
elements.accessory.addEventListener('change', () => {
  requestedMagnification = null;
  equivalentPreference = null;
  render();
});
elements.aperture.addEventListener('input', render);
elements.megapixels.addEventListener('input', () => {
  megapixelsUserSet = true;
  render();
});
elements.system.addEventListener('change', handleSystemChange);
elements.magnificationSlider.addEventListener('input', handleMagnificationInput);
elements.magnificationSlider.addEventListener('change', handleMagnificationCommit);
elements.magnificationSlider.addEventListener('keydown', handleMagnificationKeydown);
elements.equivalentLens.addEventListener('change', () => {
  const candidate = magnificationCandidates()
    .find((item) => item.lensId === elements.equivalentLens.value);
  if (!candidate) return;

  equivalentPreference = {
    lensId: candidate.lensId,
    magnification: candidate.magnification
  };
  elements.lens.value = candidate.lensId;
  render();
});
window.addEventListener('resize', render);

render();
