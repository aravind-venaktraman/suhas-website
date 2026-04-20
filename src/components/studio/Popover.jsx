import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export default function Popover({ anchorEl, onClose, children, minWidth = 160 }) {
  const popRef = useRef(null);
  const [pos, setPos] = useState(null);

  useEffect(() => {
    if (!anchorEl) return;
    const update = () => {
      const rect = anchorEl.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const left = Math.min(rect.left, window.innerWidth - minWidth - 8);
      if (spaceBelow > 180) {
        setPos({ top: rect.bottom + 6, left });
      } else {
        setPos({ bottom: window.innerHeight - rect.top + 6, left });
      }
    };
    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [anchorEl, minWidth]);

  useEffect(() => {
    function handleClick(e) {
      if (popRef.current && !popRef.current.contains(e.target) && !anchorEl?.contains(e.target)) {
        onClose();
      }
    }
    function handleKey(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [onClose, anchorEl]);

  if (!pos) return null;

  return createPortal(
    <div
      ref={popRef}
      style={{
        position: 'fixed',
        top: pos.top ?? 'auto',
        bottom: pos.bottom ?? 'auto',
        left: pos.left,
        zIndex: 500,
        background: 'rgba(24,24,27,0.98)',
        border: '1px solid rgba(244,244,245,0.12)',
        borderRadius: 8,
        boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
        padding: 4,
        minWidth,
      }}
      onClick={e => e.stopPropagation()}
      onMouseDown={e => e.stopPropagation()}
    >
      {children}
    </div>,
    document.body
  );
}

export function PopoverItem({ icon, label, onClick, danger = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        width: '100%', padding: '7px 10px',
        background: 'transparent', border: 'none', borderRadius: 6,
        cursor: 'pointer', textAlign: 'left',
        color: danger ? '#FCA5A5' : '#E4E4E7',
        fontFamily: "'Inter', sans-serif", fontSize: 12,
      }}
      onMouseEnter={e => { e.currentTarget.style.background = danger ? 'rgba(239,68,68,0.08)' : 'rgba(244,244,245,0.06)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
    >
      {icon && <span style={{ fontSize: 13, lineHeight: 1 }}>{icon}</span>}
      {label}
    </button>
  );
}
