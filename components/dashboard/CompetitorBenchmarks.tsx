import React from 'react';

interface Row {
  name: string;
  visibilityScore: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  shareOfVoice: number;
}

interface CompetitorBenchmarksProps {
  rows: Row[];
  onCompare: () => void;
}

export const CompetitorBenchmarks: React.FC<CompetitorBenchmarksProps> = ({ rows, onCompare }) => {
  const sentimentColor = (s: Row['sentiment']) => s === 'positive' ? 'text-green-600' : s === 'negative' ? 'text-red-600' : 'text-gray-600';

  return (
    <div className="rounded-2xl border shadow-md p-6 bg-white h-full flex flex-col">
      <h3 className="text-lg font-semibold mb-4">Competitor Benchmarks</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500">
              <th className="py-2 pr-4">Competitor</th>
              <th className="py-2 pr-4">Visibility</th>
              <th className="py-2 pr-4">Sentiment</th>
              <th className="py-2 pr-4">Share of Voice</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.name} className="border-t">
                <td className="py-2 pr-4 font-medium">{r.name}</td>
                <td className="py-2 pr-4">{r.visibilityScore}%</td>
                <td className={`py-2 pr-4 ${sentimentColor(r.sentiment)}`}>{r.sentiment}</td>
                <td className="py-2 pr-4">{r.shareOfVoice}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-auto pt-4">
        <button onClick={onCompare} className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2 font-medium" aria-label="Compare with Competitor">
          Compare with Competitor
        </button>
      </div>
    </div>
  );
};
