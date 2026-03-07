export interface TrashAnalysis {
  glassPercentage: number;
  plasticPercentage: number;
  paperPercentage: number;
  organicPercentage: number;
  metalPercentage: number;
  otherPercentage: number;
  description?: string;
  suggestedCleanup?: string;
}

export interface TrashRecord extends TrashAnalysis {
  id: string;
  createdAt: string;
  latitude: number;
  longitude: number;
  imageUrl?: string;
  source?: string;
}

export interface ApiError {
  error: string;
  code?: string;
}
