import type { TrashRecord, TrashAnalysis } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

export async function getTrashRecords(): Promise<TrashRecord[]> {
  const res = await fetch(`${API_URL}/api/trash`, {
    next: { revalidate: 30 },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch records: ${res.statusText}`);
  }
  return res.json() as Promise<TrashRecord[]>;
}

export async function analyzeImage(
  formData: FormData
): Promise<{ trash: TrashAnalysis }> {
  const res = await fetch(`${API_URL}/api/analyze-image`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const json = (await res
      .json()
      .catch(() => ({ error: 'Unknown error' }))) as { error?: string };
    throw new Error(json.error ?? 'Image analysis failed');
  }
  return res.json() as Promise<{ trash: TrashAnalysis }>;
}
