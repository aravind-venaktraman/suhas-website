import React, { useMemo, useRef, useState } from 'react';
import { ZoomIn, ZoomOut } from 'lucide-react';
import { colors, fonts } from './tokens';

// ── Constants ─────────────────────────────────────────────────────────────────
const LABEL_W   = 156;   // left label column, px
const SUBLANE_H = 28;    // height per stacked sub-lane
const PILL_H    = 20;    // pill height
const DOT_R     = 5;     // dot radius at low zoom
const PILL_GAP  = 6;     // minimum gap between pills in the same sub-lane
const BASE_PPD  = 8;     // pixels per day at zoom level 1

function addDays(d, n) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

// Greedy lane-stacking: assigns each task a sub-lane so pills don't overlap.
// Input: [{x, w, ...rest}] sorted by x (ascending).
// Returns same objects with a `lane` index added.
function stackByLane(items) {
  const laneEnd = []; // rightmost right-edge used in lane i
  return items.map((item) => {
    const left  = item.x - item.w / 2;
    const right = item.x + item.w / 2;
    let lane = laneEnd.findIndex((end) => end + PILL_GAP <= left);
    if (lane === -1) {
      lane = laneEnd.length;
      laneEnd.push(0);
    }
    laneEnd[lane] = right;
    return { ...item, lane };
  });
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function Timeline({ songs = [], tasks = [], workstreams = [], release }) {
  const [zoom, setZoom] = useState(3); // 1–8
  const scrollRef = useRef(null);

  const ppd = BASE_PPD * zoom; // pixels per day

  const targetDate = release?.target_date ? new Date(release.target_date) : null;
  const today = useMemo(() => { const d = new Date(); d.setHours(0,0,0,0); return d; }, []);

  // ── Date range ──────────────────────────────────────────────────────────────
  const { rangeStart, rangeEnd } = useMemo(() => {
    const dated = tasks.filter((t) => t.due_date).map((t) => new Date(t.due_date));
    const earliest = dated.length ? new Date(Math.min(...dated)) : today;
    const anchor   = targetDate ? addDays(targetDate, -90) : addDays(today, -14);
    const start    = new Date(Math.min(earliest, anchor));
    start.setDate(1); // snap to first of month
    const end = targetDate ? addDays(targetDate, 21) : addDays(today, 60);
    return { rangeStart: start, rangeEnd: end };
  }, [tasks, targetDate, today]);

  const totalDays  = Math.max(1, (rangeEnd - rangeStart) / 86400000);
  const totalWidth = Math.ceil(totalDays * ppd);

  // Convert a Date → x offset (px) from rangeStart
  const toX = (date) => ((new Date(date) - rangeStart) / 86400000) * ppd;

  const todayX  = toX(today);
  const targetX = targetDate ? toX(targetDate) : null;

  // ── Grid markers ────────────────────────────────────────────────────────────
  const markers = useMemo(() => {
    const result = [];
    const d = new Date(rangeStart);
    d.setDate(1);
    while (d <= rangeEnd) {
      result.push({
        x: toX(d),
        label: d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        major: true,
      });
      // Week ticks at higher zoom
      if (zoom >= 4) {
        const month = d.getMonth();
        const wd = new Date(d);
        wd.setDate(8);
        while (wd.getMonth() === month && wd <= rangeEnd) {
          result.push({ x: toX(wd), label: String(wd.getDate()), major: false });
          wd.setDate(wd.getDate() + 7);
        }
      }
      d.setMonth(d.getMonth() + 1);
    }
    return result;
  }, [rangeStart, rangeEnd, ppd, zoom]);

  // ── Row data ────────────────────────────────────────────────────────────────
  const wsMap = useMemo(() => Object.fromEntries(workstreams.map((w) => [w.id, w])), [workstreams]);

  const rows = useMemo(() => {
    const result = [];
    songs.forEach((song) => {
      const t = tasks.filter((tk) => tk.song_id === song.id && tk.due_date);
      if (t.length) result.push({ label: `T${song.track_number} · ${song.title}`, tasks: t });
    });
    const rel = tasks.filter((tk) => !tk.song_id && tk.due_date);
    if (rel.length) result.push({ label: 'Release-level', tasks: rel });
    return result;
  }, [songs, tasks]);

  // Pill width: zoom < 3 → dot; zoom 3–4 → fixed 90px; zoom 5+ → dynamic
  const pillW = (title) => {
    if (zoom < 3)  return DOT_R * 2;
    if (zoom <= 4) return 90;
    return Math.max(90, title.length * 6.5 + 24);
  };

  // ── Empty state ─────────────────────────────────────────────────────────────
  if (rows.length === 0) {
    return (
      <div style={{ padding: '40px 0', textAlign: 'center' }}>
        <p style={{ fontFamily: fonts.display, fontSize: 11, color: colors.textDim, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          No tasks with due dates yet — set due dates on tasks to see the timeline.
        </p>
      </div>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

      {/* ── Zoom controls ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, alignSelf: 'flex-end' }}>
        <span style={{ fontFamily: fonts.display, fontSize: 9, color: colors.textDim, textTransform: 'uppercase', letterSpacing: '0.15em' }}>
          Zoom
        </span>
        <button
          onClick={() => setZoom((z) => Math.max(1, z - 1))}
          style={zoomBtn}
        >
          <ZoomOut size={12} />
        </button>
        <input
          type="range" min={1} max={8} value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          style={{ width: 80, accentColor: colors.cyan, cursor: 'pointer' }}
        />
        <button
          onClick={() => setZoom((z) => Math.min(8, z + 1))}
          style={zoomBtn}
        >
          <ZoomIn size={12} />
        </button>
        <span style={{ fontFamily: fonts.display, fontSize: 9, color: colors.cyan, minWidth: 22, letterSpacing: '0.1em' }}>
          {zoom}×
        </span>
      </div>

      {/* ── Scrollable canvas ── */}
      <div
        ref={scrollRef}
        style={{
          overflowX: 'auto', overflowY: 'hidden',
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(34,211,238,0.2) transparent',
        }}
      >
        <div style={{ width: LABEL_W + totalWidth, minWidth: '100%', position: 'relative' }}>

          {/* ── Month / week header ── */}
          <div style={{ marginLeft: LABEL_W, position: 'relative', height: 34, borderBottom: `1px solid ${colors.border}`, marginBottom: 6 }}>
            {markers.map((m, i) => (
              <React.Fragment key={i}>
                {/* Vertical grid line */}
                <div style={{
                  position: 'absolute', left: m.x, top: 0, bottom: 0, width: 1,
                  background: m.major ? colors.border : `${colors.border}50`,
                }} />
                {/* Label */}
                <span style={{
                  position: 'absolute', left: m.x + 4, bottom: 5,
                  fontFamily: fonts.display,
                  fontSize: m.major ? 9 : 8,
                  color: m.major ? colors.textDim : `${colors.textDim}70`,
                  textTransform: 'uppercase', letterSpacing: '0.1em',
                  whiteSpace: 'nowrap', pointerEvents: 'none',
                }}>
                  {m.label}
                </span>
              </React.Fragment>
            ))}

            {/* Today line in header */}
            <div style={{ position: 'absolute', left: todayX, top: 0, bottom: 0, width: 2, background: colors.cyan, opacity: 0.7, zIndex: 5 }} />
            {/* Release date line in header */}
            {targetX !== null && (
              <div style={{ position: 'absolute', left: targetX, top: 0, bottom: 0, width: 2, background: '#4ADE80', opacity: 0.7, zIndex: 5 }} />
            )}
          </div>

          {/* ── Rows ── */}
          {rows.map((row, ri) => {
            // Sort by due date, compute x + w, then stack
            const withX = row.tasks
              .slice()
              .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
              .map((t) => ({ task: t, x: toX(t.due_date), w: pillW(t.title) }));

            const stacked  = stackByLane(withX);
            const numLanes = stacked.length ? Math.max(...stacked.map((s) => s.lane)) + 1 : 1;
            const rowH     = numLanes * SUBLANE_H + 10;

            return (
              <div key={ri} style={{ display: 'flex', marginBottom: 2 }}>

                {/* Label */}
                <div style={{
                  width: LABEL_W, flexShrink: 0,
                  textAlign: 'right', paddingRight: 12,
                  fontFamily: fonts.display, fontSize: 9,
                  textTransform: 'uppercase', letterSpacing: '0.07em',
                  color: colors.textMuted,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  paddingTop: 8,
                }}>
                  {row.label}
                </div>

                {/* Bar area */}
                <div style={{ flex: 1, position: 'relative', height: rowH, borderBottom: `1px solid ${colors.border}20` }}>

                  {/* Grid lines */}
                  {markers.map((m, i) => (
                    <div key={i} style={{
                      position: 'absolute', left: m.x, top: 0, bottom: 0, width: 1,
                      background: m.major ? `${colors.border}50` : `${colors.border}25`,
                    }} />
                  ))}

                  {/* Today & release lines */}
                  <div style={{ position: 'absolute', left: todayX, top: 0, bottom: 0, width: 1, background: colors.cyan, opacity: 0.4, zIndex: 5 }} />
                  {targetX !== null && (
                    <div style={{ position: 'absolute', left: targetX, top: 0, bottom: 0, width: 1, background: '#4ADE80', opacity: 0.4, zIndex: 5 }} />
                  )}

                  {/* Tasks */}
                  {stacked.map(({ task, x, w, lane }) => {
                    const ws       = wsMap[task.workstream_id];
                    const base     = ws?.color || colors.indigo;
                    const color    = task.blocked_reason ? colors.red : base;
                    const isDone   = task.status === 'done';
                    const top      = 5 + lane * SUBLANE_H;
                    const dueStr   = new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    const tooltip  = `${task.title}  ·  due ${dueStr}${task.blocked_reason ? '  🚫 BLOCKED' : ''}`;

                    if (zoom < 3) {
                      return (
                        <div
                          key={task.id}
                          title={tooltip}
                          style={{
                            position: 'absolute',
                            left: x - DOT_R,
                            top: top + SUBLANE_H / 2 - DOT_R,
                            width: DOT_R * 2, height: DOT_R * 2,
                            borderRadius: '50%',
                            background: color,
                            opacity: isDone ? 0.35 : 0.9,
                            zIndex: 10, cursor: 'default',
                            boxShadow: `0 0 6px ${color}60`,
                          }}
                        />
                      );
                    }

                    return (
                      <div
                        key={task.id}
                        title={tooltip}
                        style={{
                          position: 'absolute',
                          left: x - w / 2,
                          top: top + (SUBLANE_H - PILL_H) / 2,
                          width: w, height: PILL_H,
                          borderRadius: 999,
                          background: isDone ? `${color}22` : `${color}18`,
                          border: `1px solid ${color}${isDone ? '45' : '70'}`,
                          opacity: isDone ? 0.55 : 1,
                          display: 'flex', alignItems: 'center',
                          paddingLeft: 8, paddingRight: 8,
                          zIndex: 10, cursor: 'default', overflow: 'hidden',
                        }}
                      >
                        <span style={{
                          fontFamily: fonts.display, fontSize: 8,
                          color: color, textTransform: 'uppercase',
                          letterSpacing: '0.07em', whiteSpace: 'nowrap',
                          overflow: 'hidden', textOverflow: 'ellipsis',
                        }}>
                          {task.title}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* ── Legend ── */}
          <div style={{
            display: 'flex', gap: 20, marginTop: 14,
            paddingTop: 10, borderTop: `1px solid ${colors.border}`,
            marginLeft: LABEL_W,
          }}>
            <LegendItem color={colors.cyan} label="Today" />
            {targetDate && <LegendItem color="#4ADE80" label="Release date" />}
            <LegendItem color={colors.red} label="Blocked" />
          </div>

        </div>
      </div>
    </div>
  );
}

function LegendItem({ color, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ width: 14, height: 1, background: color }} />
      <span style={{
        fontFamily: fonts.display, fontSize: 9, color: colors.textDim,
        textTransform: 'uppercase', letterSpacing: '0.12em',
      }}>
        {label}
      </span>
    </div>
  );
}

const zoomBtn = {
  width: 26, height: 26, borderRadius: 6,
  border: `1px solid rgba(244,244,245,0.1)`,
  background: 'transparent',
  color: '#71717A', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  transition: 'color 0.15s, border-color 0.15s',
};
