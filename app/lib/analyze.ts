import type { TrashAnalysis } from './types';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'anthropic/claude-3.5-sonnet';

const SYSTEM_PROMPT = `Analyze trash in image. JSON only, percentages sum to 100. Use "" for description and suggestedCleanup if needed:
{"glassPercentage":0,"plasticPercentage":0,"paperPercentage":0,"organicPercentage":0,"metalPercentage":0,"otherPercentage":0,"eWastePercentage":0,"hazardousPercentage":0,"specialTreatmentPercentage":0,"description":"","suggestedCleanup":""}`;

const PERCENTAGE_KEYS: (keyof TrashAnalysis)[] = [
  'glassPercentage',
  'plasticPercentage',
  'paperPercentage',
  'organicPercentage',
  'metalPercentage',
  'otherPercentage',
  'eWastePercentage',
  'hazardousPercentage',
  'specialTreatmentPercentage',
];

export async function analyzeImageForTrash(
  imageBase64: string,
  mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'
): Promise<TrashAnalysis> {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) throw new Error('OPENROUTER_API_KEY is not set');

  const dataUri = `data:${mediaType};base64,${imageBase64}`;

  const res = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3001',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 122,
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Analyze.',
            },
            {
              type: 'image_url',
              image_url: { url: dataUri, detail: 'low' as const },
            },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenRouter API error (${res.status}): ${body}`);
  }

  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = json.choices?.[0]?.message?.content ?? '';
  const cleaned = text
    .replace(/^```json\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim();

  let parsed: TrashAnalysis;
  try {
    parsed = JSON.parse(cleaned) as TrashAnalysis;
  } catch {
    // Truncated response - try to repair or extract percentages
    let repaired = cleaned;
    if ((repaired.match(/"/g) ?? []).length % 2 === 1) repaired += '"';
    const open = (repaired.match(/\{/g) ?? []).length - (repaired.match(/\}/g) ?? []).length;
    if (open > 0) repaired += '}'.repeat(open);
    try {
      parsed = JSON.parse(repaired) as TrashAnalysis;
    } catch {
      // Fallback: extract percentages with regex
      const extracted: Record<string, number> = {};
      for (const key of PERCENTAGE_KEYS) {
        const m = cleaned.match(new RegExp(`"${key}"\\s*:\\s*(\\d+)`));
        extracted[key] = m ? Number(m[1]) : 0;
      }
      const sum = Object.values(extracted).reduce((a, b) => a + b, 0);
      if (sum === 0) {
        throw new Error(`Invalid JSON from model (possibly truncated): ${cleaned.slice(0, 200)}...`);
      }
      parsed = {
        ...extracted,
        description: '',
        suggestedCleanup: '',
      } as TrashAnalysis;
    }
  }

  const raw: Record<string, number> = {};
  let sum = 0;
  for (const key of PERCENTAGE_KEYS) {
    const v = parsed[key] ?? 0;
    raw[key] = Math.max(0, Number(v));
    sum += raw[key];
  }
  if (sum > 0 && Math.abs(sum - 100) > 0.01) {
    const scale = 100 / sum;
    for (const key of PERCENTAGE_KEYS) {
      raw[key] = raw[key] * scale;
    }
  }

  return {
    ...raw,
    description: parsed.description,
    suggestedCleanup: parsed.suggestedCleanup,
  } as TrashAnalysis;
}
