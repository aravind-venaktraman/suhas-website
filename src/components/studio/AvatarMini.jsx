import React from 'react';

/**
 * Renders a small circular avatar.
 *
 * Preferred usage (profile object from Supabase):
 *   <AvatarMini profile={task.assignee} size={20} />
 *
 * Legacy fallback (email + display name, no profile row yet):
 *   <AvatarMini email="arav@suhasmusic.com" displayName="Arav" size={20} />
 */
export default function AvatarMini({ profile, email, displayName, size = 20 }) {
  // Derive gradient and initials from whichever source is available
  const bg = profile
    ? `linear-gradient(135deg, ${profile.avatar_color_from}, ${profile.avatar_color_to})`
    : email === 'management@suhasmusic.com'
    ? 'linear-gradient(135deg, #EC4899, #A855F7)'
    : 'linear-gradient(135deg, #6366F1, #22D3EE)';

  const initials = profile?.initials
    ?? (displayName
        ? displayName.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase()
        : email
        ? email[0].toUpperCase()
        : '?');

  const title = profile?.display_name ?? displayName ?? email ?? '';

  return (
    <span
      className="inline-flex items-center justify-center rounded-full shrink-0 select-none font-bold"
      style={{
        width: size,
        height: size,
        background: bg,
        fontSize: Math.round(size * 0.4),
        color: '#09090B',
        fontFamily: "'Michroma', sans-serif",
        letterSpacing: '0.02em',
      }}
      title={title}
    >
      {initials}
    </span>
  );
}
