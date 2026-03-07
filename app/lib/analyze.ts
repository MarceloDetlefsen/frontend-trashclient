import type { TrashAnalysis } from './types';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'anthropic/claude-3.5-sonnet';

const SYSTEM_PROMPT = `You are a waste detection system. Analyze the image and estimate the composition of visible trash.

Include standard recyclables (glass, plastic, paper, organic, metal), plus:
- e-waste: electronics, batteries, cables
- hazardous: chemicals, paint, medical, sharp objects
- special treatment: items that need dedicated collection (e.g. tires, mattresses, large appliances)

Respond with a single JSON object only, no markdown or extra text. Use this exact shape (percentages must sum to 100):
{
  "glassPercentage": number,
  "plasticPercentage": number,
  "paperPercentage": number,
  "organicPercentage": number,
  "metalPercentage": number,
  "otherPercentage": number,
  "eWastePercentage": number,
  "hazardousPercentage": number,
  "specialTreatmentPercentage": number,
  "description": "short description of what you see",
  "suggestedCleanup": "brief recommendation to clean this area"
}`;

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
      max_tokens: 256,
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
              text: 'Analyze the trash in this image and respond with the JSON object only.',
            },
            {
              type: 'image_url',
              image_url: { url: dataUri },
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
  const parsed = JSON.parse(cleaned) as TrashAnalysis;

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
