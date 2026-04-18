import { useState, useEffect } from 'react';
import { X, ChevronLeft, Check, AlertTriangle } from 'lucide-react';
import { listTemplateTasks } from '../../lib/studio/queries';
import { createReleaseFromTemplate } from '../../lib/studio/mutations';
import './NewReleaseWizard.css';

const LANE_COLORS = {
  Audio: '#6366F1', Visuals: '#22D3EE', Marketing: '#F59E0B',
  Content: '#EC4899', Admin: '#A1A1AA',
};

function computeDueDate(targetDate, daysBefore) {
  const d = new Date(targetDate + 'T12:00:00');
  d.setDate(d.getDate() - daysBefore);
  if (d.getDay() === 0) d.setDate(d.getDate() - 1);
  return d;
}

function formatShortDate(date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function NewReleaseWizard({ template, onClose, onCreated }) {
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState('');
  const [targetDate, setTargetDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + (template?.duration_days ?? 60));
    return d.toISOString().slice(0, 10);
  });
  const [tasks, setTasks] = useState([]);
  const [excludedIds, setExcludedIds] = useState(new Set());
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!template?.id) return;
    listTemplateTasks(template.id).then(data => {
      setTasks(data);
      setExcludedIds(new Set(data.filter(t => t.excluded_by_default).map(t => t.id)));
    });
  }, [template?.id]);

  const isSunday = targetDate && new Date(targetDate + 'T12:00:00').getDay() === 0;

  function toggleTask(id) {
    setExcludedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function handleCreate() {
    setCreating(true);
    setError(null);
    try {
      const releaseId = await createReleaseFromTemplate({
        templateId: template.id,
        title,
        targetDate,
        excludedTaskIds: Array.from(excludedIds),
      });
      setStep(3);
      setTimeout(() => onCreated(releaseId), 1200);
    } catch (e) {
      setError(e.message);
      setCreating(false);
    }
  }

  const tasksByLane = ['Audio', 'Visuals', 'Marketing', 'Content', 'Admin'].map(lane => ({
    lane,
    tasks: tasks.filter(t => t.workstream_name === lane),
  })).filter(g => g.tasks.length > 0);

  const includedCount = tasks.length - excludedIds.size;
  const autoExcludedCount = tasks.filter(t => t.excluded_by_default).length;

  return (
    <div className="nrw-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="nrw-modal">

        <div className="nrw-stepper">
          <div className={`nrw-step ${step === 1 ? 'active' : ''} ${step > 1 ? 'done' : ''}`}>
            <div className="nrw-step-num">{step > 1 ? <Check size={10} /> : '1'}</div>
            <span>Details</span>
          </div>
          <div className="nrw-step-sep">—</div>
          <div className={`nrw-step ${step === 2 ? 'active' : ''} ${step > 2 ? 'done' : ''}`}>
            <div className="nrw-step-num">{step > 2 ? <Check size={10} /> : '2'}</div>
            <span>Preview</span>
          </div>
          <div className="nrw-step-sep">—</div>
          <div className={`nrw-step ${step === 3 ? 'active' : ''}`}>
            <div className="nrw-step-num">3</div>
            <span>Done</span>
          </div>
          <button className="nrw-close" onClick={onClose}><X size={16} /></button>
        </div>

        {/* Step 1 — Details */}
        {step === 1 && (
          <div className="nrw-body">
            <div className="nrw-eyebrow">{template.name}</div>
            <h2 className="nrw-title">Name your release</h2>
            <p className="nrw-sub">{template.description}</p>

            <div className="nrw-form">
              <div>
                <div className="nrw-label">Title</div>
                <input
                  className="nrw-input"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Refraction"
                  autoFocus
                />
              </div>

              <div className="nrw-form-row">
                <div>
                  <div className="nrw-label">Release type</div>
                  <div className="nrw-static">{template.release_type}</div>
                </div>
                <div>
                  <div className="nrw-label">Target date</div>
                  <input
                    className="nrw-input"
                    type="date"
                    value={targetDate}
                    onChange={e => setTargetDate(e.target.value)}
                  />
                </div>
              </div>

              {isSunday && (
                <div className="nrw-warn">
                  <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                  That lands on a Sunday. Your Fractals history shows you rarely ship on Sundays. Consider Saturday or Monday.
                </div>
              )}
            </div>

            <div className="nrw-actions">
              <button className="nrw-btn-ghost" onClick={onClose}>Cancel</button>
              <button
                className="nrw-btn-primary"
                disabled={!title.trim() || !targetDate}
                onClick={() => setStep(2)}
              >
                Preview tasks →
              </button>
            </div>
          </div>
        )}

        {/* Step 2 — Preview & customize */}
        {step === 2 && (
          <div className="nrw-body">
            <div className="nrw-preview-head">
              <div>
                <div className="nrw-eyebrow">Preview and customize</div>
                <h2 className="nrw-title">{title}</h2>
                <p className="nrw-sub">
                  {template.release_type} · releases {formatShortDate(new Date(targetDate + 'T12:00:00'))}
                </p>
              </div>
              <div className="nrw-preview-counts">
                <div><strong>{includedCount}</strong> tasks included</div>
                <div><strong>{excludedIds.size}</strong> excluded</div>
              </div>
            </div>

            {autoExcludedCount > 0 && (
              <div className="nrw-callout">
                <div className="nrw-callout-icon">Auto-cut</div>
                <div>
                  {autoExcludedCount} task{autoExcludedCount > 1 ? 's' : ''} pre-unchecked based on Fractals history.
                  Click any row to include it back.
                </div>
              </div>
            )}

            {tasksByLane.map(group => (
              <div key={group.lane} className="nrw-lane-group">
                <div className="nrw-lane-title">
                  <span className="nrw-lane-dot" style={{ background: LANE_COLORS[group.lane] }} />
                  {group.lane} — {group.tasks.filter(t => !excludedIds.has(t.id)).length} of {group.tasks.length}
                </div>
                {group.tasks.map(task => {
                  const excluded = excludedIds.has(task.id);
                  const dueDate = computeDueDate(targetDate, task.days_before_release);
                  const urgent = task.days_before_release <= 7;
                  return (
                    <div
                      key={task.id}
                      className={`nrw-task ${excluded ? 'excluded' : ''}`}
                      onClick={() => toggleTask(task.id)}
                    >
                      <div className={`nrw-task-check ${excluded ? '' : 'checked'}`}>
                        {!excluded && <Check size={10} />}
                      </div>
                      <div className="nrw-task-body">
                        <div className="nrw-task-title">{task.title}</div>
                        {task.warning_note && !excluded && (
                          <div className="nrw-task-warn">⚠ {task.warning_note}</div>
                        )}
                        {task.exclusion_reason && excluded && (
                          <div className="nrw-task-excl-reason">{task.exclusion_reason}</div>
                        )}
                      </div>
                      <div className={`nrw-task-date ${urgent ? 'critical' : ''}`}>
                        {excluded ? '—' : formatShortDate(dueDate)}
                      </div>
                      <div className="nrw-task-assignee">
                        {task.default_assignee_role === 'unassigned' ? '—' : (task.default_assignee_role ?? '—')}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}

            {error && <div className="nrw-error">{error}</div>}

            <div className="nrw-actions">
              <button className="nrw-btn-ghost" onClick={() => setStep(1)}>
                <ChevronLeft size={14} /> Back
              </button>
              <button
                className="nrw-btn-primary"
                disabled={creating || includedCount === 0}
                onClick={handleCreate}
              >
                {creating ? 'Creating...' : `Create release with ${includedCount} tasks →`}
              </button>
            </div>
          </div>
        )}

        {/* Step 3 — Success */}
        {step === 3 && (
          <div className="nrw-body nrw-success">
            <div className="nrw-success-mark"><Check size={28} /></div>
            <h2 className="nrw-title">{title} is live</h2>
            <p className="nrw-sub">Opening the board...</p>
          </div>
        )}

      </div>
    </div>
  );
}
