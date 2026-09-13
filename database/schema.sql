-- ============================================================
-- Smart Waste Management System - Supabase / PostgreSQL Schema
-- ============================================================
-- How to use:
-- 1. Open your Supabase project -> SQL Editor
-- 2. Paste this entire file and click "Run"
-- This creates all tables needed by the Flask backend.

-- ---------- bins ----------
-- The "live" snapshot of every physical bin.
create table if not exists bins (
    id bigint generated always as identity primary key,
    bin_id text unique not null,              -- human-readable ID e.g. 'BIN001'
    location text,                            -- e.g. 'Zone A - Market Street'
    latitude double precision,
    longitude double precision,
    status text default 'empty',              -- empty | medium | full | critical
    current_fill_percentage numeric default 0,
    current_weight numeric default 0,
    last_updated timestamptz default now(),
    created_at timestamptz default now()
);

-- ---------- sensor_readings ----------
-- Every single reading ever received, used to build history for the ML model.
create table if not exists sensor_readings (
    id bigint generated always as identity primary key,
    bin_id text not null references bins(bin_id) on delete cascade,
    fill_percentage numeric not null,
    weight numeric,
    temperature numeric,
    timestamp timestamptz default now()
);

-- ---------- predictions ----------
-- A log of every ML prediction made, so trends can be reviewed later.
create table if not exists predictions (
    id bigint generated always as identity primary key,
    bin_id text not null references bins(bin_id) on delete cascade,
    predicted_fill_percentage numeric,
    predicted_status text,        -- will_reach_full | stable | slow_fill | insufficient_data
    predicted_time timestamptz,   -- estimated time the bin will be full
    created_at timestamptz default now()
);

-- ---------- collections ----------
-- A record every time a bin is emptied.
create table if not exists collections (
    id bigint generated always as identity primary key,
    bin_id text not null references bins(bin_id) on delete cascade,
    collection_time timestamptz default now(),
    previous_fill_level numeric,
    collected_weight numeric,
    worker_id text,
    vehicle_id text
);

-- ---------- alerts ----------
-- Automatically raised when a bin crosses the "needs collection" threshold.
create table if not exists alerts (
    id bigint generated always as identity primary key,
    bin_id text not null references bins(bin_id) on delete cascade,
    alert_type text,              -- 'Full Bin' | 'Critical Fill'
    message text,
    status text default 'Open',   -- Open | Resolved
    created_at timestamptz default now()
);

-- ---------- dumping_reports ----------
-- Illegal dumping reports (independent of the bin network).
create table if not exists dumping_reports (
    id bigint generated always as identity primary key,
    location text not null,
    latitude double precision,
    longitude double precision,
    image text,                   -- URL/path to an uploaded photo (optional)
    description text,
    status text default 'Open',   -- Open | Investigating | Resolved
    created_at timestamptz default now()
);

-- ---------- Helpful indexes ----------
create index if not exists idx_sensor_readings_bin_id on sensor_readings(bin_id);
create index if not exists idx_sensor_readings_timestamp on sensor_readings(timestamp);
create index if not exists idx_predictions_bin_id on predictions(bin_id);
create index if not exists idx_alerts_status on alerts(status);
create index if not exists idx_collections_bin_id on collections(bin_id);

-- ---------- Row Level Security ----------
-- For a student project, the simplest safe approach is to keep RLS disabled
-- and use the "service_role" key ONLY on the backend (never in the React app).
-- If you want RLS on, enable it per-table and add policies as a later step.
