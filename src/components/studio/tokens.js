export const colors = {
  bg: '#09090B',
  bgCard: 'rgba(24,24,27,0.5)',
  bgCardSolid: '#18181B',
  border: 'rgba(244,244,245,0.06)',
  borderHover: 'rgba(34,211,238,0.3)',
  textPrimary: '#FAFAFA',
  textSecondary: '#E4E4E7',
  textMuted: '#A1A1AA',
  textDim: '#71717A',
  cyan: '#22D3EE',
  cyanDim: '#67E8F9',
  indigo: '#6366F1',
  indigoDim: '#A5B4FC',
  amber: '#F59E0B',
  amberDim: '#FCD34D',
  pink: '#EC4899',
  pinkDim: '#F9A8D4',
  red: '#F87171',
  redDim: '#FCA5A5',
  gray: '#A1A1AA',
};

export const fonts = {
  display: "'Michroma', sans-serif",
  body: "'Inter', sans-serif",
};

// Workstream name -> hex color (matches default seeds in mutations.js)
export const workstreamColorMap = {
  Audio:     '#6366F1',
  Visuals:   '#22D3EE',
  Marketing: '#F59E0B',
  Content:   '#EC4899',
  Admin:     '#A1A1AA',
};

export const statusMeta = {
  not_started: { label: 'Not started', color: '#71717A' },
  in_progress: { label: 'In progress', color: '#22D3EE' },
  blocked:     { label: 'Blocked',     color: '#F87171' },
  done:        { label: 'Done',        color: '#4ADE80' },
};

export const priorityMeta = {
  low:    { label: 'Low',    color: '#71717A' },
  normal: { label: 'Normal', color: '#A1A1AA' },
  high:   { label: 'High',   color: '#F59E0B' },
  urgent: { label: 'Urgent', color: '#F87171' },
};

// Gradient for avatar backgrounds
export const avatarGradient = (email) => {
  if (email === 'management@suhasmusic.com') {
    return 'linear-gradient(135deg, #EC4899, #A855F7)';
  }
  return 'linear-gradient(135deg, #6366F1, #22D3EE)';
};

export const cardTopLine =
  'linear-gradient(90deg, transparent, rgba(34,211,238,0.4), transparent)';
