import { NextResponse } from 'next/server';
import { getTrashRecords } from '@/app/lib/db';

export async function GET() {
  try {
    const records = await getTrashRecords();
    return NextResponse.json(records);
  } catch {
    return NextResponse.json([]);
  }
}
