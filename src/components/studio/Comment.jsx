import React from 'react';
import AvatarMini from './AvatarMini';
import { formatRelativeTime, formatDualTimezone } from '../../lib/studio/analytics';
import { colors, fonts } from './tokens';

export default function Comment({ comment, viewerProfile }) {
  // comment.author is a joined profile object from listComments()
  const author = comment.author;
  if (!author) return null;

  const date = new Date(comment.created_at);

  // Build dual-timezone string using author's stored timezone and viewer's timezone
  const authorTz = author.timezone ?? 'America/Chicago';
  const viewerTz = viewerProfile?.timezone ?? 'America/Chicago';

  function formatDual(d) {
    if (viewerTz === authorTz) {
      return new Intl.DateTimeFormat('en-US', {
        timeZone: viewerTz,
        hour: 'numeric',
        minute: '2-digit',
      }).format(d);
    }
    const viewerTime = new Intl.DateTimeFormat('en-US', {
      timeZone: viewerTz,
      hour: 'numeric',
      minute: '2-digit',
    }).format(d);
    const authorTime = new Intl.DateTimeFormat('en-US', {
      timeZone: authorTz,
      hour: 'numeric',
      minute: '2-digit',
    }).format(d);
    return `${viewerTime} yours / ${authorTime} theirs`;
  }

  return (
    <div className="flex gap-3 group">
      <AvatarMini profile={author} size={24} />

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-1 flex-wrap">
          <span
            className="text-[11px] font-bold"
            style={{ color: colors.textSecondary, fontFamily: fonts.display }}
          >
            {author.display_name}
          </span>
          <span
            className="text-[10px]"
            style={{ color: colors.textDim }}
            title={date.toLocaleString()}
          >
            {formatRelativeTime(date)} &middot; {formatDual(date)}
          </span>
        </div>
        <p
          className="text-[12px] leading-relaxed whitespace-pre-wrap break-words"
          style={{ color: colors.textMuted, fontFamily: fonts.body }}
        >
          {comment.body}
        </p>
      </div>
    </div>
  );
}
