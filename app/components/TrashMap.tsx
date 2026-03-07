'use client';

import {
  Map,
  MapMarker,
  MarkerContent,
  MarkerPopup,
  MapControls,
} from '@/components/ui/map';
import type { TrashRecord } from '@/app/lib/types';
import { getDominantWaste, WASTE_TYPES, formatDate, formatCoord } from '@/app/lib/utils';

/** Top N waste types by value for compact popup display */
function getTopWastes(record: TrashRecord, n = 5) {
  return WASTE_TYPES
    .map((t) => ({ ...t, val: record[t.key] ?? 0 }))
    .filter((x) => x.val > 0)
    .sort((a, b) => b.val - a.val)
    .slice(0, n);
}

interface TrashMapProps {
  records: TrashRecord[];
}

/** Guatemala: 15°42′N, 90°30′W = [longitude, latitude] for MapLibre */
const GUATEMALA_CENTER: [number, number] = [-90.5, 15.7];

export default function TrashMap({ records }: TrashMapProps) {
  const validRecords = records
    .map((r) => ({
      ...r,
      latitude: Number(r.latitude),
      longitude: Number(r.longitude),
    }))
    .filter(
      (r) =>
        !Number.isNaN(r.latitude) &&
        !Number.isNaN(r.longitude) &&
        r.latitude >= -90 &&
        r.latitude <= 90 &&
        r.longitude >= -180 &&
        r.longitude <= 180
    );

  const center: [number, number] =
    validRecords.length > 0
      ? [
          validRecords.reduce((s, r) => s + r.longitude, 0) / validRecords.length,
          validRecords.reduce((s, r) => s + r.latitude, 0) / validRecords.length,
        ]
      : GUATEMALA_CENTER;

  const zoom = validRecords.length > 0 ? 8 : 6;

  return (
    <div className="relative h-full w-full">
      <Map
        className="rounded-xl"
        theme="light"
        viewport={{ center, zoom }}
        onViewportChange={() => {}}
      >
        <MapControls showZoom showLocate position="bottom-right" />
        {validRecords.map((record) => {
        const dominant = getDominantWaste(record);
        return (
          <MapMarker
            key={record.id}
            longitude={record.longitude}
            latitude={record.latitude}
          >
            <MarkerContent>
              <div
                className="h-6 w-6 rounded-full border-2 border-white shadow-lg"
                style={{ backgroundColor: dominant.color }}
              />
            </MarkerContent>
            <MarkerPopup closeButton anchor="bottom" className="max-w-[200px]">
              <div className="w-full max-w-[180px] font-sans text-[12px]">
                <div className="mb-1 flex items-center gap-1">
                  <div
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: dominant.color }}
                  />
                  <strong className="text-slate-900 truncate">
                    {dominant.label} {dominant.value}%
                  </strong>
                </div>
                <div className="mb-1.5 text-[10px] text-slate-500">
                  {formatCoord(record.latitude)}, {formatCoord(record.longitude)} · {formatDate(record.createdAt)}
                </div>
                <div className="flex flex-col gap-0.5">
                  {getTopWastes(record, 4).map((t) => (
                    <div key={t.key} className="flex items-center gap-1">
                      <span className="w-10 truncate text-[10px] text-slate-500">{t.label}</span>
                      <div className="h-1 flex-1 min-w-0 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${t.val}%`, backgroundColor: t.color }}
                        />
                      </div>
                      <span className="w-6 shrink-0 text-right text-[10px] font-medium text-slate-700">{t.val}%</span>
                    </div>
                  ))}
                </div>
                {record.suggestedCleanup && (
                  <div className="mt-1 max-h-12 overflow-y-auto rounded bg-emerald-50 px-1.5 py-1 text-[10px] leading-tight text-emerald-800">
                    {record.suggestedCleanup}
                  </div>
                )}
              </div>
            </MarkerPopup>
          </MapMarker>
        );
      })}
      </Map>
      {validRecords.length === 0 && records.length > 0 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded bg-amber-100 px-3 py-1.5 text-xs text-amber-800">
          {records.length} record(s) have invalid coordinates and are not shown
        </div>
      )}
    </div>
  );
}
