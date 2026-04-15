import { useCallback, useEffect, useRef } from 'react';

/**
 * Returns a ref callback that keeps a background <video> playing on mobile.
 *
 * Mobile browsers (especially iOS Safari) can suspend autoplay videos after
 * repeated loads or when the tab loses focus, showing a native play button
 * that's unreachable behind overlay content. This hook:
 *   - Resumes on visibilitychange (tab back in foreground)
 *   - Resumes on first user gesture (touchstart / click) if autoplay was blocked
 *   - Forces muted attribute to satisfy autoplay policy
 */
export default function useAutoplayVideo() {
  const videoRef = useRef(null);
  const gestureCleanupRef = useRef(null);

  const tryPlay = useCallback(() => {
    const v = videoRef.current;
    if (v && v.paused) {
      v.muted = true;
      v.play().catch(() => {});
    }
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    // Resume when tab becomes visible again
    const onVisibility = () => {
      if (document.visibilityState === 'visible') tryPlay();
    };

    // Resume on first user gesture (covers iOS autoplay policy)
    const onGesture = () => {
      tryPlay();
      document.removeEventListener('touchstart', onGesture, true);
      document.removeEventListener('click', onGesture, true);
      gestureCleanupRef.current = null;
    };

    document.addEventListener('visibilitychange', onVisibility);
    document.addEventListener('touchstart', onGesture, true);
    document.addEventListener('click', onGesture, true);
    gestureCleanupRef.current = onGesture;

    // Initial play attempt
    tryPlay();

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      if (gestureCleanupRef.current) {
        document.removeEventListener('touchstart', gestureCleanupRef.current, true);
        document.removeEventListener('click', gestureCleanupRef.current, true);
      }
    };
  }, [tryPlay]);

  // Ref callback
  const setRef = useCallback((el) => {
    videoRef.current = el;
    if (el) {
      el.muted = true;
      el.play().catch(() => {});
    }
  }, []);

  return setRef;
}
