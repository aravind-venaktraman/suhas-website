import React from 'react';

// Compact chip showing T1 / T2 / T3 etc.
// Full title is shown on hover via title attribute (and in TaskModal).
export default function SongPill({ trackNumber, title }) {
  const label = trackNumber != null ? `T${trackNumber}` : 'T?';

  return (
    <span
      title={title}
      className="inline-flex items-center rounded-full text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 cursor-default select-none"
      style={{
        background: 'rgba(163,163,163,0.12)',
        border: '1px solid rgba(163,163,163,0.25)',
        color: '#A1A1AA',
        fontFamily: "'Michroma', sans-serif",
      }}
    >
      {label}
    </span>
  );
}
