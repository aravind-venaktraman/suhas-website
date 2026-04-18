import { useEffect } from 'react';
import { supabase } from '../supabase';

/**
 * Subscribes to live Postgres changes for a given release.
 * Calls the provided callbacks whenever tasks, comments, or activity changes.
 */
export function useRealtimeRelease(releaseId, { onTaskChange, onCommentChange, onActivityChange } = {}) {
  useEffect(() => {
    if (!releaseId) return;

    const channel = supabase
      .channel(`release-${releaseId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        (payload) => onTaskChange?.(payload)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'task_comments' },
        (payload) => onCommentChange?.(payload)
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'activity_log',
          filter: `release_id=eq.${releaseId}`,
        },
        (payload) => onActivityChange?.(payload)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [releaseId]);
}
