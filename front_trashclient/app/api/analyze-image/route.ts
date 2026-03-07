import { NextResponse } from 'next/server';
import { uploadTrashImage, useCloudinary } from '@/app/lib/cloudinary';
import { analyzeImageForTrash } from '@/app/lib/analyze';
import {
  insertTrashRecord,
  updateTrashRecordImageUrl,
} from '@/app/lib/db';

const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
] as const;

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('image') as File | null;
    const latRaw = formData.get('latitude');
    const lngRaw = formData.get('longitude');
    const lat = latRaw != null ? Number(latRaw) : NaN;
    const lng = lngRaw != null ? Number(lngRaw) : NaN;

    if (!file) {
      return NextResponse.json(
        { error: "Missing image file. Send as multipart/form-data with field 'image'.", code: 'MISSING_IMAGE' },
        { status: 400 }
      );
    }
    if (!ALLOWED_TYPES.includes(file.type as (typeof ALLOWED_TYPES)[number])) {
      return NextResponse.json(
        { error: 'Invalid image type. Use JPEG, PNG, GIF, or WebP.' },
        { status: 400 }
      );
    }
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return NextResponse.json(
        {
          error: 'latitude and longitude are required (numbers).',
          code: 'MISSING_COORDINATES',
        },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString('base64');
    const mediaType = file.type as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';

    const trash = await analyzeImageForTrash(base64, mediaType);

    const record = await insertTrashRecord({
      latitude: lat,
      longitude: lng,
      ...trash,
      source: 'claude',
    });

    if (useCloudinary()) {
      try {
        const imageUrl = await uploadTrashImage(buffer, file.type, record.id);
        await updateTrashRecordImageUrl(record.id, imageUrl);
      } catch (e) {
        console.error('Cloudinary upload failed:', e);
      }
    }

    return NextResponse.json({
      trash,
      id: record.id,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to analyze image';
    return NextResponse.json(
      { error: message, code: 'ANALYZE_ERROR' },
      { status: 500 }
    );
  }
}
