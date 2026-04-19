import { useEffect, useState } from 'react';
import { loadBackground, backgroundToCss } from './background';

// Subscribe to background changes (localStorage + custom event) and return
// both the raw spec and a ready-to-apply CSS string.
export function useBackground() {
  const [bg, setBg] = useState(() => loadBackground());

  useEffect(() => {
    function onChange(e) {
      if (e.detail) { setBg(e.detail); return; }
      setBg(loadBackground());
    }
    function onStorage(e) {
      if (e.key && e.key.startsWith('studio.background')) setBg(loadBackground());
    }
    window.addEventListener('studio:background-change', onChange);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('studio:background-change', onChange);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  return { bg, css: backgroundToCss(bg) };
}
