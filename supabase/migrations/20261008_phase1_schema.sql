-- WanderSketch & Trip Archive: Phase 1 Database Architecture & Storage Expansion
-- Migration: 20261008_phase1_schema.sql
-- Description: Creates user_profiles, itinerary_days, itinerary_items, travel_diaries, 
--              and trip_archives tables, configures RLS and storage bucket trip-assets.

-- 0. Ensure PostGIS is available (extensions schema in Supabase)
CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA extensions;

-- 1. public.user_profiles
-- Stores traveler onboarding preferences, dining tastes, and walking profile.
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id text PRIMARY KEY,
    lodging_tier text,
    dining_tastes text[],
    walking_endurance text,
    attraction_types text[],
    created_at timestamptz DEFAULT timezone('utc', now())
);

COMMENT ON TABLE public.user_profiles IS 'User travel preference profile and defaults';
COMMENT ON COLUMN public.user_profiles.id IS 'User identifier (auth.users or custom client identifier)';

-- 2. public.itinerary_days
-- Tracks daily schedules, calendar dates, and per-day budget subtotals.
CREATE TABLE IF NOT EXISTS public.itinerary_days (
    id text PRIMARY KEY,
    plan_id text REFERENCES public.travel_plans(id) ON DELETE CASCADE,
    day_number int NOT NULL,
    calendar_date date,
    hotel_info jsonb DEFAULT '{}'::jsonb,
    subtotal_estimated numeric DEFAULT 0,
    subtotal_actual numeric DEFAULT 0,
    created_at timestamptz DEFAULT timezone('utc', now())
);

COMMENT ON TABLE public.itinerary_days IS 'Daily breakdown for an itinerary plan';
COMMENT ON COLUMN public.itinerary_days.hotel_info IS 'JSON metadata for lodging (name, coords, check-in details)';

-- 3. public.itinerary_items
-- Itemized activities, bookings, dining stops, and transit with PostGIS spatial point.
CREATE TABLE IF NOT EXISTS public.itinerary_items (
    id text PRIMARY KEY,
    day_id text REFERENCES public.itinerary_days(id) ON DELETE CASCADE,
    plan_id text REFERENCES public.travel_plans(id) ON DELETE CASCADE,
    name text NOT NULL,
    category text CHECK (category IN ('lodging', 'dining', 'ticket', 'transit')),
    estimated_cost numeric DEFAULT 0,
    actual_cost numeric DEFAULT 0,
    location extensions.geometry(Point, 4326),
    order_index int DEFAULT 0
);

COMMENT ON TABLE public.itinerary_items IS 'Itemized expenses, activities, and waypoints per day';

-- 4. public.travel_diaries
-- Rich multimedia journal entries tied to a trip plan and specific date.
CREATE TABLE IF NOT EXISTS public.travel_diaries (
    id text PRIMARY KEY,
    plan_id text REFERENCES public.travel_plans(id) ON DELETE CASCADE,
    entry_date date NOT NULL,
    content text,
    image_urls text[] DEFAULT '{}'::text[],
    created_at timestamptz DEFAULT timezone('utc', now())
);

COMMENT ON TABLE public.travel_diaries IS 'Daily travel journal entries and photo attachments';

-- 5. public.trip_archives
-- Lifecycle status ledger, total estimated vs actual spend, and generated PDF dossier snapshots.
CREATE TABLE IF NOT EXISTS public.trip_archives (
    id text PRIMARY KEY,
    plan_id text REFERENCES public.travel_plans(id) ON DELETE CASCADE,
    status text CHECK (status IN ('planning', 'on-trip', 'completed')) DEFAULT 'planning',
    total_estimated numeric DEFAULT 0,
    total_actual numeric DEFAULT 0,
    pdf_url text,
    snapshot_url text,
    finalized_at timestamptz
);

COMMENT ON TABLE public.trip_archives IS 'Trip status ledger, budget summary, and generated dossier snapshots';

-- -----------------------------------------------------------------------------
-- Indexes for Foreign Keys and Spatial Queries
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_itinerary_days_plan_id ON public.itinerary_days(plan_id);
CREATE INDEX IF NOT EXISTS idx_itinerary_items_day_id ON public.itinerary_items(day_id);
CREATE INDEX IF NOT EXISTS idx_itinerary_items_plan_id ON public.itinerary_items(plan_id);
CREATE INDEX IF NOT EXISTS idx_itinerary_items_location ON public.itinerary_items USING gist (location);
CREATE INDEX IF NOT EXISTS idx_travel_diaries_plan_id ON public.travel_diaries(plan_id);
CREATE INDEX IF NOT EXISTS idx_trip_archives_plan_id ON public.trip_archives(plan_id);

-- -----------------------------------------------------------------------------
-- 6. Enable Row Level Security (RLS) & Permissive Development Policies
-- -----------------------------------------------------------------------------
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itinerary_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itinerary_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travel_diaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_archives ENABLE ROW LEVEL SECURITY;

-- Permissive development policy for user_profiles
DROP POLICY IF EXISTS "Permissive dev policy for user_profiles" ON public.user_profiles;
CREATE POLICY "Permissive dev policy for user_profiles"
    ON public.user_profiles
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Permissive development policy for itinerary_days
DROP POLICY IF EXISTS "Permissive dev policy for itinerary_days" ON public.itinerary_days;
CREATE POLICY "Permissive dev policy for itinerary_days"
    ON public.itinerary_days
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Permissive development policy for itinerary_items
DROP POLICY IF EXISTS "Permissive dev policy for itinerary_items" ON public.itinerary_items;
CREATE POLICY "Permissive dev policy for itinerary_items"
    ON public.itinerary_items
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Permissive development policy for travel_diaries
DROP POLICY IF EXISTS "Permissive dev policy for travel_diaries" ON public.travel_diaries;
CREATE POLICY "Permissive dev policy for travel_diaries"
    ON public.travel_diaries
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Permissive development policy for trip_archives
DROP POLICY IF EXISTS "Permissive dev policy for trip_archives" ON public.trip_archives;
CREATE POLICY "Permissive dev policy for trip_archives"
    ON public.trip_archives
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- 7. Storage Bucket Setup: trip-assets
-- -----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('trip-assets', 'trip-assets', true)
ON CONFLICT (id) DO UPDATE
SET public = true;

-- Permissive development storage policies for trip-assets bucket objects
DROP POLICY IF EXISTS "Public Read Access for trip-assets" ON storage.objects;
CREATE POLICY "Public Read Access for trip-assets"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'trip-assets');

DROP POLICY IF EXISTS "Public Insert Access for trip-assets" ON storage.objects;
CREATE POLICY "Public Insert Access for trip-assets"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'trip-assets');

DROP POLICY IF EXISTS "Public Update Access for trip-assets" ON storage.objects;
CREATE POLICY "Public Update Access for trip-assets"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'trip-assets');

DROP POLICY IF EXISTS "Public Delete Access for trip-assets" ON storage.objects;
CREATE POLICY "Public Delete Access for trip-assets"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'trip-assets');

