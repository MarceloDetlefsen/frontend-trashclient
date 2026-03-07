import type { TrashAnalysis } from './types';

export type WasteKey = keyof Pick<
  TrashAnalysis,
  | 'glassPercentage'
  | 'plasticPercentage'
  | 'paperPercentage'
  | 'organicPercentage'
  | 'metalPercentage'
  | 'otherPercentage'
  | 'eWastePercentage'
  | 'hazardousPercentage'
  | 'specialTreatmentPercentage'
>;

export interface WasteType {
  key: WasteKey;
  label: string;
  color: string;
}

export const WASTE_TYPES: WasteType[] = [
  { key: 'glassPercentage', label: 'Glass', color: '#38bdf8' },
  { key: 'plasticPercentage', label: 'Plastic', color: '#f97316' },
  { key: 'paperPercentage', label: 'Paper', color: '#eab308' },
  { key: 'organicPercentage', label: 'Organic', color: '#22c55e' },
  { key: 'metalPercentage', label: 'Metal', color: '#94a3b8' },
  { key: 'otherPercentage', label: 'Other', color: '#a855f7' },
  { key: 'eWastePercentage', label: 'E-Waste', color: '#6366f1' },
  { key: 'hazardousPercentage', label: 'Hazardous', color: '#ef4444' },
  { key: 'specialTreatmentPercentage', label: 'Special', color: '#8b5cf6' },
];

export interface DominantWaste {
  label: string;
  color: string;
  value: number;
}

export function getDominantWaste(analysis: TrashAnalysis): DominantWaste {
  const candidates = WASTE_TYPES.map((t) => ({
    label: t.label,
    color: t.color,
    value: analysis[t.key],
  }));
  return candidates.reduce((prev, curr) => (curr.value > prev.value ? curr : prev));
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatCoord(value: number): string {
  return value.toFixed(4);
}
