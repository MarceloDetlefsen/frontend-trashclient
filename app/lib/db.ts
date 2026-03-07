import { createClient } from '@libsql/client';
import type { TrashRecord } from './types';

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

const client = url && authToken
  ? createClient({ url, authToken })
  : null;

const INIT_SQL = `
CREATE TABLE IF NOT EXISTS trash_records (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  glass_percentage REAL NOT NULL,
  plastic_percentage REAL NOT NULL,
  paper_percentage REAL NOT NULL,
  organic_percentage REAL NOT NULL,
  metal_percentage REAL NOT NULL,
  other_percentage REAL NOT NULL,
  e_waste_percentage REAL NOT NULL DEFAULT 0,
  hazardous_percentage REAL NOT NULL DEFAULT 0,
  special_treatment_percentage REAL NOT NULL DEFAULT 0,
  description TEXT,
  suggested_cleanup TEXT,
  image_url TEXT,
  source TEXT
);
`;

let initialized = false;

async function init() {
  if (!client || initialized) return;
  await client.execute(INIT_SQL);
  // Add new columns to existing tables (ignore if already exist)
  const alterColumns = [
    'ALTER TABLE trash_records ADD COLUMN e_waste_percentage REAL NOT NULL DEFAULT 0',
    'ALTER TABLE trash_records ADD COLUMN hazardous_percentage REAL NOT NULL DEFAULT 0',
    'ALTER TABLE trash_records ADD COLUMN special_treatment_percentage REAL NOT NULL DEFAULT 0',
  ];
  for (const sql of alterColumns) {
    try {
      await client.execute(sql);
    } catch {
      // Column already exists
    }
  }
  initialized = true;
}

export interface TrashRecordInsert {
  latitude: number;
  longitude: number;
  glassPercentage: number;
  plasticPercentage: number;
  paperPercentage: number;
  organicPercentage: number;
  metalPercentage: number;
  otherPercentage: number;
  eWastePercentage?: number;
  hazardousPercentage?: number;
  specialTreatmentPercentage?: number;
  description?: string;
  suggestedCleanup?: string;
  imageUrl?: string;
  source?: string;
}

export async function insertTrashRecord(data: TrashRecordInsert): Promise<TrashRecord> {
  if (!client) throw new Error('Database not configured. Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN.');
  await init();
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  await client.execute({
    sql: `INSERT INTO trash_records (
      id, created_at, latitude, longitude,
      glass_percentage, plastic_percentage, paper_percentage,
      organic_percentage, metal_percentage, other_percentage,
      e_waste_percentage, hazardous_percentage, special_treatment_percentage,
      description, suggested_cleanup, image_url, source
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      id,
      createdAt,
      data.latitude,
      data.longitude,
      data.glassPercentage,
      data.plasticPercentage,
      data.paperPercentage,
      data.organicPercentage,
      data.metalPercentage,
      data.otherPercentage,
      data.eWastePercentage ?? 0,
      data.hazardousPercentage ?? 0,
      data.specialTreatmentPercentage ?? 0,
      data.description ?? null,
      data.suggestedCleanup ?? null,
      data.imageUrl ?? null,
      data.source ?? 'claude',
    ],
  });
  return {
    id,
    createdAt,
    latitude: data.latitude,
    longitude: data.longitude,
    glassPercentage: data.glassPercentage,
    plasticPercentage: data.plasticPercentage,
    paperPercentage: data.paperPercentage,
    organicPercentage: data.organicPercentage,
    metalPercentage: data.metalPercentage,
    otherPercentage: data.otherPercentage,
    eWastePercentage: data.eWastePercentage ?? 0,
    hazardousPercentage: data.hazardousPercentage ?? 0,
    specialTreatmentPercentage: data.specialTreatmentPercentage ?? 0,
    description: data.description,
    suggestedCleanup: data.suggestedCleanup,
    imageUrl: data.imageUrl,
    source: data.source,
  };
}

export async function updateTrashRecordImageUrl(id: string, imageUrl: string): Promise<void> {
  if (!client) return;
  await init();
  await client.execute({
    sql: 'UPDATE trash_records SET image_url = ? WHERE id = ?',
    args: [imageUrl, id],
  });
}

export async function getTrashRecords(): Promise<TrashRecord[]> {
  if (!client) return [];
  await init();
  const rs = await client.execute('SELECT * FROM trash_records ORDER BY created_at DESC');
  return rs.rows.map((row) => ({
    id: row.id as string,
    createdAt: row.created_at as string,
    latitude: row.latitude as number,
    longitude: row.longitude as number,
    glassPercentage: row.glass_percentage as number,
    plasticPercentage: row.plastic_percentage as number,
    paperPercentage: row.paper_percentage as number,
    organicPercentage: row.organic_percentage as number,
    metalPercentage: row.metal_percentage as number,
    otherPercentage: row.other_percentage as number,
    eWastePercentage: (row.e_waste_percentage as number) ?? 0,
    hazardousPercentage: (row.hazardous_percentage as number) ?? 0,
    specialTreatmentPercentage: (row.special_treatment_percentage as number) ?? 0,
    description: row.description as string | undefined,
    suggestedCleanup: row.suggested_cleanup as string | undefined,
    imageUrl: row.image_url as string | undefined,
    source: row.source as string | undefined,
  }));
}
