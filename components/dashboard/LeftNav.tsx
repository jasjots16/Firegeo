import React from 'react';

interface LeftNavProps {
  active: 'brand-monitor' | 'aeo-report' | 'files' | 'ugc';
  onNavigate: (key: LeftNavProps['active']) => void;
  brandName: string;
}

export const LeftNav: React.FC<LeftNavProps> = ({ active, onNavigate, brandName }) => {
  const Item: React.FC<{ id: LeftNavProps['active']; label: string }> = ({ id, label }) => {
    const isActive = active === id;
    return (
      <button
        onClick={() => onNavigate(id)}
        className={[
          'w-full text-left px-4 py-2 rounded-full border transition',
          isActive ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 hover:bg-gray-50'
        ].join(' ')}
        aria-current={isActive ? 'page' : undefined}
        aria-label={`${label} navigation`}
      >
        {label}
      </button>
    );
  };

  return (
    <aside className="fixed top-16 bottom-0 left-0 w-64 bg-white border-r z-30 px-4 py-6 overflow-y-auto" aria-label="Section navigation">
      <div className="mb-6">
        <h2 className="text-sm text-gray-500 mb-2">Brand</h2>
        <div className="text-lg font-semibold">{brandName}</div>
      </div>
      <div className="space-y-3">
        <Item id="brand-monitor" label="Brand Monitor" />
        <Item id="aeo-report" label="AEO Report" />
        <Item id="files" label="Files" />
        <Item id="ugc" label="UGC" />
      </div>
    </aside>
  );
};
