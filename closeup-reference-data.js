// Reference-only manufacturer data for close-up lenses.
//
// The current simulator is intentionally centered on the maximum-magnification
// configuration: the host lens is assumed to be at its native close-focus end.
// These records preserve manufacturer distance/focus information in case a future
// version models the full focus range. They are not imported by the current app.
//
// Distance terminology is kept explicit because manufacturers do not all publish
// the same quantity. `workingDistance` means the manufacturer's stated free
// subject distance. `distanceToObject` and `closestFocusFromFront` preserve the
// manufacturer's wording and should not be silently treated as equivalent WD.

export const CLOSEUP_REFERENCE_DATA = {
  nisi_closeup_77: {
    manufacturer: 'NiSi',
    model: '77mm Close-Up Lens',
    powerDRange: [3, 4],
    opticalDesign: 'Double APO optical element',
    recommendedHostFocalLengthMm: { min: 70, max: 300 },
    distanceReferences: [
      { type: 'workingDistance', minMm: 220, maxMm: 300, hostFocus: 'not specified' }
    ],
    notes: 'Manufacturer specifies the power only as between +3 D and +4 D, so this product is retained as reference data rather than a current simulator preset.',
    sources: [
      'https://en.nisioptics.com/nisi-close-up-lens-kit-macro-photography'
    ]
  },

  nisi_closeup_58_plus5: {
    manufacturer: 'NiSi',
    model: '58mm Close-Up Lens',
    powerD: 5,
    opticalDesign: 'Double optical corrective glass with apochromatic design',
    coatings: 'Multilayer Nano coating',
    recommendedHostFocalLengthMm: {
      fullFrame: { min: 35, max: 250 },
      apsc: { min: 24, max: 250 }
    },
    distanceReferences: [
      { type: 'workingDistance', minMm: 90, maxMm: 220, hostFocus: 'not specified' }
    ],
    notes: 'NiSi states that the working distance becomes shorter when combined with a macro lens.',
    sources: [
      'https://en.nisioptics.com/news/the-nisi-close-up-lens-kit-nc-now-available-in-58mm-size.html',
      'https://en.nisioptics.com/nisi-close-up-lens-kit-macro-photography'
    ]
  },

  nisi_closeup_49_plus9: {
    manufacturer: 'NiSi',
    model: '49mm Close-Up Lens',
    powerD: 9,
    opticalDesign: 'Three APO optical elements',
    compatibleFilterThreadMm: { min: 40.6, max: 67 },
    distanceReferences: [
      { type: 'workingDistance', minMm: 20, maxMm: 140, hostFocus: 'not specified' }
    ],
    notes: 'NiSi states that this attachment can achieve 2× with a macro lens; actual magnification depends on the host lens and focus setting.',
    sources: [
      'https://en.nisioptics.com/nisi-close-up-lens-kit-macro-photography'
    ]
  },

  raynox_dcr_150: {
    manufacturer: 'Raynox',
    model: 'DCR-150',
    powerD: 4.8,
    groups: 2,
    elements: 3,
    opticalMaterial: 'Coated optical glass',
    distanceReferences: [
      {
        type: 'distanceToObject',
        valueMm: 210,
        hostFocus: 'infinity',
        context: 'Panasonic HC-W850 / HC-V750 compatibility example'
      }
    ],
    sources: [
      'https://raynox.co.jp/english/dcr/dcr150/indexdcr150eg.htm',
      'https://www.raynox.co.jp/english/video/pdf/Panasonic_HC_W850.pdf'
    ]
  },

  raynox_dcr_250: {
    manufacturer: 'Raynox',
    model: 'DCR-250',
    powerD: 8,
    groups: 2,
    elements: 3,
    opticalMaterial: 'Coated optical glass',
    distanceReferences: [
      {
        type: 'distanceToObject',
        valueMm: 109,
        hostFocus: 'infinity',
        context: 'Panasonic HC-W850 / HC-V750 compatibility example'
      }
    ],
    sources: [
      'https://www.raynox.co.jp/english/dcr/dcr250/indexdcr250eg.htm',
      'https://www.raynox.co.jp/english/video/pdf/Panasonic_HC_W850.pdf'
    ]
  },

  raynox_dcr_5320pro_2: {
    manufacturer: 'Raynox',
    model: 'DCR-5320PRO +2 D section',
    powerD: 2,
    groups: 1,
    elements: 2,
    opticalMaterial: 'Coated optical glass',
    distanceReferences: [
      { type: 'distanceToObject', valueMm: 486, hostFocus: 'infinity' }
    ],
    manufacturerResolutionReference: { centerLpMm: 200, mtfPercent: 30, qualifier: 'theoretical' },
    sources: [
      'https://www.raynox.co.jp/english/dcr/dcr5320pro/index.htm'
    ]
  },

  raynox_dcr_5320pro_3: {
    manufacturer: 'Raynox',
    model: 'DCR-5320PRO +3 D section',
    powerD: 3,
    groups: 2,
    elements: 3,
    opticalMaterial: 'Coated optical glass',
    distanceReferences: [
      { type: 'distanceToObject', valueMm: 311, hostFocus: 'infinity' }
    ],
    manufacturerResolutionReference: { centerLpMm: 200, mtfPercent: 30, qualifier: 'theoretical' },
    sources: [
      'https://www.raynox.co.jp/english/dcr/dcr5320pro/index.htm'
    ]
  },

  raynox_dcr_5320pro_5: {
    manufacturer: 'Raynox',
    model: 'DCR-5320PRO combined +5 D',
    powerD: 5,
    groups: 3,
    elements: 5,
    opticalMaterial: 'Coated optical glass',
    distanceReferences: [
      { type: 'distanceToObject', valueMm: 170, hostFocus: 'infinity' }
    ],
    manufacturerResolutionReference: { centerLpMm: 200, mtfPercent: 30, qualifier: 'theoretical' },
    sources: [
      'https://www.raynox.co.jp/english/dcr/dcr5320pro/index.htm'
    ]
  },

  kenko_ac_closeup_2: {
    manufacturer: 'Kenko',
    model: 'AC Close-Up No.2',
    powerD: 2,
    groups: 1,
    elements: 2,
    opticalDesign: 'Achromatic',
    distanceReferences: [],
    sources: [
      'https://kenkoglobal.com/download/document/5b9a7046abf02.pdf'
    ]
  },

  kenko_ac_closeup_3: {
    manufacturer: 'Kenko',
    model: 'AC Close-Up No.3',
    powerD: 3,
    groups: 1,
    elements: 2,
    opticalDesign: 'Achromatic',
    distanceReferences: [],
    sources: [
      'https://kenkoglobal.com/download/document/5b9a7046abf02.pdf'
    ]
  },

  kenko_ac_closeup_4: {
    manufacturer: 'Kenko',
    model: 'AC Close-Up No.4',
    powerD: 4,
    groups: 1,
    elements: 2,
    opticalDesign: 'Achromatic',
    distanceReferences: [],
    sources: [
      'https://kenkoglobal.com/download/document/5b9a7046abf02.pdf'
    ]
  },

  kenko_ac_closeup_5: {
    manufacturer: 'Kenko',
    model: 'AC Close-Up No.5',
    powerD: 5,
    groups: 1,
    elements: 2,
    opticalDesign: 'Achromatic',
    distanceReferences: [],
    sources: [
      'https://kenkoglobal.com/download/document/5b9a7046abf02.pdf'
    ]
  },

  marumi_dhg_achromat_330: {
    manufacturer: 'Marumi',
    model: 'DHG Achromat Macro 330',
    powerD: 3,
    elements: 2,
    opticalDesign: 'Achromatic correction for peripheral chromatic aberration',
    coatings: 'Low-reflection multi-coating',
    distanceReferences: [],
    sources: [
      'https://www.marumi-global.com/products/dhg-achoromat330'
    ]
  },

  marumi_dhg_achromat_200: {
    manufacturer: 'Marumi',
    model: 'DHG Achromat Macro 200',
    powerD: 5,
    elements: 2,
    opticalDesign: 'Achromatic correction for peripheral chromatic aberration',
    coatings: 'Low-reflection multi-coating',
    distanceReferences: [],
    sources: [
      'https://www.marumi-global.com/products/dhg-achoromat200'
    ]
  },

  canon_closeup_500d: {
    manufacturer: 'Canon',
    model: 'Close-Up Lens 500D',
    status: 'legacy',
    powerDApprox: 2,
    elements: 2,
    opticalDesign: 'Double-element achromatic',
    recommendedHostFocalLengthMm: { min: 70, max: 300 },
    distanceReferences: [
      {
        type: 'closestFocusFromFront',
        valueMm: 500,
        hostFocus: 'infinity',
        note: 'Canon describes the attachment as changing closest focusing distance from infinity to about 500 mm from the front of the lens.'
      }
    ],
    sources: [
      'https://www.usa.canon.com/learning/training-articles/training-articles-list/getting-started-in-macro',
      'https://downloads.canon.com/cpr/software/camera/EOSSYSTEM_BC_0113W799.pdf'
    ]
  },

  canon_closeup_250d: {
    manufacturer: 'Canon',
    model: 'Close-Up Lens 250D',
    status: 'legacy',
    powerDApprox: 4,
    elements: 2,
    opticalDesign: 'Double-element achromatic',
    recommendedHostFocalLengthMm: { min: 50, max: 135 },
    distanceReferences: [
      {
        type: 'closestFocusFromFront',
        valueMm: 250,
        hostFocus: 'infinity',
        note: 'Canon describes the attachment as changing closest focusing distance from infinity to about 250 mm from the front of the lens.'
      }
    ],
    sources: [
      'https://www.usa.canon.com/learning/training-articles/training-articles-list/getting-started-in-macro',
      'https://downloads.canon.com/cpr/software/camera/EOSSYSTEM_BC_0113W799.pdf'
    ]
  }
};
