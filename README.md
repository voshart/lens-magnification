# Macrophotography Simulator

An interactive calculator for exploring macro-lens and finite microscope-objective setups. It estimates how a selected lens, sensor, accessory, aperture, and resolution affect magnification and the resulting image.

Live site: <https://macro.voshart.com>

## Features

- Camera and sensor presets across multiple lens systems
- Same-mount full-frame lenses remain available on compatible APS-C mirrorless bodies
- Macro, close-focus, and high-magnification lens presets
- Extension-tube, close-up-lens, and reversed-lens estimates
- Generic +5 D, +8 D, and +9 D power-only close-up-lens presets plus documented products from Raynox, NiSi, Kenko, Marumi, and Canon
- DIN 160 mm finite microscope objectives
- Target-magnification matching
- Sensor preview with familiar reference objects
- Field of view, working distance, sensor-to-subject distance, effective aperture, and depth of field
- Pixel pitch, subject sampling, Airy-disk size, Nyquist frequency, and objective image-circle details
- Shareable configurations stored in the page URL

## Run locally

The project has no build step or package dependencies. Because it uses JavaScript modules, serve the directory over HTTP instead of opening `index.html` directly:

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

## Project structure

- `index.html` — interface markup
- `styles.css` — layout and visual design
- `app.js` — interface state, rendering, and interactions
- `optics.js` — optical calculations
- `data.js` — camera, lens, objective, accessory, and reference-object data

## Preview coordinate system

The sensor preview has an explicit unit contract:

- One outer SVG user unit represents one millimetre on the sensor/image plane.
- Reference-object dimensions in `data.js` are real subject-space millimetres.
- Rendered size is `subject dimension × magnification`.
- Reference objects share a sensor-centred anchor so changing magnification cannot make them drift.
- The optical-rig diagram below the preview is schematic and is not drawn at a constant millimetre scale.

Illustrated subjects declare a tightly cropped `artworkViewBox`. The renderer maps the declared `lengthMm` onto the full horizontal width of that box while preserving its aspect ratio. Avoid corrective transforms or visual padding inside the artwork because they make the visible specimen smaller than its declared size.

Raster assets can use the same SVG wrapper via an `<image>` element. Crop the source file tightly, set `artworkViewBox` to `[0, 0, pixelWidth, pixelHeight]`, give the specimen a defensible real-world `lengthMm`, and let the shared renderer perform the magnification scaling. PNG or WebP is preferable when a transparent background is required; JPEG is supported but retains its rectangular background.

## Close-up lens catalog policy

Named close-up-lens presets are included only when first-party technical documentation provides enough information to identify the optical power or focal length and the optical construction/correction approach. Achromatic/APO design, element/group count, coatings, recommended host-lens range, and manufacturer working-distance guidance are recorded when published.

A missing specification is not treated as proof that a product is poor quality; it simply means the product is not documented well enough for a brand-specific simulator preset. Users can still approximate an undocumented or unbranded close-up lens with a generic power-only entry when an advertised diopter value is known.

Manufacturer image-quality claims and working-distance ranges are provenance only. The simulator does not convert them into an image-quality score or assume that two products with equal nominal diopter power have identical aberrations or physical working distance.

## Accuracy

Results are planning estimates rather than measurements of a physical setup. Some calculations use thin-lens approximations, nominal focal lengths, published manufacturer specifications, or assumed pupil magnification. Close-up-lens power is modeled independently of optical quality; aberrations, multi-element correction, spacing, and host-lens interactions are not simulated. Generic close-up presets represent nominal optical power only, with construction, correction, coatings, power tolerance, image quality, and actual working distance treated as unknown. For documented close-up products, manufacturer construction and working-distance guidance are shown as reference metadata rather than treated as calculated performance. The interface displays additional warnings when a value is unavailable or especially uncertain.

## Deployment

The site is deployed at <https://macro.voshart.com> with Cloudflare Pages. Use the repository root as the output directory; no build command is required.
