-- ============================================================================
-- Streaming Stats
--
-- release_stats: append-only snapshot table — one row per release per platform
-- per day. Keeps history so we can chart trend over time.
--
-- platform_ids: JSONB column on releases stores the platform-specific IDs
-- (YouTube video ID, Spotify track ID, etc.) so the fetch functions know what
-- to look up.
--
-- Apply via the Supabase SQL editor.
-- ============================================================================

-- Per-release platform IDs map
ALTER TABLE public.releases
  ADD COLUMN IF NOT EXISTS platform_ids JSONB DEFAULT '{}';

-- Snapshot table
CREATE TABLE IF NOT EXISTS public.release_stats (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  release_id    UUID        NOT NULL REFERENCES public.releases(id) ON DELETE CASCADE,
  platform      TEXT        NOT NULL,  -- 'youtube' | 'spotify' | 'apple_music' | 'soundcloud'
  snapshot_date DATE        NOT NULL DEFAULT CURRENT_DATE,
  plays         BIGINT,               -- views / streams / plays
  likes         BIGINT,
  comments      BIGINT,
  saves         BIGINT,               -- Spotify saves / Apple library adds
  source        TEXT        NOT NULL DEFAULT 'manual',  -- 'api' | 'manual'
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (release_id, platform, snapshot_date)
);

CREATE INDEX IF NOT EXISTS idx_release_stats_release_id
  ON public.release_stats (release_id, platform, snapshot_date DESC);

-- Enable RLS (reads/writes allowed for authenticated users only)
ALTER TABLE public.release_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read release_stats"  ON public.release_stats;
DROP POLICY IF EXISTS "Authenticated users can write release_stats" ON public.release_stats;

CREATE POLICY "Authenticated users can read release_stats"
  ON public.release_stats FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Authenticated users can write release_stats"
  ON public.release_stats FOR ALL
  TO authenticated USING (true) WITH CHECK (true);
