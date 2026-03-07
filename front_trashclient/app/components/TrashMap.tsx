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

interface TrashMapProps {
  records: TrashRecord[];
}

const GUATEMALA_CENTER: [number, number] = [-90.23, 15.78];

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
            <MarkerPopup closeButton anchor="bottom">
              <div className="min-w-[200px] font-sans text-[13px]">
                <div className="mb-2 flex items-center gap-1.5">
                  <div
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: dominant.color }}
                  />
                  <strong className="text-slate-900">
                    Dominant: {dominant.label} ({dominant.value}%)
                  </strong>
                </div>
                <div className="mb-2.5 text-xs text-slate-500">
                  {formatCoord(record.latitude)}, {formatCoord(record.longitude)}
                  <br />
                  {formatDate(record.createdAt)}
                </div>
                <div className="flex flex-col gap-1">
                  {WASTE_TYPES.map((t) => {
                    const val = record[t.key];
                    return (
                      <div key={t.key} className="flex items-center gap-1.5">
                        <span className="w-[52px] text-[11px] text-slate-500">{t.label}</span>
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${val ?? 0}%`, backgroundColor: t.color }}
                          />
                        </div>
                        <span className="w-7 text-right text-[11px] font-semibold text-slate-700">
                          {(val ?? 0)}%
                        </span>
                      </div>
                    );
                  })}
                </div>
                {record.suggestedCleanup && (
                  <div className="mt-2 max-h-20 overflow-y-auto rounded-md bg-emerald-50 px-2 py-1.5 text-[11px] text-emerald-800">
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
