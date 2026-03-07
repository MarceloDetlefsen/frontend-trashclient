import dynamic from 'next/dynamic';
import Link from 'next/link';
import { getTrashRecords } from '@/app/lib/api';
import type { TrashRecord } from '@/app/lib/types';
import { getDominantWaste, WASTE_TYPES, formatDate, formatCoord } from '@/app/lib/utils';

const TrashMap = dynamic(() => import('@/app/components/TrashMap'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-slate-100 rounded-xl">
      <div className="flex flex-col items-center gap-3 text-slate-400">
        <svg
          className="w-8 h-8 animate-spin"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
        </svg>
        <span className="text-sm font-medium">Loading map…</span>
      </div>
    </div>
  ),
});

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col gap-1">
      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </span>
      <span
        className="text-3xl font-bold text-slate-900"
        style={accent ? { color: accent } : undefined}
      >
        {value}
      </span>
      {sub && <span className="text-sm text-slate-500">{sub}</span>}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="w-8 h-8 text-slate-400"
        >
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-slate-700 mb-1">No detections yet</h3>
      <p className="text-slate-400 text-sm mb-6 max-w-xs">
        Upload an image to analyze waste and it will appear here on the map.
      </p>
      <Link
        href="/upload"
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        Upload First Image
      </Link>
    </div>
  );
}

export default async function DashboardPage() {
  let records: TrashRecord[] = [];

  try {
    records = await getTrashRecords();
  } catch {
    // API not yet available – show empty state
  }

  const today = new Date().toDateString();
  const todayCount = records.filter(
    (r) => new Date(r.createdAt).toDateString() === today
  ).length;

  const avgAnalysis =
    records.length > 0
      ? {
          glassPercentage:
            records.reduce((s, r) => s + r.glassPercentage, 0) / records.length,
          plasticPercentage:
            records.reduce((s, r) => s + r.plasticPercentage, 0) / records.length,
          paperPercentage:
            records.reduce((s, r) => s + r.paperPercentage, 0) / records.length,
          organicPercentage:
            records.reduce((s, r) => s + r.organicPercentage, 0) / records.length,
          metalPercentage:
            records.reduce((s, r) => s + r.metalPercentage, 0) / records.length,
          otherPercentage:
            records.reduce((s, r) => s + r.otherPercentage, 0) / records.length,
        }
      : null;

  const dominant = avgAnalysis ? getDominantWaste(avgAnalysis) : null;

  const recentRecords = [...records]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 20);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Waste Detection Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">
            Real-time overview of detected trash and geographic distribution
          </p>
        </div>
        <Link
          href="/upload"
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          New Analysis
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Records" value={records.length} sub="All detections" />
        <StatCard label="Today" value={todayCount} sub="Detections today" />
        <StatCard
          label="Top Waste Type"
          value={dominant ? dominant.label : '—'}
          sub={dominant ? `Avg ${dominant.value.toFixed(1)}%` : 'No data yet'}
          accent={dominant?.color}
        />
        <StatCard
          label="Waste Types"
          value={WASTE_TYPES.length}
          sub="Categories tracked"
        />
      </div>

      {/* Map */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-slate-800">Detection Map</h2>
          <div className="flex items-center gap-4 text-xs text-slate-400">
            {WASTE_TYPES.map((t) => (
              <span key={t.key} className="flex items-center gap-1">
                <span
                  className="inline-block w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: t.color }}
                />
                {t.label}
              </span>
            ))}
          </div>
        </div>
        <div className="h-[420px] rounded-xl overflow-hidden">
          <TrashMap records={records} />
        </div>
      </div>

      {/* Records Table */}
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800">Recent Detections</h2>
          <span className="text-xs text-slate-400">{records.length} total</span>
        </div>

        {records.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Coordinates
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Dominant Type
                  </th>
                  {WASTE_TYPES.map((t) => (
                    <th
                      key={t.key}
                      className="px-3 py-3 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider"
                    >
                      <span
                        className="inline-block w-2 h-2 rounded-full mr-1"
                        style={{ backgroundColor: t.color }}
                      />
                      {t.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recentRecords.map((record) => {
                  const dom = getDominantWaste(record);
                  return (
                    <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-3 text-slate-600 whitespace-nowrap text-xs">
                        {formatDate(record.createdAt)}
                      </td>
                      <td className="px-6 py-3 text-slate-500 whitespace-nowrap font-mono text-xs">
                        {formatCoord(record.latitude)}, {formatCoord(record.longitude)}
                      </td>
                      <td className="px-6 py-3">
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold text-white"
                          style={{ backgroundColor: dom.color }}
                        >
                          {dom.label}
                        </span>
                      </td>
                      {WASTE_TYPES.map((t) => (
                        <td
                          key={t.key}
                          className="px-3 py-3 text-center text-slate-600 text-xs font-medium"
                        >
                          {record[t.key]}%
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
