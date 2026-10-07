import { AirQualityBand, PM25Band } from '../types/nea';

/**
 * NEA Singapore Official PSI Bands & Health Advisories:
 * 0 - 50: Good
 * 51 - 100: Moderate
 * 101 - 200: Unhealthy
 * 201 - 300: Very Unhealthy
 * > 300: Hazardous
 */
export const PSI_BANDS: AirQualityBand[] = [
  {
    level: 'Good',
    min: 0,
    max: 50,
    colorHex: '#10b981', // emerald-500
    bgClass: 'bg-emerald-500/10',
    textClass: 'text-emerald-400',
    borderClass: 'border-emerald-500/30',
    dotClass: 'bg-emerald-500',
    generalAdvisory: 'Normal outdoor activities can be continued.',
    vulnerableAdvisory: 'Normal outdoor activities can be continued.',
  },
  {
    level: 'Moderate',
    min: 51,
    max: 100,
    colorHex: '#0284c7', // sky-600
    bgClass: 'bg-sky-500/10',
    textClass: 'text-sky-400',
    borderClass: 'border-sky-500/30',
    dotClass: 'bg-sky-400',
    generalAdvisory: 'Normal outdoor activities can be continued for most individuals.',
    vulnerableAdvisory: 'Normal outdoor activities can be continued.',
  },
  {
    level: 'Unhealthy',
    min: 101,
    max: 200,
    colorHex: '#f59e0b', // amber-500
    bgClass: 'bg-amber-500/10',
    textClass: 'text-amber-400',
    borderClass: 'border-amber-500/30',
    dotClass: 'bg-amber-500',
    generalAdvisory: 'Reduce prolonged or strenuous outdoor physical exertion.',
    vulnerableAdvisory: 'Minimise outdoor activity. Wear N95 respirator if prolonged outdoor exposure is required.',
  },
  {
    level: 'Very Unhealthy',
    min: 201,
    max: 300,
    colorHex: '#ea580c', // orange-600
    bgClass: 'bg-orange-500/15',
    textClass: 'text-orange-400',
    borderClass: 'border-orange-500/40',
    dotClass: 'bg-orange-500',
    generalAdvisory: 'Avoid prolonged outdoor physical exertion. Stay indoors where possible.',
    vulnerableAdvisory: 'Avoid outdoor activities. Keep doors and windows closed.',
  },
  {
    level: 'Hazardous',
    min: 301,
    max: 999,
    colorHex: '#e11d48', // rose-600
    bgClass: 'bg-rose-500/20',
    textClass: 'text-rose-400',
    borderClass: 'border-rose-500/40',
    dotClass: 'bg-rose-500',
    generalAdvisory: 'Minimise outdoor activities. Stay indoors with air cleaning/filtration running.',
    vulnerableAdvisory: 'Strictly avoid going outdoors. Seek medical attention if experiencing respiratory distress.',
  },
];

export function getPsiBand(psiValue: number | undefined | null): AirQualityBand {
  if (psiValue === undefined || psiValue === null || isNaN(psiValue)) {
    return PSI_BANDS[0];
  }
  for (const band of PSI_BANDS) {
    if (psiValue >= band.min && psiValue <= band.max) {
      return band;
    }
  }
  return PSI_BANDS[PSI_BANDS.length - 1];
}

/**
 * NEA 1-hr PM 2.5 Bands (in µg/m³):
 * Band I (0 - 55 µg/m³): Normal
 * Band II (56 - 150 µg/m³): Elevated
 * Band III (151 - 250 µg/m³): High
 * Band IV (> 250 µg/m³): Very High
 */
export const PM25_BANDS: PM25Band[] = [
  {
    level: 'Normal',
    min: 0,
    max: 55,
    colorHex: '#10b981',
    bgClass: 'bg-emerald-500/10',
    textClass: 'text-emerald-400',
    borderClass: 'border-emerald-500/30',
    generalAdvisory: 'Air quality is acceptable. Normal activities can be maintained.',
    vulnerableAdvisory: 'Normal outdoor activities permitted.',
  },
  {
    level: 'Elevated',
    min: 56,
    max: 150,
    colorHex: '#f59e0b',
    bgClass: 'bg-amber-500/10',
    textClass: 'text-amber-400',
    borderClass: 'border-amber-500/30',
    generalAdvisory: 'Moderate particulate level. Healthy individuals may continue usual activities.',
    vulnerableAdvisory: 'Individuals with heart or respiratory illnesses should reduce intense outdoor physical exertion.',
  },
  {
    level: 'High',
    min: 151,
    max: 250,
    colorHex: '#ea580c',
    bgClass: 'bg-orange-500/15',
    textClass: 'text-orange-400',
    borderClass: 'border-orange-500/40',
    generalAdvisory: 'High particulate load. Reduce strenuous outdoor activity.',
    vulnerableAdvisory: 'Avoid prolonged outdoor activity. Sensitive individuals should stay indoors.',
  },
  {
    level: 'Very High',
    min: 251,
    max: 999,
    colorHex: '#e11d48',
    bgClass: 'bg-rose-500/20',
    textClass: 'text-rose-400',
    borderClass: 'border-rose-500/40',
    generalAdvisory: 'Significant haze particulates. Everyone should minimise outdoor exposure.',
    vulnerableAdvisory: 'Stay indoors with air cleaner. Avoid physical exertion outdoors.',
  },
];

export function getPm25Band(val: number | undefined | null): PM25Band {
  if (val === undefined || val === null || isNaN(val)) {
    return PM25_BANDS[0];
  }
  for (const band of PM25_BANDS) {
    if (val >= band.min && val <= band.max) {
      return band;
    }
  }
  return PM25_BANDS[PM25_BANDS.length - 1];
}

/**
 * Calculates atmospheric haziness index (0 to 1) based on PSI and PM2.5
 */
export function calculateHazeIntensity(psi: number = 0, pm25: number = 0): {
  intensity: number; // 0 (crystal clear) to 1 (thick smog/haze)
  category: 'Clear' | 'Slight Haze' | 'Moderate Haze' | 'Severe Haze';
  description: string;
} {
  // Normalize PSI: 0-50 -> 0 to 0.15; 51-100 -> 0.15 to 0.4; 101-200 -> 0.4 to 0.75; 200+ -> 0.75 to 1.0
  let psiFactor = 0;
  if (psi <= 50) {
    psiFactor = (psi / 50) * 0.15;
  } else if (psi <= 100) {
    psiFactor = 0.15 + ((psi - 50) / 50) * 0.25;
  } else if (psi <= 200) {
    psiFactor = 0.4 + ((psi - 100) / 100) * 0.35;
  } else {
    psiFactor = Math.min(1.0, 0.75 + ((psi - 200) / 100) * 0.25);
  }

  // PM 2.5 factor
  let pm25Factor = 0;
  if (pm25 <= 55) {
    pm25Factor = (pm25 / 55) * 0.2;
  } else if (pm25 <= 150) {
    pm25Factor = 0.2 + ((pm25 - 55) / 95) * 0.4;
  } else {
    pm25Factor = Math.min(1.0, 0.6 + ((pm25 - 150) / 100) * 0.4);
  }

  const intensity = Math.max(0, Math.min(1, Math.max(psiFactor, pm25Factor)));

  if (intensity < 0.2) {
    return {
      intensity,
      category: 'Clear',
      description: 'Clear atmospheric visibility with nominal particulate levels.',
    };
  } else if (intensity < 0.45) {
    return {
      intensity,
      category: 'Slight Haze',
      description: 'Mild atmospheric haze visible in distant skyline perspectives.',
    };
  } else if (intensity < 0.75) {
    return {
      intensity,
      category: 'Moderate Haze',
      description: 'Noticeable haze particulate scatter with reduced horizon clarity.',
    };
  } else {
    return {
      intensity,
      category: 'Severe Haze',
      description: 'Dense transboundary haze smoke layer significantly obscuring the skyline.',
    };
  }
}

/**
 * Calculates Heat Index / Apparent Temperature in Celsius
 */
export function calculateHeatIndex(tempC: number, humidityPct: number): number {
  if (tempC < 27) return tempC;
  const T = tempC * 1.8 + 32;
  const R = humidityPct;
  const hi =
    -42.379 +
    2.04901523 * T +
    10.14333127 * R -
    0.22475541 * T * R -
    0.00683783 * T * T -
    0.05481717 * R * R +
    0.00122874 * T * T * R +
    0.00085282 * T * R * R -
    0.00000199 * T * T * R * R;
  return Math.round(((hi - 32) / 1.8) * 10) / 10;
}
