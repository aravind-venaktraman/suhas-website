-- ============================================================================
-- Albums: self-referential grouping
--
-- An "album" is a release with type='album'. Other releases (singles, EPs)
-- can reference it via parent_release_id. Keeps the data model simple —
-- no new table, no cross-schema joins, and deleting an album just detaches
-- its children rather than cascading.
--
-- Apply via the Supabase SQL editor.
-- ============================================================================

ALTER TABLE public.releases
  ADD COLUMN IF NOT EXISTS parent_release_id UUID
    REFERENCES public.releases(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_releases_parent_release_id
  ON public.releases (parent_release_id);

-- Prevent an album from being assigned as another release's parent's parent,
-- which would let someone build arbitrarily deep trees. We enforce a single
-- layer: a parent must not itself have a parent.
CREATE OR REPLACE FUNCTION public.releases_parent_one_level()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.parent_release_id IS NOT NULL THEN
    IF NEW.parent_release_id = NEW.id THEN
      RAISE EXCEPTION 'A release cannot be its own parent';
    END IF;
    IF EXISTS (
      SELECT 1 FROM public.releases
      WHERE id = NEW.parent_release_id AND parent_release_id IS NOT NULL
    ) THEN
      RAISE EXCEPTION 'Parent release must be a top-level release (no grandparents)';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS releases_parent_one_level ON public.releases;
CREATE TRIGGER releases_parent_one_level
  BEFORE INSERT OR UPDATE OF parent_release_id ON public.releases
  FOR EACH ROW EXECUTE FUNCTION public.releases_parent_one_level();
