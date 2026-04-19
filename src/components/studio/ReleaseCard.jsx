import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, AlertTriangle, CheckCircle2, Clock, Flame, Disc3 } from 'lucide-react';

function formatShortDate(value) {
  if (!value) return '—';
  // target_date is a date string (YYYY-MM-DD); anchor at noon to avoid TZ drift.
  const iso = typeof value === 'string' && value.length === 10 ? `${value}T12:00:00` : value;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function statusLabel(status) {
  switch (status) {
    case 'planning':    return 'Planning';
    case 'in_progress': return 'In progress';
    case 'released':    return 'Released';
    case 'archived':    return 'Archived';
    default:            return status ?? '—';
  }
}

// Map releases.type slugs to a clean human label.
function typeLabel(type) {
  if (!type) return 'Release';
  const s = String(type).toLowerCase();
  if (s === 'ep') return 'EP';
  if (s === 'lp') return 'LP';
  if (s === 'single') return 'Single';
  if (s === 'album') return 'Album';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function ReleaseCard({ release, compact = false }) {
  const navigate = useNavigate();
  const { stats, rollup, children = [] } = release;
  const isReleased = release.status === 'released';
  const isArchived = release.status === 'archived';
  const isAlbum    = release.type === 'album';
  const isAtRisk   = !isReleased && !isArchived && (stats.is_overdue || stats.blockers > 0);

  // For albums, swap in the aggregate rollup stats so the card reflects the
  // combined state of the album + its child singles.
  const displayStats = isAlbum && rollup ? { ...stats, ...rollup } : stats;

  // Base colors per status — drives top accent, bar, readiness number.
  // Albums get a purple accent to visually separate them from singles.
  const accent = isAlbum
    ? { line: '#A855F7', text: '#D8B4FE', bar: 'linear-gradient(90deg, #A855F7, #EC4899)' }
    : isReleased
    ? { line: '#10B981', text: '#6EE7B7', bar: 'linear-gradient(90deg, #10B981, #6EE7B7)' }
    : release.status === 'planning'
    ? { line: '#6366F1', text: '#A5B4FC', bar: 'linear-gradient(90deg, #6366F1, #818CF8)' }
    : release.status === 'archived'
    ? { line: '#52525B', text: '#A1A1AA', bar: 'linear-gradient(90deg, #52525B, #71717A)' }
    : { line: '#22D3EE', text: '#67E8F9', bar: 'linear-gradient(90deg, #6366F1, #22D3EE)' };

  function open() {
    navigate(`/studio/release/${release.id}`);
  }

  function openRetro(e) {
    e.stopPropagation();
    navigate(`/studio/release/${release.id}/retro`);
  }

  const totalDist = stats.distribution.reduce((sum, d) => sum + d.total, 0);

  return (
    <article
      className={`hp-card hp-card-${release.status}`}
      onClick={open}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          open();
        }
      }}
      aria-label={`${release.title} — ${statusLabel(release.status)}, ${stats.readiness}% ready`}
    >
      <div className="hp-card-line" style={{ background: accent.line }} />

      {isAtRisk && (
        <div className="hp-card-risk" title={stats.is_overdue ? 'Past target date' : 'Has blockers'}>
          {stats.is_overdue ? <Flame size={10} /> : <AlertTriangle size={10} />}
          <span>{stats.is_overdue ? 'Overdue' : 'At risk'}</span>
        </div>
      )}

      <div className="hp-card-head">
        <div className="hp-card-id">
          {isAlbum && <Disc3 size={11} style={{ color: '#D8B4FE', marginRight: 4 }} />}
          <span className="hp-card-type">{typeLabel(release.type)}</span>
          {isAlbum && rollup && (
            <>
              <span className="hp-card-dot" aria-hidden>·</span>
              <span className="hp-card-type">
                {rollup.child_count} {rollup.child_count === 1 ? 'release' : 'releases'}
              </span>
            </>
          )}
          {release.target_date && !isReleased && !isAlbum && (
            <>
              <span className="hp-card-dot" aria-hidden>·</span>
              <span className="hp-card-type">{formatShortDate(release.target_date)}</span>
            </>
          )}
        </div>
        <span className={`hp-card-status hp-card-status-${release.status}`}>
          {statusLabel(release.status)}
        </span>
      </div>

      <h3 className="hp-card-title">{release.title}</h3>

      <div className="hp-card-readiness">
        <span className="hp-card-readiness-label">
          {isAlbum ? 'Album readiness' : 'Readiness'}
        </span>
        <span className="hp-card-readiness-val" style={{ color: accent.text }}>
          {displayStats.readiness}
          <span className="hp-card-readiness-unit">%</span>
        </span>
      </div>
      <div className="hp-card-bar" aria-hidden>
        <div
          className="hp-card-bar-fill"
          style={{ width: `${displayStats.readiness}%`, background: accent.bar }}
        />
      </div>

      {/* Workstream distribution mini-viz: proportional segments, dimmed by done ratio */}
      {totalDist > 0 && (
        <div className="hp-card-dist" aria-hidden>
          {stats.distribution.filter((d) => d.total > 0).map((d) => {
            const pct = (d.total / totalDist) * 100;
            const doneRatio = d.total > 0 ? d.done / d.total : 0;
            return (
              <div
                key={d.id}
                className="hp-card-dist-seg"
                style={{
                  width: `${pct}%`,
                  background: d.color,
                  opacity: 0.25 + doneRatio * 0.75,
                }}
                title={`${d.name}: ${d.done}/${d.total}`}
              />
            );
          })}
        </div>
      )}

      <div className="hp-card-meta">
        {isAlbum ? (
          <>
            <Cell
              label="Singles"
              value={rollup?.child_count ?? 0}
              tone={!rollup || rollup.child_count === 0 ? 'dim' : undefined}
            />
            <Cell
              label="Shipped"
              value={
                rollup && rollup.child_count > 0
                  ? `${rollup.child_released}/${rollup.child_count}`
                  : '—'
              }
              tone={rollup?.child_released === rollup?.child_count && rollup?.child_count > 0 ? 'success' : undefined}
            />
            <Cell
              label="Tasks"
              value={displayStats.task_total > 0 ? `${displayStats.task_done}/${displayStats.task_total}` : '—'}
            />
            <Cell
              label="Blockers"
              value={
                displayStats.blockers > 0
                  ? <span className="hp-meta-inline">
                      <AlertTriangle size={11} style={{ marginRight: 3 }} /> {displayStats.blockers}
                    </span>
                  : displayStats.stuck > 0
                    ? <span className="hp-meta-inline">
                        <Clock size={11} style={{ marginRight: 3 }} /> {displayStats.stuck} stuck
                      </span>
                    : '0'
              }
              tone={displayStats.blockers > 0 ? 'danger' : displayStats.stuck > 0 ? 'purple' : 'success'}
            />
          </>
        ) : isReleased ? (
          <>
            <Cell label="Released" value={formatShortDate(release.released_at?.slice(0, 10))} />
            <Cell label="Cycle"    value={stats.cycle_days ? `${stats.cycle_days}d` : '—'} />
            <Cell
              label="Shipped"
              value={
                <span className="hp-meta-inline">
                  <CheckCircle2 size={11} style={{ color: '#6EE7B7', marginRight: 4 }} />
                  {stats.task_done}
                </span>
              }
            />
            <Cell
              label="Retro"
              value={
                <button className="hp-meta-link" onClick={openRetro}>
                  View <ArrowUpRight size={10} />
                </button>
              }
            />
          </>
        ) : isArchived ? (
          <>
            <Cell label="Tasks"    value={`${stats.task_done}/${stats.task_total}`} />
            <Cell label="Checklist" value={stats.checklist_total > 0 ? `${stats.checklist_done}/${stats.checklist_total}` : '—'} />
            <Cell label="Created"  value={formatShortDate(release.created_at?.slice(0, 10))} />
            <Cell label="Status"   value="Archived" tone="dim" />
          </>
        ) : (
          <>
            <Cell
              label="Target"
              value={release.target_date ? formatShortDate(release.target_date) : 'Not set'}
              tone={release.target_date ? undefined : 'dim'}
            />
            <Cell
              label="Days out"
              value={
                stats.is_overdue
                  ? <span className="hp-meta-inline">
                      <Flame size={11} style={{ marginRight: 3 }} /> Past
                    </span>
                  : stats.days_out !== null ? stats.days_out : '—'
              }
              tone={
                stats.is_overdue ? 'danger'
                : stats.days_out !== null && stats.days_out <= 7 ? 'danger'
                : stats.days_out !== null && stats.days_out <= 21 ? 'warn'
                : undefined
              }
            />
            <Cell
              label="Tasks"
              value={stats.task_total > 0 ? `${stats.task_done}/${stats.task_total}` : '—'}
            />
            <Cell
              label="Blockers"
              value={
                stats.blockers > 0
                  ? <span className="hp-meta-inline">
                      <AlertTriangle size={11} style={{ marginRight: 3 }} /> {stats.blockers}
                    </span>
                  : stats.stuck > 0
                    ? <span className="hp-meta-inline">
                        <Clock size={11} style={{ marginRight: 3 }} /> {stats.stuck} stuck
                      </span>
                    : '0'
              }
              tone={stats.blockers > 0 ? 'danger' : stats.stuck > 0 ? 'purple' : 'success'}
            />
          </>
        )}
      </div>
    </article>
  );
}

function Cell({ label, value, tone }) {
  return (
    <div className="hp-meta-cell">
      <span className="hp-meta-label">{label}</span>
      <span className={`hp-meta-val${tone ? ` hp-meta-${tone}` : ''}`}>{value}</span>
    </div>
  );
}
