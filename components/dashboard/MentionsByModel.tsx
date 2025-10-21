import React, { useMemo } from 'react';
import { DonutChart } from './DonutChart';

interface Item { label: string; value: number }

interface MentionsByModelProps {
  items: Item[];
  max: number;
  donutPercent: number; // e.g., positive percent
}

export const MentionsByModel: React.FC<MentionsByModelProps> = ({ items, max, donutPercent }) => {
  const bars = useMemo(() => items.map(i => ({ ...i, width: Math.round((i.value / Math.max(max, 1)) * 100) })), [items, max]);

  return (
    <div className="rounded-2xl border shadow-md p-6 bg-white">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Mentions by AI Model</h3>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {bars.map(b => (
            <div key={b.label} className="flex items-center">
              <div className="w-24 text-sm text-gray-600">{b.label}</div>
              <div className="flex-1 bg-gray-100 rounded-full h-3 relative" aria-label={`${b.label} mentions ${b.value}`}>
                <div className="h-3 rounded-full bg-blue-600" style={{ width: `${b.width}%` }} />
                <span className="absolute -right-10 top-1/2 -translate-y-1/2 text-xs text-gray-600">{b.value}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-col items-center">
          <DonutChart percent={donutPercent} />
          <div className="mt-4 space-y-1 text-sm">
            <div className="flex items-center space-x-2"><span className="h-2 w-2 rounded-full bg-blue-600 inline-block" /> <span>Positive</span></div>
            <div className="flex items-center space-x-2"><span className="h-2 w-2 rounded-full bg-gray-300 inline-block" /> <span>Neutral</span></div>
          </div>
        </div>
      </div>
    </div>
  );
};
