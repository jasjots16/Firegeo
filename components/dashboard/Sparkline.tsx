import React from 'react';

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
}

export const Sparkline: React.FC<SparklineProps> = ({ data, width = 120, height = 40, color = '#1e6fff' }) => {
  if (!data.length) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const dx = width / (data.length - 1 || 1);

  const points = data.map((v, i) => {
    const x = i * dx;
    const y = height - ((v - min) / Math.max(max - min, 1)) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Sparkline">
      <polyline fill="none" stroke={color} strokeWidth="2" points={points} />
    </svg>
  );
};
