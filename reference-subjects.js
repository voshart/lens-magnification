const SVG_NS = 'http://www.w3.org/2000/svg';
const MAX_CUSTOM_SVG_BYTES = 250_000;

const elements = {
  subject: document.getElementById('reference-subject'),
  objectLayer: document.getElementById('object-layer'),
  legend: document.getElementById('object-legend'),
  customPanel: document.getElementById('custom-reference-panel'),
  customFile: document.getElementById('custom-reference-file'),
  customInput: document.getElementById('custom-reference-svg'),
  customAxis: document.getElementById('custom-reference-axis'),
  customSize: document.getElementById('custom-reference-size'),
  customUnit: document.getElementById('custom-reference-unit'),
  customApply: document.getElementById('custom-reference-apply'),
  customBounds: document.getElementById('custom-reference-bounds'),
  customStatus: document.getElementById('custom-reference-status')
};

const builtinSubjects = {
  rice: {
    name: 'rice grain',
    legend: 'rice ≈6 mm'
  },
  ladybug: {
    name: '7-spot ladybug',
    legend: '7-spot ladybug ≈7 mm body',
    imageHref: './assets/ladybug.svg',
    // The tightly cropped artwork includes legs/antennae. About 8 mm overall
    // keeps the illustrated body near a representative 7 mm adult length.
    widthMm: 7.94,
    heightMm: 8
  }
};

let customSubject = null;
let observer = null;

const ALLOWED_ELEMENTS = new Set([
  'g', 'path', 'circle', 'ellipse', 'rect', 'line', 'polyline', 'polygon'
]);
const ALLOWED_ATTRIBUTES = new Set([
  'd', 'cx', 'cy', 'r', 'rx', 'ry', 'x', 'y', 'x1', 'y1', 'x2', 'y2',
  'width', 'height', 'points', 'transform',
  'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin',
  'stroke-miterlimit', 'fill-rule', 'clip-rule', 'opacity', 'fill-opacity',
  'stroke-opacity', 'vector-effect'
]);

function numericAttribute(element, name) {
  const value = Number(element.getAttribute(name));
  return Number.isFinite(value) ? value : null;
}

function riceMagnification() {
  const rice = elements.objectLayer?.querySelector('.preview-rice');
  if (!rice) return null;
  const radiusY = numericAttribute(rice, 'ry');
  if (!(radiusY > 0)) return null;
  return (radiusY * 2) / 6;
}

function referenceAnchor() {
  const rice = elements.objectLayer?.querySelector('.preview-rice');
  if (!rice) return null;
  const x = numericAttribute(rice, 'cx');
  const y = numericAttribute(rice, 'cy');
  return Number.isFinite(x) && Number.isFinite(y) ? { x, y } : null;
}

function setSvgHref(element, href) {
  element.setAttribute('href', href);
}

function appendImageSubject(subject, magnification, anchor) {
  const image = document.createElementNS(SVG_NS, 'image');
  const width = subject.widthMm * magnification;
  const height = subject.heightMm * magnification;
  image.classList.add('reference-subject-overlay');
  image.setAttribute('x', anchor.x - width / 2);
  image.setAttribute('y', anchor.y - height / 2);
  image.setAttribute('width', width);
  image.setAttribute('height', height);
  image.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  image.setAttribute('aria-hidden', 'true');
  setSvgHref(image, subject.imageHref);
  elements.objectLayer.append(image);
}

function appendCustomSubject(subject, magnification, anchor) {
  const width = subject.physicalWidthMm * magnification;
  const height = subject.physicalHeightMm * magnification;
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.classList.add('reference-subject-overlay');
  svg.setAttribute('x', anchor.x - width / 2);
  svg.setAttribute('y', anchor.y - height / 2);
  svg.setAttribute('width', width);
  svg.setAttribute('height', height);
  svg.setAttribute(
    'viewBox',
    `${subject.bounds.x} ${subject.bounds.y} ${subject.bounds.width} ${subject.bounds.height}`
  );
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  svg.setAttribute('overflow', 'visible');
  svg.setAttribute('aria-hidden', 'true');

  const parsed = new DOMParser().parseFromString(
    `<svg xmlns="${SVG_NS}">${subject.markup}</svg>`,
    'image/svg+xml'
  );
  for (const child of [...parsed.documentElement.childNodes]) {
    svg.append(document.importNode(child, true));
  }
  elements.objectLayer.append(svg);
}

function isReferenceLegendPart(part) {
  return part === builtinSubjects.rice.legend
    || part === builtinSubjects.ladybug.legend
    || part.startsWith('custom SVG ');
}

function updateLegend(label) {
  if (!elements.legend) return;
  const parts = elements.legend.textContent
    .split(' · ')
    .map((part) => part.trim())
    .filter(Boolean)
    .filter((part) => !isReferenceLegendPart(part));
  if (label) parts.push(label);
  elements.legend.textContent = parts.join(' · ');
}

function syncReferenceOverlay() {
  if (!elements.objectLayer || !elements.subject) return;
  observer?.disconnect();
  try {
    elements.objectLayer.querySelectorAll('.reference-subject-overlay').forEach((node) => node.remove());
    const rice = elements.objectLayer.querySelector('.preview-rice');
    if (!rice) return;

    const selected = elements.subject.value;
    rice.style.display = selected === 'rice' ? '' : 'none';
    if (selected === 'rice') {
      updateLegend(builtinSubjects.rice.legend);
      return;
    }

    const magnification = riceMagnification();
    const anchor = referenceAnchor();
    if (!(magnification > 0) || !anchor) return;

    if (selected === 'ladybug') {
      appendImageSubject(builtinSubjects.ladybug, magnification, anchor);
      updateLegend(builtinSubjects.ladybug.legend);
      return;
    }

    if (selected === 'custom' && customSubject) {
      appendCustomSubject(customSubject, magnification, anchor);
      updateLegend(customSubject.legend);
    } else {
      updateLegend('');
    }
  } finally {
    observer?.observe(elements.objectLayer, { childList: true });
  }
}

function safePaintValue(value) {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (/url\s*\(|javascript:|data:|var\s*\(/i.test(trimmed)) return false;
  return true;
}

function copyAllowedAttributes(source, target) {
  for (const attribute of [...source.attributes]) {
    const name = attribute.name.toLowerCase();
    if (name.startsWith('on') || !ALLOWED_ATTRIBUTES.has(name)) continue;
    if ((name === 'fill' || name === 'stroke') && !safePaintValue(attribute.value)) continue;
    target.setAttribute(name, attribute.value);
  }
}

function sanitizeElement(source, targetParent) {
  const name = source.localName?.toLowerCase();
  if (!name) return;

  if (!ALLOWED_ELEMENTS.has(name)) {
    // Unknown containers are flattened so harmless descendants survive while
    // script/foreignObject/image/use/style/link-like behavior is discarded.
    for (const child of [...source.children]) sanitizeElement(child, targetParent);
    return;
  }

  const target = document.createElementNS(SVG_NS, name);
  copyAllowedAttributes(source, target);
  for (const child of [...source.children]) sanitizeElement(child, target);
  targetParent.append(target);
}

function sanitizeSvg(svgText) {
  const text = String(svgText ?? '').trim();
  if (!text) throw new Error('Paste or upload an SVG first.');
  if (new Blob([text]).size > MAX_CUSTOM_SVG_BYTES) {
    throw new Error('SVG is too large. Keep custom SVGs under 250 KB.');
  }
  if (/<!doctype|<!entity/i.test(text)) {
    throw new Error('SVG document types and entities are not supported.');
  }

  const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
  if (doc.querySelector('parsererror')) throw new Error('The SVG could not be parsed.');
  const root = doc.documentElement;
  if (root.localName?.toLowerCase() !== 'svg') throw new Error('Input must contain an <svg> root element.');

  const group = document.createElementNS(SVG_NS, 'g');
  for (const name of ['fill', 'stroke', 'stroke-width', 'opacity', 'fill-opacity', 'stroke-opacity']) {
    if (root.hasAttribute(name) && safePaintValue(root.getAttribute(name))) {
      group.setAttribute(name, root.getAttribute(name));
    }
  }
  for (const child of [...root.children]) sanitizeElement(child, group);
  if (!group.children.length) {
    throw new Error('No supported SVG artwork was found. Use paths or basic SVG shapes.');
  }
  return group;
}

function measureGroup(group) {
  const measurementSvg = document.createElementNS(SVG_NS, 'svg');
  measurementSvg.classList.add('custom-svg-measurement');
  measurementSvg.setAttribute('aria-hidden', 'true');
  const imported = document.importNode(group, true);
  measurementSvg.append(imported);
  document.body.append(measurementSvg);

  let box;
  try {
    box = imported.getBBox();
  } finally {
    measurementSvg.remove();
  }
  if (![box.x, box.y, box.width, box.height].every(Number.isFinite) || !(box.width > 0) || !(box.height > 0)) {
    throw new Error('Could not determine a non-empty artwork bounding box.');
  }
  return { x: box.x, y: box.y, width: box.width, height: box.height };
}

function unitToMm(value, unit) {
  if (unit === 'um') return value / 1000;
  if (unit === 'cm') return value * 10;
  return value;
}

function serializeGroupChildren(group) {
  const serializer = new XMLSerializer();
  return [...group.childNodes].map((node) => serializer.serializeToString(node)).join('');
}

function applyCustomSvg() {
  try {
    const group = sanitizeSvg(elements.customInput?.value);
    const bounds = measureGroup(group);
    const size = Number(elements.customSize?.value);
    if (!(size > 0)) throw new Error('Enter a real-world size greater than zero.');

    const sizeMm = unitToMm(size, elements.customUnit?.value);
    const axis = elements.customAxis?.value === 'height' ? 'height' : 'width';
    const svgSpan = bounds[axis];
    const mmPerSvgUnit = sizeMm / svgSpan;
    const physicalWidthMm = bounds.width * mmPerSvgUnit;
    const physicalHeightMm = bounds.height * mmPerSvgUnit;

    customSubject = {
      markup: serializeGroupChildren(group),
      bounds,
      physicalWidthMm,
      physicalHeightMm,
      legend: `custom SVG ${formatPhysicalSize(physicalWidthMm)} × ${formatPhysicalSize(physicalHeightMm)}`
    };

    if (elements.customBounds) {
      elements.customBounds.textContent = `Detected artwork: ${bounds.width.toFixed(2)} × ${bounds.height.toFixed(2)} SVG units`;
    }
    if (elements.customStatus) {
      elements.customStatus.textContent = `Scaled to ${formatPhysicalSize(physicalWidthMm)} × ${formatPhysicalSize(physicalHeightMm)}. Custom artwork stays in this browser session and is not added to the share URL.`;
    }
    elements.subject.value = 'custom';
    syncReferenceOverlay();
  } catch (error) {
    customSubject = null;
    if (elements.customBounds) elements.customBounds.textContent = 'Detected artwork: —';
    if (elements.customStatus) elements.customStatus.textContent = error instanceof Error ? error.message : String(error);
    syncReferenceOverlay();
  }
}

function formatPhysicalSize(mm) {
  if (mm < 1) return `${(mm * 1000).toFixed(mm < 0.1 ? 1 : 0)} µm`;
  return `${mm.toFixed(mm < 10 ? 2 : 1)} mm`;
}

async function loadCustomFile(file) {
  if (!file) return;
  try {
    const text = await file.text();
    if (elements.customInput) elements.customInput.value = text;
    if (elements.customStatus) elements.customStatus.textContent = `Loaded ${file.name}. Set its real-world scale, then apply.`;
  } catch (error) {
    if (elements.customStatus) elements.customStatus.textContent = `Could not read ${file.name}.`;
  }
}

function syncCustomPanel() {
  if (!elements.customPanel || !elements.subject) return;
  elements.customPanel.hidden = elements.subject.value !== 'custom';
}

function initialize() {
  if (!elements.subject || !elements.objectLayer) return;

  observer = new MutationObserver(syncReferenceOverlay);
  observer.observe(elements.objectLayer, { childList: true });

  elements.subject.addEventListener('change', () => {
    syncCustomPanel();
    syncReferenceOverlay();
  });
  elements.customFile?.addEventListener('change', () => loadCustomFile(elements.customFile.files?.[0]));
  elements.customApply?.addEventListener('click', applyCustomSvg);
  elements.customInput?.addEventListener('keydown', (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') applyCustomSvg();
  });

  syncCustomPanel();
  syncReferenceOverlay();
}

initialize();
