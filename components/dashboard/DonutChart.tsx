import React from 'react';

interface DonutChartProps {
  size?: number;
  strokeWidth?: number;
  percent: number; // 0-100 for the highlighted slice
  label?: string;
}

// Simple SVG donut chart that renders a percentage slice
export const DonutChart: React.FC<DonutChartProps> = ({ size = 120, strokeWidth = 14, percent, label }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`Donut chart ${percent}%`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#1e6fff"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" className="fill-gray-900 text-xl font-semibold">
          {percent}%
        </text>
      </svg>
      {label && <div className="text-sm text-gray-600 mt-2">{label}</div>}
    </div>
  );
};
