import React from 'react';

interface MetricCardProps {
  value: string;
  label: string;
  aria: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ value, label, aria }) => (
  <div className="flex-1 rounded-2xl border shadow-md p-6 text-center" aria-label={aria}>
    <div className="text-3xl font-semibold text-gray-900">{value}</div>
    <div className="text-sm text-gray-500 mt-2">{label}</div>
  </div>
);

interface MetricsRowProps {
  shareOfVoice: number;
  brandMentions: number;
  sentiment: number; // delta percent
  totalPrompts: number;
}

export const MetricsRow: React.FC<MetricsRowProps> = ({ shareOfVoice, brandMentions, sentiment, totalPrompts }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard value={`${shareOfVoice.toFixed(1)}%`} label="Share of Voice" aria={`Share of Voice ${shareOfVoice.toFixed(1)} percent`} />
      <MetricCard value={`${brandMentions.toFixed(1)}%`} label="Brand Mentions" aria={`Brand Mentions ${brandMentions.toFixed(1)} percent`} />
      <MetricCard value={`${sentiment > 0 ? '+' : ''}${sentiment.toFixed(0)}%`} label="Sentiment" aria={`Sentiment ${sentiment.toFixed(0)} percent`} />
      <MetricCard value={`${totalPrompts}`} label="Total Prompts" aria={`Total Prompts ${totalPrompts}`} />
    </div>
  );
};
