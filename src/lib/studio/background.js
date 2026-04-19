// Studio background preferences — Trello-style per-user board background.
//
// Stored in localStorage (single-user tooling; no cross-device sync needed).
// Two representations: a BackgroundSpec describes the visual, a CSS string
// is what actually gets applied to the DOM.

const KEY = 'studio.background.v1';
const ORDER_ALBUMS_KEY = 'studio.home.order.albums.v1';
const ORDER_SINGLES_KEY = 'studio.home.order.singles.v1';

export const PRESET_SOLIDS = [
  { id: 'midnight',  label: 'Midnight',  value: '#09090B' },
  { id: 'graphite',  label: 'Graphite',  value: '#18181B' },
  { id: 'navy',      label: 'Navy',      value: '#0B1220' },
  { id: 'forest',    label: 'Forest',    value: '#0E1F1A' },
  { id: 'burgundy',  label: 'Burgundy',  value: '#1F0B13' },
  { id: 'sand',      label: 'Sand',      value: '#1E1A15' },
];

export const PRESET_GRADIENTS = [
  { id: 'cyan',    label: 'Cyan glow',    value: 'radial-gradient(ellipse at top left, #0E2C3A 0%, #09090B 55%), radial-gradient(ellipse at bottom right, #1A0B2E 0%, #09090B 55%)' },
  { id: 'violet',  label: 'Violet dusk',  value: 'radial-gradient(ellipse at top, #2A1050 0%, #0B0617 60%)' },
  { id: 'ember',   label: 'Ember',        value: 'radial-gradient(ellipse at top right, #3A1206 0%, #0C0403 60%)' },
  { id: 'aurora',  label: 'Aurora',       value: 'linear-gradient(135deg, #06252F 0%, #120A29 50%, #1E0B23 100%)' },
  { id: 'ocean',   label: 'Ocean',        value: 'linear-gradient(180deg, #0A1628 0%, #050912 100%)' },
  { id: 'rose',    label: 'Rose quartz',  value: 'linear-gradient(135deg, #2B0920 0%, #120612 50%, #091A23 100%)' },
];

export function defaultBackground() {
  return { kind: 'gradient', id: 'cyan', value: PRESET_GRADIENTS[0].value };
}

export function loadBackground() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultBackground();
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || !parsed.kind) return defaultBackground();
    return parsed;
  } catch {
    return defaultBackground();
  }
}

export function saveBackground(bg) {
  try {
    localStorage.setItem(KEY, JSON.stringify(bg));
    window.dispatchEvent(new CustomEvent('studio:background-change', { detail: bg }));
  } catch {
    /* quota exceeded or disabled — swallow */
  }
}

// Convert a BackgroundSpec into something we can drop on a CSS `background` property.
export function backgroundToCss(bg) {
  if (!bg) return PRESET_GRADIENTS[0].value;
  switch (bg.kind) {
    case 'solid':
      return bg.value || '#09090B';
    case 'gradient':
      return bg.value || PRESET_GRADIENTS[0].value;
    case 'image':
      return `#09090B url("${bg.value}") center/cover no-repeat fixed`;
    default:
      return PRESET_GRADIENTS[0].value;
  }
}

// Darker overlay for readable content when the background is light/noisy.
// A fixed dim layer reads better than lowering text contrast.
export function backgroundOverlayAlpha(bg) {
  if (!bg) return 0;
  if (bg.kind === 'image') return 0.4;
  return 0;
}

// ── Homepage ordering ─────────────────────────────────────────────────────
//
// We don't have a `sort_order` column on releases. Rather than add one, we
// persist the user's preferred order to localStorage. Ids not in the saved
// list fall to the end (so new releases don't disappear).

function safeReadOrder(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function safeWriteOrder(key, ids) {
  try { localStorage.setItem(key, JSON.stringify(ids)); } catch { /* ignore */ }
}

export function loadAlbumOrder()   { return safeReadOrder(ORDER_ALBUMS_KEY); }
export function loadSinglesOrder() { return safeReadOrder(ORDER_SINGLES_KEY); }
export function saveAlbumOrder(ids)   { safeWriteOrder(ORDER_ALBUMS_KEY, ids); }
export function saveSinglesOrder(ids) { safeWriteOrder(ORDER_SINGLES_KEY, ids); }

// Merge a saved ID list with the current universe of IDs:
// kept order + any new IDs pushed to the end.
export function applyOrder(items, savedIds, idOf = (x) => x.id) {
  if (!Array.isArray(savedIds) || savedIds.length === 0) return items.slice();
  const byId = new Map(items.map((x) => [idOf(x), x]));
  const seen = new Set();
  const ordered = [];
  for (const id of savedIds) {
    const it = byId.get(id);
    if (it && !seen.has(id)) { ordered.push(it); seen.add(id); }
  }
  for (const it of items) {
    if (!seen.has(idOf(it))) ordered.push(it);
  }
  return ordered;
}
