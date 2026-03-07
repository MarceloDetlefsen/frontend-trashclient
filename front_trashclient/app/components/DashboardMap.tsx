'use client';

import dynamic from 'next/dynamic';
import type { TrashRecord } from '@/app/lib/types';

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

interface DashboardMapProps {
  records: TrashRecord[];
}

export default function DashboardMap({ records }: DashboardMapProps) {
  return <TrashMap records={records} />;
}
