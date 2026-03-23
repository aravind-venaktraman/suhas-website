import { useEffect } from 'react';

const BASE_URL = 'https://suhasmusic.com';

/**
 * Sets per-route <title>, canonical, description, and Open Graph tags
 * so each SPA page has a unique identity for crawlers.
 *
 * On unmount it restores the home-page defaults from index.html.
 */
export default function usePageMeta({ path, title, description, ogTitle, ogDescription }) {
  useEffect(() => {
    // ── Title ──────────────────────────────────────────────
    document.title = title;

    // ── Canonical ──────────────────────────────────────────
    let canonical = document.querySelector('link[rel="canonical"]');
    const prevCanonical = canonical?.getAttribute('href');
    if (canonical) {
      canonical.setAttribute('href', `${BASE_URL}${path}`);
    } else {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      canonical.href = `${BASE_URL}${path}`;
      document.head.appendChild(canonical);
    }

    // ── Meta description ───────────────────────────────────
    let desc = document.querySelector('meta[name="description"]');
    const prevDesc = desc?.getAttribute('content');
    if (desc) {
      desc.setAttribute('content', description);
    }

    // ── Open Graph ─────────────────────────────────────────
    const ogTitleEl = document.querySelector('meta[property="og:title"]');
    const prevOgTitle = ogTitleEl?.getAttribute('content');
    if (ogTitleEl) ogTitleEl.setAttribute('content', ogTitle || title);

    const ogDescEl = document.querySelector('meta[property="og:description"]');
    const prevOgDesc = ogDescEl?.getAttribute('content');
    if (ogDescEl) ogDescEl.setAttribute('content', ogDescription || description);

    const ogUrlEl = document.querySelector('meta[property="og:url"]');
    const prevOgUrl = ogUrlEl?.getAttribute('content');
    if (ogUrlEl) ogUrlEl.setAttribute('content', `${BASE_URL}${path}`);

    // ── Cleanup: restore home-page defaults on unmount ─────
    return () => {
      if (canonical) canonical.setAttribute('href', prevCanonical || BASE_URL);
      if (desc) desc.setAttribute('content', prevDesc || '');
      if (ogTitleEl) ogTitleEl.setAttribute('content', prevOgTitle || '');
      if (ogDescEl) ogDescEl.setAttribute('content', prevOgDesc || '');
      if (ogUrlEl) ogUrlEl.setAttribute('content', prevOgUrl || BASE_URL);
    };
  }, [path, title, description, ogTitle, ogDescription]);
}
