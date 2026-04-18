import React from 'react';

export default function WorkstreamPill({ name, color, size = 'sm' }) {
  const sizes = {
    xs: 'text-[9px] px-1.5 py-0.5 gap-1',
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-[11px] px-2.5 py-1 gap-1.5',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full font-bold uppercase tracking-widest whitespace-nowrap ${sizes[size] || sizes.sm}`}
      style={{
        background: `${color}18`,
        border: `1px solid ${color}40`,
        color,
        fontFamily: "'Michroma', sans-serif",
      }}
    >
      <span
        className="rounded-full shrink-0"
        style={{ width: 5, height: 5, background: color }}
      />
      {name}
    </span>
  );
}
