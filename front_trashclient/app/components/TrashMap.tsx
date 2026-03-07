'use client';

import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import type { TrashRecord } from '@/app/lib/types';
import { getDominantWaste, WASTE_TYPES, formatDate, formatCoord } from '@/app/lib/utils';

interface TrashMapProps {
  records: TrashRecord[];
}

export default function TrashMap({ records }: TrashMapProps) {
  const center: [number, number] =
    records.length > 0
      ? [
          records.reduce((s, r) => s + r.latitude, 0) / records.length,
          records.reduce((s, r) => s + r.longitude, 0) / records.length,
        ]
      : [20, 0];

  const zoom = records.length > 0 ? 12 : 2;

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height: '100%', width: '100%', borderRadius: '0.75rem' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {records.map((record) => {
        const dominant = getDominantWaste(record);
        return (
          <CircleMarker
            key={record.id}
            center={[record.latitude, record.longitude]}
            radius={10}
            pathOptions={{
              fillColor: dominant.color,
              fillOpacity: 0.85,
              color: 'white',
              weight: 2,
            }}
          >
            <Popup minWidth={220}>
              <div style={{ fontFamily: 'system-ui, sans-serif', fontSize: '13px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginBottom: '8px',
                  }}
                >
                  <div
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      backgroundColor: dominant.color,
                      flexShrink: 0,
                    }}
                  />
                  <strong style={{ color: '#0f172a' }}>
                    Dominant: {dominant.label} ({dominant.value}%)
                  </strong>
                </div>
                <div style={{ color: '#64748b', marginBottom: '10px', fontSize: '12px' }}>
                  {formatCoord(record.latitude)}, {formatCoord(record.longitude)}
                  <br />
                  {formatDate(record.createdAt)}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {WASTE_TYPES.map((t) => {
                    const val = record[t.key];
                    return (
                      <div
                        key={t.key}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        <span style={{ width: '52px', color: '#64748b', fontSize: '11px' }}>
                          {t.label}
                        </span>
                        <div
                          style={{
                            flex: 1,
                            height: '6px',
                            background: '#f1f5f9',
                            borderRadius: '9999px',
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              width: `${val}%`,
                              height: '100%',
                              background: t.color,
                              borderRadius: '9999px',
                            }}
                          />
                        </div>
                        <span style={{ width: '28px', textAlign: 'right', fontSize: '11px', fontWeight: 600, color: '#334155' }}>
                          {val}%
                        </span>
                      </div>
                    );
                  })}
                </div>
                {record.suggestedCleanup && (
                  <div
                    style={{
                      marginTop: '8px',
                      padding: '6px 8px',
                      background: '#f0fdf4',
                      borderRadius: '6px',
                      color: '#166534',
                      fontSize: '11px',
                    }}
                  >
                    {record.suggestedCleanup}
                  </div>
                )}
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
