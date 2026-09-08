// Static optical data from the original prototype, trimmed to fields used by the calculator.
export const LENSES_BY_SYSTEM = {
  "sony_e_ff": {
    "systemName": "Sony E (Full Frame)",
    "flangeDistance": 18,
    "sensorWidth": 36,
    "sensorHeight": 24,
    "typicalMegapixels": 45,
    "lenses": {
      "sony_fe_90mm_f2_8_macro_g_oss": {
        "name": "Sony FE 90mm f/2.8 Macro G OSS",
        "f": 90,
        "NM": 1,
        "PL": 130.5,
        "MFD": 280,
        "reversedMagEstimateManual": "~0.6:1"
      },
      "sigma_70mm_f2_8_dg_macro_art_se": {
        "name": "Sigma 70mm f/2.8 DG Macro Art (Sony E)",
        "f": 70,
        "NM": 1,
        "PL": 105.8,
        "MFD": 258,
        "reversedMagEstimateManual": "~0.8:1"
      },
      "sigma_105mm_f2_8_dg_dn_macro_art_se": {
        "name": "Sigma 105mm F2.8 DG DN Macro Art (Sony E)",
        "f": 105,
        "NM": 1,
        "PL": 133.6,
        "MFD": 295,
        "reversedMagEstimateManual": "~0.5:1"
      },
      "laowa_100mm_f2_8_2x_macro_sony_fe": {
        "name": "Laowa 100mm f/2.8 2x Ultra Macro APO (Sony FE)",
        "f": 100,
        "NM": 2,
        "PL": 155,
        "MFD": 247,
        "reversedMagEstimateManual": "~0.5:1"
      },
      "sony_fe_50mm_f2_8_macro": {
        "name": "Sony FE 50mm f/2.8 Macro",
        "f": 50,
        "NM": 1,
        "PL": 71,
        "MFD": 160,
        "reversedMagEstimateManual": "~1.1:1"
      },
      "sony_fe_20mm_f1_8_g_ext_poc": {
        "name": "Sony FE 20mm f/1.8 G",
        "f": 20,
        "NM": 0.2,
        "PL": 84.7,
        "MFD": 190,
        "reversedMagEstimateManual": "~3.2:1"
      },
      "sony_fe_40mm_f2_5_g_ext_poc": {
        "name": "Sony FE 40mm f/2.5 G",
        "f": 40,
        "NM": 0.2,
        "PL": 45,
        "MFD": 280,
        "reversedMagEstimateManual": "~1.5:1"
      },
      "sony_fe_55mm_f1_8_za": {
        "name": "Sony Sonnar T* FE 55mm f/1.8 ZA",
        "f": 55,
        "NM": 0.14,
        "PL": 70.5,
        "MFD": 500,
        "reversedMagEstimateManual": "~1.0:1"
      },
      "sony_fe_28mm_f2": {
        "name": "Sony FE 28mm f/2",
        "f": 28,
        "NM": 0.13,
        "PL": 64,
        "MFD": 290,
        "reversedMagEstimateManual": "~2.4:1"
      },
      "sony_fe_12_24mm_f4_g": {
        "name": "Sony FE 12-24mm f/4 G",
        "f": 12,
        "NM": 0.14,
        "PL": 117.4,
        "MFD": 280,
        "reversedMagEstimateManual": "~4.5:1 (at 12mm), ~2.0:1 (at 24mm)"
      }
    }
  },
  "sony_e_apsc": {
    "systemName": "Sony E (APS-C)",
    "flangeDistance": 18,
    "sensorWidth": 23.5,
    "sensorHeight": 15.6,
    "typicalMegapixels": 26,
    "lenses": {
      "sony_e_30mm_f3_5_macro": {
        "name": "Sony E 30mm F3.5 Macro",
        "f": 30,
        "NM": 1,
        "PL": 55.63,
        "MFD": 95,
        "reversedMagEstimateManual": "~2.2:1"
      },
      "laowa_65mm_f2_8_2x_ultra_macro_apsc_sony_e": {
        "name": "Laowa 65mm f/2.8 2x Ultra Macro APO (Sony E)",
        "f": 65,
        "NM": 2,
        "PL": 100,
        "MFD": 170,
        "reversedMagEstimateManual": "~0.9:1"
      },
      "zeiss_touit_50mm_f2_8m_sony_e": {
        "name": "Zeiss Touit 50mm f/2.8M (Sony E)",
        "f": 50,
        "NM": 1,
        "PL": 91,
        "MFD": 240,
        "reversedMagEstimateManual": "~1.1:1"
      },
      "sigma_56mm_f1_4_dc_dn_c_sony_e": {
        "name": "Sigma 56mm f/1.4 DC DN Contemporary (Sony E)",
        "f": 56,
        "NM": 0.14,
        "PL": 59.5,
        "MFD": 500,
        "reversedMagEstimateManual": "~1.0:1"
      },
      "sony_e_16_55mm_f2_8_g": {
        "name": "Sony E 16-55mm f/2.8 G",
        "f": 16,
        "NM": 0.2,
        "PL": 100,
        "MFD": 330,
        "reversedMagEstimateManual": "~3.8:1 (at 16mm), ~1.0:1 (at 55mm)"
      },
      "sony_e_16mm_f2_8_pancake_ext_poc": {
        "name": "Sony E 16mm f/2.8",
        "f": 16,
        "NM": 0.08,
        "PL": 22.5,
        "MFD": 240,
        "reversedMagEstimateManual": "~3.8:1"
      },
      "sony_e_11mm_f1_8_ext_poc": {
        "name": "Sony E 11mm f/1.8",
        "f": 11,
        "NM": 0.13,
        "PL": 57.5,
        "MFD": 150,
        "reversedMagEstimateManual": "~5:1 or more"
      }
    }
  },
  "nikon_z_ff": {
    "systemName": "Nikon Z (Full Frame)",
    "flangeDistance": 16,
    "sensorWidth": 36,
    "sensorHeight": 24,
    "typicalMegapixels": 45,
    "lenses": {
      "nikon_z_mc_105mm_f2_8_vr_s": {
        "name": "Nikon NIKKOR Z MC 105mm f/2.8 VR S",
        "f": 105,
        "NM": 1,
        "PL": 140,
        "MFD": 290,
        "reversedMagEstimateManual": "~0.5:1"
      },
      "nikon_z_mc_50mm_f2_8": {
        "name": "Nikon NIKKOR Z MC 50mm f/2.8",
        "f": 50,
        "NM": 1,
        "PL": 66,
        "MFD": 160,
        "reversedMagEstimateManual": "~1.1:1"
      },
      "laowa_100mm_f2_8_2x_macro_nikon_z": {
        "name": "Laowa 100mm f/2.8 2X Ultra Macro APO (Nikon Z)",
        "f": 100,
        "NM": 2,
        "PL": 155,
        "MFD": 247,
        "reversedMagEstimateManual": "~0.5:1"
      },
      "nikon_z_50mm_f1_8_s": {
        "name": "Nikon NIKKOR Z 50mm f/1.8 S",
        "f": 50,
        "NM": 0.15,
        "PL": 86.5,
        "MFD": 400,
        "reversedMagEstimateManual": "~1.1:1"
      },
      "nikon_z_85mm_f1_8_s": {
        "name": "Nikon NIKKOR Z 85mm f/1.8 S",
        "f": 85,
        "NM": 0.12,
        "PL": 99,
        "MFD": 800,
        "reversedMagEstimateManual": "~0.6:1"
      },
      "nikon_z_20mm_f1_8_s_ext_poc": {
        "name": "Nikon NIKKOR Z 20mm f/1.8 S",
        "f": 20,
        "NM": 0.19,
        "PL": 108.5,
        "MFD": 200,
        "reversedMagEstimateManual": "~3.2:1"
      },
      "nikon_z_40mm_f2_ext_poc": {
        "name": "Nikon NIKKOR Z 40mm f/2",
        "f": 40,
        "NM": 0.17,
        "PL": 45.5,
        "MFD": 290,
        "reversedMagEstimateManual": "~1.5:1"
      },
      "nikon_z_24_70mm_f4_s": {
        "name": "Nikon NIKKOR Z 24-70mm f/4 S",
        "f": 24,
        "NM": 0.3,
        "PL": 88.5,
        "MFD": 300,
        "reversedMagEstimateManual": "~2.5:1 (at 24mm), ~0.8:1 (at 70mm)"
      }
    }
  },
  "nikon_z_apsc": {
    "systemName": "Nikon Z (APS-C)",
    "flangeDistance": 16,
    "sensorWidth": 23.5,
    "sensorHeight": 15.6,
    "typicalMegapixels": 21,
    "lenses": {
      "nikon_z_dx_24mm_f1_7": {
        "name": "Nikon NIKKOR Z DX 24mm f/1.7",
        "f": 24,
        "NM": 0.19,
        "PL": 40,
        "MFD": 180,
        "reversedMagEstimateManual": "~2.8:1"
      },
      "viltrox_af_25mm_f1_7_z_dx": {
        "name": "Viltrox AF 25mm f/1.7 Z (Nikon DX)",
        "f": 25,
        "NM": 0.11,
        "PL": 56.4,
        "MFD": 300,
        "reversedMagEstimateManual": "~2.6:1"
      },
      "nikon_z_dx_18_140mm_f3_5_6_3_vr": {
        "name": "Nikon NIKKOR Z DX 18-140mm f/3.5-6.3 VR",
        "f": 18,
        "NM": 0.33,
        "PL": 90,
        "MFD": 200,
        "reversedMagEstimateManual": "~3.5:1 (at 18mm), <1:1 (at 140mm)"
      },
      "nikon_z_mc_50mm_f2_8_on_dx": {
        "name": "Nikon NIKKOR Z MC 50mm f/2.8 (on DX)",
        "f": 50,
        "NM": 1,
        "PL": 66,
        "MFD": 160,
        "reversedMagEstimateManual": "~1.1:1"
      },
      "laowa_65mm_f2_8_2x_ultra_macro_apsc_nikon_z": {
        "name": "Laowa 65mm f/2.8 2x Ultra Macro APO (Nikon Z)",
        "f": 65,
        "NM": 2,
        "PL": 100,
        "MFD": 170,
        "reversedMagEstimateManual": "~0.9:1"
      },
      "nikon_z_dx_16_50mm_f3_5_6_3_vr_ext_poc": {
        "name": "Nikon NIKKOR Z DX 16-50mm f/3.5-6.3 VR",
        "f": 16,
        "NM": 0.2,
        "PL": 32,
        "MFD": 200,
        "reversedMagEstimateManual": "~3.8:1 (at 16mm)"
      },
      "nikon_z_dx_24mm_f1_7_ext_poc": {
        "name": "Nikon NIKKOR Z DX 24mm f/1.7",
        "f": 24,
        "NM": 0.19,
        "PL": 40,
        "MFD": 180,
        "reversedMagEstimateManual": "~2.8:1"
      }
    }
  },
  "canon_rf_ff": {
    "systemName": "Canon RF (Full Frame)",
    "flangeDistance": 20,
    "sensorWidth": 36,
    "sensorHeight": 24,
    "typicalMegapixels": 45,
    "lenses": {
      "canon_rf_100mm_f2_8l_macro_is_usm": {
        "name": "Canon RF 100mm F2.8L Macro IS USM",
        "f": 100,
        "NM": 1.4,
        "PL": 148,
        "MFD": 260,
        "reversedMagEstimateManual": "~0.5:1"
      },
      "canon_rf_85mm_f2_macro_is_stm": {
        "name": "Canon RF 85mm F2 Macro IS STM",
        "f": 85,
        "NM": 0.5,
        "PL": 90.5,
        "MFD": 350,
        "reversedMagEstimateManual": "~0.6:1"
      },
      "canon_rf_35mm_f1_8_macro_is_stm": {
        "name": "Canon RF 35mm F1.8 Macro IS STM",
        "f": 35,
        "NM": 0.5,
        "PL": 62.8,
        "MFD": 170,
        "reversedMagEstimateManual": "~1.8:1"
      },
      "laowa_85mm_f5_6_2x_macro_canon_rf": {
        "name": "Laowa 85mm f/5.6 2x Ultra Macro APO (Canon RF)",
        "f": 85,
        "NM": 2,
        "PL": 81,
        "MFD": 163,
        "reversedMagEstimateManual": "~0.6:1"
      },
      "canon_rf_50mm_f1_2l_usm": {
        "name": "Canon RF 50mm F1.2L USM",
        "f": 50,
        "NM": 0.19,
        "PL": 108,
        "MFD": 400,
        "reversedMagEstimateManual": "~1.1:1"
      },
      "canon_rf_16mm_f2_8_stm_ext_poc": {
        "name": "Canon RF 16mm f/2.8 STM",
        "f": 16,
        "NM": 0.26,
        "PL": 40.1,
        "MFD": 130,
        "reversedMagEstimateManual": "~3.8:1"
      },
      "canon_rf_28mm_f2_8_stm_pancake_ext_poc": {
        "name": "Canon RF 28mm f/2.8 STM",
        "f": 28,
        "NM": 0.17,
        "PL": 24.7,
        "MFD": 230,
        "reversedMagEstimateManual": "~2.4:1"
      }
    }
  },
  "canon_rf_apsc": {
    "systemName": "Canon RF (APS-C)",
    "flangeDistance": 20,
    "sensorWidth": 22.3,
    "sensorHeight": 14.9,
    "typicalMegapixels": 24,
    "lenses": {
      "canon_rfs_18_150mm_f3_5_6_3_is_stm": {
        "name": "Canon RF-S 18-150mm f/3.5-6.3 IS STM",
        "f": 18,
        "NM": 0.59,
        "PL": 127,
        "MFD": 120,
        "reversedMagEstimateManual": "~3.5:1 (at 18mm), <1:1 (at 150mm)"
      },
      "sigma_18_50mm_f2_8_dc_dn_c_rfs": {
        "name": "Sigma 18-50mm F2.8 DC DN Contemporary (RF-S)",
        "f": 18,
        "NM": 0.357,
        "PL": 74.5,
        "MFD": 121,
        "reversedMagEstimateManual": "~3.5:1 (at 18mm), ~1.1:1 (at 50mm)"
      },
      "canon_rfs_10_18mm_f4_5_6_3_is_stm": {
        "name": "Canon RF-S 10-18mm f/4.5-6.3 IS STM",
        "f": 10,
        "NM": 0.5,
        "PL": 44.9,
        "MFD": 86,
        "reversedMagEstimateManual": "~5:1 (at 10mm), ~3.5:1 (at 18mm)"
      },
      "canon_rf_35mm_f1_8_macro_is_stm_on_apsc": {
        "name": "Canon RF 35mm F1.8 Macro IS STM (on APS-C)",
        "f": 35,
        "NM": 0.5,
        "PL": 62.8,
        "MFD": 170,
        "reversedMagEstimateManual": "~1.8:1"
      },
      "canon_rfs_55_210mm_f5_7_1_is_stm": {
        "name": "Canon RF-S 55-210mm f/5-7.1 IS STM",
        "f": 55,
        "NM": 0.28,
        "PL": 92.9,
        "MFD": 730,
        "reversedMagEstimateManual": "~1.0:1 (at 55mm), <1:1 (at 210mm)"
      },
      "canon_rfs_10_18mm_f4_5_6_3_is_stm_ext_poc": {
        "name": "Canon RF-S 10-18mm f/4.5-6.3 IS STM",
        "f": 10,
        "NM": 0.5,
        "PL": 44.9,
        "MFD": 86,
        "reversedMagEstimateManual": "~5:1 or more (at 10mm)"
      },
      "canon_rfs_18_45mm_f4_5_6_3_is_stm_ext_poc": {
        "name": "Canon RF-S 18-45mm f/4.5-6.3 IS STM",
        "f": 18,
        "NM": 0.26,
        "PL": 44.3,
        "MFD": 250,
        "reversedMagEstimateManual": "~3.5:1 (at 18mm)"
      }
    }
  },
  "m43": {
    "systemName": "Micro Four Thirds",
    "flangeDistance": 19.25,
    "sensorWidth": 17.3,
    "sensorHeight": 13,
    "typicalMegapixels": 20,
    "lenses": {
      "olympus_mzuiko_60mm_f2_8_macro": {
        "name": "Olympus M.Zuiko Digital ED 60mm f/2.8 Macro",
        "f": 60,
        "NM": 1,
        "PL": 82,
        "MFD": 190,
        "reversedMagEstimateManual": "~0.9:1"
      },
      "om_system_mzuiko_90mm_f3_5_macro_is_pro": {
        "name": "OM System M.Zuiko Digital ED 90mm F3.5 Macro IS PRO",
        "f": 90,
        "NM": 2,
        "PL": 136,
        "MFD": 224,
        "reversedMagEstimateManual": "~0.6:1"
      },
      "panasonic_lumix_g_30mm_f2_8_macro": {
        "name": "Panasonic Lumix G Macro 30mm f/2.8 ASPH MEGA O.I.S.",
        "f": 30,
        "NM": 1,
        "PL": 63.5,
        "MFD": 105,
        "reversedMagEstimateManual": "~2.2:1"
      },
      "laowa_50mm_f2_8_2x_macro_mft": {
        "name": "Laowa 50mm f/2.8 2x Ultra Macro APO (MFT)",
        "f": 50,
        "NM": 2,
        "PL": 79,
        "MFD": 135,
        "reversedMagEstimateManual": "~1.1:1"
      },
      "panasonic_leica_nocticron_42_5mm_f1_2": {
        "name": "Panasonic Leica DG Nocticron 42.5mm f/1.2 ASPH. POWER O.I.S.",
        "f": 42.5,
        "NM": 0.1,
        "PL": 76.8,
        "MFD": 500,
        "reversedMagEstimateManual": "~1.4:1"
      },
      "panasonic_lumix_g_14mm_f2_5_ii_ext_poc": {
        "name": "Panasonic Lumix G 14mm f/2.5 II ASPH.",
        "f": 14,
        "NM": 0.1,
        "PL": 20.5,
        "MFD": 180,
        "reversedMagEstimateManual": "~4:1"
      },
      "olympus_mzuiko_8mm_f1_8_fisheye_pro_ext_poc": {
        "name": "Olympus M.Zuiko Digital ED 8mm f/1.8 Fisheye PRO",
        "f": 8,
        "NM": 0.2,
        "PL": 80,
        "MFD": 120,
        "reversedMagEstimateManual": "~6:1 or more"
      }
    }
  },
  "canon_ef_apsc": {
    "systemName": "Canon EF-S (APS-C DSLR)",
    "flangeDistance": 44,
    "sensorWidth": 22.3,
    "sensorHeight": 14.9,
    "typicalMegapixels": 24,
    "lenses": {
      "canon_efs_18_55mm_f3_5_5_6_is_stm": {
        "name": "Canon EF-S 18-55mm f/3.5-5.6 IS STM",
        "f": 18,
        "NM": 0.36,
        "PL": 95.1,
        "MFD": 250,
        "reversedMagEstimateManual": "~3.5:1 (at 18mm), ~0.9:1 (at 55mm)"
      }
    }
  },
  "vintage_lens_ff_adaptable": {
    "systemName": "Vintage Lenses (Adaptable to FF)",
    "flangeDistance": 44,
    "sensorWidth": 36,
    "sensorHeight": 24,
    "typicalMegapixels": 24,
    "lenses": {
      "nikon_nikkor_28mm_f2_8_ais": {
        "name": "Nikon Nikkor 28mm f/2.8 AIS",
        "f": 28,
        "NM": 0.11,
        "PL": 44.5,
        "MFD": 200,
        "reversedMagEstimateManual": "~2.5:1"
      }
    }
  },
  "enlarger_lens_adaptable": {
    "systemName": "Enlarger Lenses (for Bellows/Adapters)",
    "flangeDistance": 25,
    "sensorWidth": 36,
    "sensorHeight": 24,
    "typicalMegapixels": 24,
    "lenses": {
      "el_nikkor_50mm_f2_8n": {
        "name": "Nikon EL-Nikkor 50mm f/2.8N",
        "f": 50,
        "NM": 1.17,
        "PL": 39,
        "MFD": 0,
        "reversedMagEstimateManual": "~1.2:1 (typically on bellows/tubes)"
      }
    }
  }
};

export const MICROSCOPE_OBJECTIVES_DATA = {
  "mo_4x_010_160_achro": {
    "name": "4x NA 0.10 Achromat (DIN 160mm)",
    "M_obj": 4,
    "NA": 0.1,
    "standardFiniteTubeLength": 160,
    "WD_obj_mm": 26,
    "PL_obj_body_mm": 29.2,
    "imageCircle_mm": 20,
    "isPlan": false,
    "sourceRef": "Edmund Optics (#33-436)"
  },
  "mo_10x_025_160_achro": {
    "name": "10x NA 0.25 Achromat (DIN 160mm)",
    "M_obj": 10,
    "NA": 0.25,
    "standardFiniteTubeLength": 160,
    "WD_obj_mm": 4.4,
    "PL_obj_body_mm": 38.7,
    "imageCircle_mm": 20,
    "isPlan": false,
    "sourceRef": "Edmund Optics (#33-437)"
  },
  "mo_40x_065_160_achro": {
    "name": "40x NA 0.65 Achromat (DIN 160mm)",
    "M_obj": 40,
    "NA": 0.65,
    "standardFiniteTubeLength": 160,
    "WD_obj_mm": 0.6,
    "PL_obj_body_mm": 44.5,
    "imageCircle_mm": 20,
    "isPlan": false,
    "sourceRef": "Edmund Optics (#36-038)"
  },
  "mo_10x_025_160_plan": {
    "name": "10x NA 0.25 Plan Achromat (DIN 160mm)",
    "M_obj": 10,
    "NA": 0.25,
    "standardFiniteTubeLength": 160,
    "WD_obj_mm": 1.5,
    "PL_obj_body_mm": 44,
    "imageCircle_mm": 20,
    "isPlan": true,
    "sourceRef": "Edmund Optics (#43-907)"
  },
  "mo_40x_065_160_plan": {
    "name": "40x NA 0.65 Plan Achromat (DIN 160mm)",
    "M_obj": 40,
    "NA": 0.65,
    "standardFiniteTubeLength": 160,
    "WD_obj_mm": 0.3,
    "PL_obj_body_mm": 46,
    "imageCircle_mm": 20,
    "isPlan": true,
    "sourceRef": "Edmund Optics (#43-908)"
  },
  "mo_10x_025_160_amscope_plan": {
    "name": "10x NA 0.25 Plan Achromat (AmScope DIN 160mm)",
    "M_obj": 10,
    "NA": 0.25,
    "standardFiniteTubeLength": 160,
    "WD_obj_mm": 5.84,
    "PL_obj_body_mm": 44,
    "imageCircle_mm": 19,
    "isPlan": true,
    "sourceRef": "AmScope (Representative)"
  },
  "mo_40x_065_160_amscope_plan": {
    "name": "40x NA 0.65 Plan Achromat (AmScope DIN 160mm)",
    "M_obj": 40,
    "NA": 0.65,
    "standardFiniteTubeLength": 160,
    "WD_obj_mm": 0.633,
    "PL_obj_body_mm": 46,
    "imageCircle_mm": 19,
    "isPlan": true,
    "sourceRef": "AmScope (Representative)"
  }
};

export const MACRO_ACCESSORIES_DATA = {
  "none": {
    "name": "No Accessory",
    "length": 0,
    "type": "none"
  },
  "et10mm": {
    "name": "10mm Extension Tube",
    "length": 10,
    "type": "tube"
  },
  "et12mm": {
    "name": "12mm Extension Tube",
    "length": 12,
    "type": "tube"
  },
  "et16mm": {
    "name": "16mm Extension Tube",
    "length": 16,
    "type": "tube"
  },
  "et20mm": {
    "name": "20mm Extension Tube",
    "length": 20,
    "type": "tube"
  },
  "et25mm": {
    "name": "25mm Extension Tube",
    "length": 25,
    "type": "tube"
  },
  "et36mm": {
    "name": "36mm Extension Tube",
    "length": 36,
    "type": "tube"
  },
  "et48mm": {
    "name": "48mm (12+36)",
    "length": 48,
    "type": "tube"
  },
  "et52mm": {
    "name": "52mm (16+36)",
    "length": 52,
    "type": "tube"
  },
  "et56mm": {
    "name": "56mm (20+36)",
    "length": 56,
    "type": "tube"
  },
  "et68mm": {
    "name": "68mm (12+20+36)",
    "length": 68,
    "type": "tube"
  },
  "et72mm": {
    "name": "72mm (36x2)",
    "length": 72,
    "type": "tube"
  },
  "reversal_mount": {
    "name": "Lens Reversal Mount",
    "length": 8,
    "type": "reversal",
    "effect_note": "Magnification highly variable. Uses estimate if available."
  },
  "raynox_dcr_250": {
    "name": "Raynox DCR-250 (+8 Diopter)",
    "length": 0,
    "type": "diopter",
    "power": 8,
    "effect_note": "Adds +8 diopters of optical power."
  }
};

export const REFERENCE_OBJECTS = {
  "banana": {
    "name": "banana",
    "lengthMm": 180,
    "widthMm": 35
  },
  "quarter": {
    "name": "US quarter",
    "diameterMm": 24.26
  },
  "rice": {
    "name": "rice grain",
    "lengthMm": 6,
    "widthMm": 1.5
  },
  "target": {
    "name": "1 mm square",
    "sizeMm": 1
  },
  "tardigrade": {
    "name": "tardigrade",
    "lengthMm": 0.4,
    "widthMm": 0.5
  }
};
