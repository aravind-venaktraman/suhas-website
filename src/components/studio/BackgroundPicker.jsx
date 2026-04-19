import React, { useState, useRef, useEffect } from 'react';
import { Palette, Check, X, Image as ImageIcon, Sparkles, Droplet } from 'lucide-react';
import {
  PRESET_SOLIDS,
  PRESET_GRADIENTS,
  backgroundToCss,
  saveBackground,
  loadBackground,
} from '../../lib/studio/background';

/**
 * Trello-style background picker. Renders a trigger button; opens a popover
 * with preset solids, preset gradients, and a custom image URL input.
 * The popover saves to localStorage and broadcasts `studio:background-change`.
 */
export default function BackgroundPicker({ variant = 'floating' }) {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState(() => loadBackground());
  const [tab, setTab] = useState(current?.kind === 'image' ? 'image' : current?.kind === 'solid' ? 'solid' : 'gradient');
  const [imgUrl, setImgUrl] = useState(current?.kind === 'image' ? current.value : '');
  const rootRef = useRef(null);

  useEffect(() => {
    function onClick(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    }
    function onKey(e) { if (e.key === 'Escape') setOpen(false); }
    if (open) {
      window.addEventListener('mousedown', onClick);
      window.addEventListener('keydown', onKey);
      return () => {
        window.removeEventListener('mousedown', onClick);
        window.removeEventListener('keydown', onKey);
      };
    }
    return undefined;
  }, [open]);

  function applyBg(next) {
    setCurrent(next);
    saveBackground(next);
  }

  function applySolid(preset) {
    applyBg({ kind: 'solid', id: preset.id, value: preset.value });
  }
  function applyGradient(preset) {
    applyBg({ kind: 'gradient', id: preset.id, value: preset.value });
  }
  function applyImage() {
    const url = imgUrl.trim();
    if (!url) return;
    applyBg({ kind: 'image', id: 'custom', value: url });
  }

  const isSelected = (kind, id) => current?.kind === kind && current?.id === id;

  return (
    <div
      ref={rootRef}
      className={`bgp-root bgp-${variant}`}
      style={variant === 'floating' ? undefined : { position: 'relative' }}
    >
      <button
        type="button"
        className="bgp-trigger"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
        title="Change background"
      >
        <Palette size={13} />
        {variant === 'inline' && <span>Background</span>}
      </button>

      {open && (
        <div className="bgp-panel" role="dialog" aria-label="Choose background">
          <div className="bgp-head">
            <div className="bgp-eyebrow">
              <Sparkles size={10} />
              <span>Board background</span>
            </div>
            <button className="bgp-close" onClick={() => setOpen(false)} aria-label="Close">
              <X size={12} />
            </button>
          </div>

          <div className="bgp-tabs" role="tablist">
            {[
              { id: 'gradient', label: 'Gradients', icon: Sparkles },
              { id: 'solid',    label: 'Solids',    icon: Droplet },
              { id: 'image',    label: 'Image',     icon: ImageIcon },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                role="tab"
                aria-selected={tab === id}
                className={`bgp-tab${tab === id ? ' is-active' : ''}`}
                onClick={() => setTab(id)}
              >
                <Icon size={11} /> {label}
              </button>
            ))}
          </div>

          {tab === 'gradient' && (
            <div className="bgp-grid">
              {PRESET_GRADIENTS.map((p) => (
                <Swatch
                  key={p.id}
                  label={p.label}
                  selected={isSelected('gradient', p.id)}
                  bg={p.value}
                  onClick={() => applyGradient(p)}
                />
              ))}
            </div>
          )}

          {tab === 'solid' && (
            <div className="bgp-grid">
              {PRESET_SOLIDS.map((p) => (
                <Swatch
                  key={p.id}
                  label={p.label}
                  selected={isSelected('solid', p.id)}
                  bg={p.value}
                  onClick={() => applySolid(p)}
                />
              ))}
            </div>
          )}

          {tab === 'image' && (
            <div className="bgp-image-tab">
              <label className="bgp-label">Image URL</label>
              <input
                className="bgp-input"
                type="url"
                placeholder="https://images.unsplash.com/…"
                value={imgUrl}
                onChange={(e) => setImgUrl(e.target.value)}
              />
              <p className="bgp-help">
                Paste a direct image URL. Tall landscape images read best.
              </p>
              <div className="bgp-row">
                <button
                  className="bgp-btn-ghost"
                  type="button"
                  onClick={() => { setImgUrl(''); applyBg({ kind: 'gradient', id: PRESET_GRADIENTS[0].id, value: PRESET_GRADIENTS[0].value }); }}
                >
                  Reset
                </button>
                <button
                  className="bgp-btn-primary"
                  type="button"
                  onClick={applyImage}
                  disabled={!imgUrl.trim()}
                >
                  Apply image
                </button>
              </div>
              {current?.kind === 'image' && (
                <div className="bgp-preview" style={{ background: backgroundToCss(current) }}>
                  <span>Current image</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Swatch({ label, selected, bg, onClick }) {
  return (
    <button
      type="button"
      className={`bgp-swatch${selected ? ' is-selected' : ''}`}
      onClick={onClick}
      aria-pressed={selected}
      title={label}
    >
      <span className="bgp-swatch-fill" style={{ background: bg }} />
      <span className="bgp-swatch-label">{label}</span>
      {selected && <span className="bgp-swatch-check"><Check size={10} /></span>}
    </button>
  );
}
