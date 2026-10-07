export interface OneMapStatus {
  configured: boolean;
  hasActiveToken: boolean;
  token: string | null;
  provider: 'onemap' | 'cartocdn_fallback';
  expiry: number | null;
  supportedStyles: string[];
  message: string;
}

export async function fetchOneMapStatus(): Promise<OneMapStatus> {
  try {
    const res = await fetch('/api/onemap/token');
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Failed to query OneMap token status:', err);
  }

  return {
    configured: false,
    hasActiveToken: false,
    token: null,
    provider: 'cartocdn_fallback',
    expiry: null,
    supportedStyles: ['Night', 'Default', 'Grey', 'Original'],
    message: 'Using styled fallback base layer.',
  };
}

export type OneMapStyle = 'Night' | 'Default' | 'Grey' | 'Original';

export function getTileLayerUrl(style: OneMapStyle = 'Night'): string {
  // Uses our backend tile proxy that handles OneMap auth headers and fallback
  return `/api/onemap/tile/${style}/{z}/{x}/{y}`;
}

// Singapore Center & Bounds
export const SINGAPORE_CENTER: [number, number] = [1.3521, 103.8198];
export const SINGAPORE_BOUNDS: [[number, number], [number, number]] = [
  [1.15, 103.58],
  [1.48, 104.05],
];

// Approximate region polygons for visual overlay on map
export const REGION_BOUNDARIES: Record<string, [number, number][]> = {
  north: [
    [1.47, 103.76],
    [1.45, 103.86],
    [1.41, 103.88],
    [1.39, 103.84],
    [1.39, 103.77],
  ],
  south: [
    [1.32, 103.78],
    [1.32, 103.86],
    [1.27, 103.87],
    [1.24, 103.82],
    [1.26, 103.78],
  ],
  east: [
    [1.42, 103.89],
    [1.41, 104.03],
    [1.33, 104.02],
    [1.31, 103.88],
    [1.37, 103.88],
  ],
  west: [
    [1.44, 103.62],
    [1.42, 103.76],
    [1.33, 103.77],
    [1.28, 103.69],
    [1.23, 103.62],
  ],
  central: [
    [1.39, 103.78],
    [1.39, 103.87],
    [1.32, 103.87],
    [1.32, 103.78],
  ],
};
