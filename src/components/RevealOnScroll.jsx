import React, { useEffect, useMemo, useRef, useState } from "react";

const STORAGE_KEY = "__reveal_once_cache_v1__";

const readCache = () => {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
};

const writeCache = (set) => {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(set)));
  } catch {
    // ignore storage write errors
  }
};

const memoryCache = readCache();

export default function RevealOnScroll({
  children,
  delay = 0,
  className = "",
  cacheKey,
  threshold = 0.05,
  rootMargin = "0px 0px -2% 0px",
  once = true,
}) {
  const ref = useRef(null);

  const key = useMemo(() => {
    if (!cacheKey) return null;
    return String(cacheKey);
  }, [cacheKey]);

  const [shown, setShown] = useState(() => {
    if (!once) return false;
    if (!key) return false;
    return memoryCache.has(key);
  });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (shown) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;

        setShown(true);

        if (once && key) {
          memoryCache.add(key);
          writeCache(memoryCache);
        }

        if (once) obs.disconnect();
      },
      { threshold, rootMargin }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [shown, key, threshold, rootMargin, once]);

  return (
    <div
      ref={ref}
      className={[
        "transition-all duration-150 ease-out will-change-transform will-change-opacity",
        shown ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1",
        className,
      ].join(" ")}
      style={{ transitionDelay: `${Math.round(delay * 0.2)}ms` }}
    >
      {children}
    </div>
  );
}