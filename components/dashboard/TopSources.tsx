import React from 'react';
import { Sparkline } from './Sparkline';

interface SourceRow { domain: string; mentions: number; sparkline: number[] }
interface SeriesPoint { date: string; mentions: number }

interface TopSourcesProps {
  sources: SourceRow[];
  trendSeries: SeriesPoint[];
}

export const TopSources: React.FC<TopSourcesProps> = ({ sources, trendSeries }) => {
  const maxMentions = Math.max(...sources.map(s => s.mentions), 1);

  return (
    <div className="rounded-2xl border shadow-md p-6 bg-white">
      <h3 className="text-lg font-semibold mb-4">Top Sources</h3>
      <div className="space-y-3">
        {sources.map((s) => (
          <button key={s.domain} className="w-full flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50" aria-label={`Source ${s.domain} ${s.mentions} mentions`}>
            <div className="flex items-center space-x-3">
              <div className="h-2 w-2 rounded-full bg-blue-600" aria-hidden />
              <div className="text-sm font-medium">{s.domain}</div>
              <div className="text-xs text-gray-600">{s.mentions} mentions</div>
            </div>
            <Sparkline data={s.sparkline} />
          </button>
        ))}
      </div>

      <div className="mt-6">
        <h4 className="text-md font-semibold mb-2">Trend Over Time</h4>
        <TrendChart data={trendSeries} />
      </div>
    </div>
  );
};

const TrendChart: React.FC<{ data: SeriesPoint[] }> = ({ data }) => {
  const width = 640;
  const height = 160;
  if (!data.length) return null;
  const max = Math.max(...data.map(d => d.mentions));
  const min = Math.min(...data.map(d => d.mentions));
  const dx = width / (data.length - 1 || 1);
  const points = data.map((d, i) => {
    const x = i * dx;
    const y = height - ((d.mentions - min) / Math.max(max - min, 1)) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="w-full overflow-x-auto">
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Trend chart">
        <polyline fill="none" stroke="#1e6fff" strokeWidth="2" points={points} />
      </svg>
    </div>
  );
};
