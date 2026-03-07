import { WASTE_TYPES } from '@/app/lib/utils';
import type { TrashAnalysis } from '@/app/lib/types';

interface WasteBarProps {
  analysis: TrashAnalysis;
  compact?: boolean;
}

export default function WasteBar({ analysis, compact = false }: WasteBarProps) {
  return (
    <div className={`space-y-${compact ? '1.5' : '2.5'}`}>
      {WASTE_TYPES.map((type) => {
        const value = analysis[type.key];
        return (
          <div key={type.key} className="flex items-center gap-3">
            <span
              className={`${compact ? 'w-14 text-xs' : 'w-16 text-sm'} text-slate-500 shrink-0`}
            >
              {type.label}
            </span>
            <div className="flex-1 bg-slate-100 rounded-full overflow-hidden h-2.5">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${value}%`,
                  backgroundColor: type.color,
                }}
              />
            </div>
            <span
              className={`${compact ? 'w-8 text-xs' : 'w-10 text-sm'} font-semibold text-slate-700 text-right shrink-0`}
            >
              {value}%
            </span>
          </div>
        );
      })}
    </div>
  );
}
