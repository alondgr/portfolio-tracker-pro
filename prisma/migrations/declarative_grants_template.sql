-- ============================================================================
-- Supabase Data API Declarative Grants Template (Mandatory post-Oct 30, 2026)
-- ============================================================================
-- Context: Tables created via migrations or direct SQL after October 30, 2026
-- no longer receive implicit grants for `anon` and `authenticated`.
-- Every forward migration creating tables MUST explicitly declare GRANT
-- statements alongside Row-Level Security (RLS) policies.
-- ============================================================================

-- 1. Portfolio Snapshots (Analytics & Valuation Cache)
CREATE TABLE IF NOT EXISTS public.portfolio_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  total_valuation NUMERIC(14, 2) NOT NULL,
  snapshot_date TIMESTAMPTZ DEFAULT now()
);

-- Explicit Data API Grants (Mandatory post-October 30, 2026)
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
REVOKE ALL ON public.portfolio_snapshots FROM anon;
GRANT SELECT, INSERT ON public.portfolio_snapshots TO authenticated;
GRANT ALL ON public.portfolio_snapshots TO service_role;

-- Row-Level Security
ALTER TABLE public.portfolio_snapshots ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'portfolio_snapshots'
      AND policyname = 'Users can read own snapshots'
  ) THEN
    CREATE POLICY "Users can read own snapshots"
    ON public.portfolio_snapshots FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- 2. Explicit Grants for Existing Prisma Models (if accessed via Data API)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Transaction') THEN
    EXECUTE 'REVOKE ALL ON TABLE public."Transaction" FROM anon';
    EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."Transaction" TO authenticated';
    EXECUTE 'GRANT ALL ON TABLE public."Transaction" TO service_role';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Watchlist') THEN
    EXECUTE 'REVOKE ALL ON TABLE public."Watchlist" FROM anon';
    EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."Watchlist" TO authenticated';
    EXECUTE 'GRANT ALL ON TABLE public."Watchlist" TO service_role';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'SystemHealthLog') THEN
    EXECUTE 'REVOKE ALL ON TABLE public."SystemHealthLog" FROM anon';
    EXECUTE 'GRANT SELECT, INSERT ON TABLE public."SystemHealthLog" TO authenticated';
    EXECUTE 'GRANT ALL ON TABLE public."SystemHealthLog" TO service_role';
  END IF;
END $$;
