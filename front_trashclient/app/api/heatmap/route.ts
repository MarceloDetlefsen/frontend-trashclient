import { NextResponse } from 'next/server';
import geohash from 'ngeohash';
import { getTrashRecords } from '@/app/lib/db';
import type { HeatmapBucket } from '@/app/lib/types';

/**
 * GET /api/heatmap?precision=5
 * Returns pre-aggregated data by geohash for heat maps.
 * precision: 4–7 typical (4 = large areas, 7 = finer grid). Default 5.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const precision = Math.min(
      7,
      Math.max(4, Number(searchParams.get('precision')) || 5)
    );
    const records = await getTrashRecords();

    const buckets = new Map<string, HeatmapBucket>();

    for (const r of records) {
      const hash = geohash.encode(r.latitude, r.longitude, precision);
      const decoded = geohash.decode(hash);
      const lat = decoded.latitude;
      const lng = decoded.longitude;

      const existing = buckets.get(hash);
      const eWaste = (r as { eWastePercentage?: number }).eWastePercentage ?? 0;
      const hazardous = (r as { hazardousPercentage?: number }).hazardousPercentage ?? 0;
      const specialTreatment =
        (r as { specialTreatmentPercentage?: number }).specialTreatmentPercentage ?? 0;

      if (existing) {
        existing.count += 1;
        existing.totalGlass += r.glassPercentage;
        existing.totalPlastic += r.plasticPercentage;
        existing.totalPaper += r.paperPercentage;
        existing.totalOrganic += r.organicPercentage;
        existing.totalMetal += r.metalPercentage;
        existing.totalOther += r.otherPercentage;
        existing.totalEWaste += eWaste;
        existing.totalHazardous += hazardous;
        existing.totalSpecialTreatment += specialTreatment;
      } else {
        buckets.set(hash, {
          geohash: hash,
          latitude: lat,
          longitude: lng,
          count: 1,
          totalGlass: r.glassPercentage,
          totalPlastic: r.plasticPercentage,
          totalPaper: r.paperPercentage,
          totalOrganic: r.organicPercentage,
          totalMetal: r.metalPercentage,
          totalOther: r.otherPercentage,
          totalEWaste: eWaste,
          totalHazardous: hazardous,
          totalSpecialTreatment: specialTreatment,
        });
      }
    }

    const payload = Array.from(buckets.values());
    return NextResponse.json({ precision, buckets: payload });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to build heatmap';
    return NextResponse.json(
      { error: message, code: 'HEATMAP_ERROR' },
      { status: 500 }
    );
  }
}
