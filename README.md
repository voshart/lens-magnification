# Macrophotography Simulator

An interactive calculator for exploring macro-lens and finite microscope-objective setups. It estimates how a selected lens, sensor, accessory, aperture, and resolution affect magnification and the resulting image.

Live site: <https://macro.voshart.com>

## Features

- Camera and sensor presets across multiple lens systems
- Same-mount full-frame lenses remain available on compatible APS-C mirrorless bodies
- Macro, close-focus, and high-magnification lens presets
- Laowa Aksen 45 mm 1–5× and 17.5 mm 5–10× endpoint presets on supported mirrorless mounts
- Extension-tube, close-up-lens, and reversed-lens estimates
- OM SYSTEM MC-14 and MC-20 combinations for the compatible 90 mm Macro PRO
- Generic +5 D, +8 D, and +9 D power-only close-up-lens presets plus documented products from Raynox, NiSi, Kenko, Marumi, and Canon
- DIN 160 mm finite microscope objectives
- Target-magnification matching
- Sensor preview with familiar reference objects
- Optional pixel-crop overlay (off by default), with square, portrait, and landscape presets and subject coverage estimated from sensor dimensions and MP
- Amber crop outline and advisory when estimated diffraction contrast falls below 20% at a four-source-pixel light/dark cycle
- Field of view, working distance, sensor-to-subject distance, effective aperture, and depth of field
- Expandable focus-stack planner with target depth, adjustable overlap, object-space spacing, and estimated frame count
- Pixel pitch, subject sampling, Airy-disk size, Nyquist frequency, and objective image-circle details
- Shareable configurations stored in the page URL
- Lens-aware aperture limits; values wider than the selected lens and documented narrow-end limits are rejected

The 90 mm Macro PRO with MC-20 is modeled at its 4× S-MACRO endpoint, where the widest available aperture is f/10. Aperture validation and diffraction suggestions use that limit; f/7.1 is not available at this endpoint. Shared URLs requesting a wider aperture show a validation error until corrected.

## Run locally

The project has no build step or package dependencies. Because it uses JavaScript modules, serve the directory over HTTP instead of opening `index.html` directly:

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

## Pixel crop and diffraction warning

Crop presets range from 500 × 500 to 3,840 × 2,160 source pixels, with square, portrait and landscape shapes. Sizes are estimated from sensor dimensions and MP, assuming square pixels. Changing the preset changes the crop's coverage, not sharpness per source pixel.

The amber outline estimates diffraction contrast using an ideal unobstructed circular aperture at 550 nm. It evaluates MTF at 0.25 cycles/source pixel (a light/dark cycle spanning four pixels). With `q = wavelength × effective f-number / (4 × pixel pitch)`, contrast is `2/π × (acos(q) − q × sqrt(1 − q²))` for `q < 1`, and zero at or beyond the diffraction cutoff. The interface describes a zero result as being at or beyond the ideal cutoff instead of displaying `0.0%`. Other results are rounded to whole percentages. See [Optikos's MTF guide](https://www.optikos.com/wp-content/uploads/2015/10/How-to-Measure-MTF-and-other-Properties-of-Lenses.pdf).

For camera lenses, working f-number is `marked f-number × (1 + magnification / pupil magnification)`. The calculation can use a stored lens-specific pupil magnification, but the current catalog has no reliable values. It therefore uses the common pupil-magnification value of 1 and marks the effective aperture as approximate. This is the same simplifying form described in [Edmund Optics' working f-number guide](https://www.edmundoptics.com/knowledge-center/application-notes/imaging/lens-iris-aperture-setting/). Microscope-objective diffraction instead derives from the objective's published numerical aperture.

Contrast below 20% triggers an advisory; this threshold is a UI heuristic, not a universal resolution standard. The warning gives a suggested wider source crop to resize to the selected preset's dimensions for export, instead of displaying contrast percentages. It finds the reduction factor needed to reach the same 20% ideal contrast at a four-output-pixel cycle, rounds source dimensions up to whole pixels, and checks both dimensions against the sensor. If that crop cannot fit, it suggests a smaller output size. The box continues to show the selected source crop; suggestions do not resize it automatically.

When possible, the advisory also identifies the nearest wider one-third-stop aperture that clears the guide and provides a control to apply it. If no available aperture clears 20%, it offers the widest setting to reduce diffraction. The result is an ideal diffraction-only calculation, not measured lens sharpness. It excludes lens aberrations, sensor filtering, image processing, motion and resampling-filter effects. It does not certify sharpness when no warning appears. Longer extension tubes can trigger it by increasing the estimated effective f-number; length alone does not determine image quality. Crops that exceed the sensor's pixel dimensions instead show a size warning and no box. The detailed contrast readout and calculation notes retain the model assumptions.

Run the optical calculation checks with `node --test tests/*.test.mjs`.

## Focus-stack planner

The planner beneath the depth-of-field result uses the current geometric DOF at a two-source-pixel circle of confusion. For requested depth `D`, DOF `d`, and overlap ratio `o`, focus-plane spacing is `d × (1 − o)`. The estimated frame count is one when `D ≤ d`; otherwise it is `ceil((D − d) / spacing) + 1`, so the first and last frames cover both ends of the requested range. The default overlap is 50%.

Spacing is object-space movement suitable for planning a focusing rail or moving the subject. It is not a camera focus-bracketing step value, because manufacturers do not define those steps as a universal physical distance. The estimate uses source-pixel sampling; final downscaling may tolerate a larger circle of confusion and require fewer frames. Diffraction, subject movement, focus breathing, alignment losses, and stacking artifacts can still affect the result.

## Project structure

- `index.html` — interface markup
- `styles.css` — layout and visual design
- `app.js` — interface state, rendering, and interactions
- `optics.js` — optical calculations
- `data.js` — camera, lens, objective, accessory, and reference-object data
- `closeup-reference-data.js` — reference-only manufacturer focus/distance metadata retained for a possible future focus-range model; not imported by the current app

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

Named close-up-lens presets are included only when first-party technical documentation provides enough information to identify the optical power or focal length and the optical construction/correction approach. Achromatic/APO design, element/group count, coatings, recommended host-lens range, and manufacturer working-distance guidance are recorded when published. Well-documented discontinued products can be retained as explicitly labeled legacy entries.

A missing specification is not treated as proof that a product is poor quality or that a manufacturer is concealing something; it simply means the product is not documented well enough for a brand-specific simulator preset. Users can still approximate an undocumented or unbranded close-up lens with a generic power-only entry when an advertised diopter value is known.

Manufacturer image-quality claims and distance ranges are provenance only. The current simulator is centered on each setup's maximum-magnification configuration rather than the full focusing range. Published infinity-focus distances, manufacturer working-distance ranges, focus conditions, and the exact distance terminology used by each manufacturer are preserved in `closeup-reference-data.js` for possible future use, but are not treated as the current setup's working distance.

For close-up lenses on supported prime lenses, working distance at the modeled maximum-magnification setting is a first-order estimate based on the host lens's native close-focus working distance and nominal diopter power. The interface marks those estimated distances with `≈`; real attachment thickness, spacing, principal-plane position, and internal focusing can shift the result.

## Accuracy

Results are planning estimates rather than measurements of a physical setup. Some calculations use thin-lens approximations, nominal focal lengths, published manufacturer specifications, or assumed pupil magnification. Close-up-lens power is modeled independently of optical quality; aberrations, multi-element correction, spacing, and host-lens interactions are not simulated. Generic close-up presets represent nominal optical power only, with construction, correction, coatings, power tolerance, and image quality treated as unknown. For documented close-up products, manufacturer construction and distance guidance are retained as reference metadata rather than treated as calculated performance. The interface displays additional warnings when a value is unavailable or especially uncertain.

## License

The source code is licensed under the [PolyForm Noncommercial License 1.0.0](LICENSE). Noncommercial use, modification, and redistribution are allowed under those terms. Commercial use is not granted under this license. If you want to use this software commercially, contact the repository owner to arrange a separate commercial license.

## Deployment

The site is deployed at <https://macro.voshart.com> with Cloudflare Pages. Use the repository root as the output directory; no build command is required.
