/*
  # Create waitlist table

  1. New Tables
    - `waitlist`
      - `id` (uuid, primary key, auto-generated)
      - `email` (text, unique, not null) — the subscriber's email
      - `created_at` (timestamptz, default now()) — when they signed up

  2. Security
    - Enable RLS on `waitlist` table
    - Add INSERT policy for anonymous users (public waitlist form)
    - No SELECT/UPDATE/DELETE policies for anon — data is write-only from frontend
*/

CREATE TABLE IF NOT EXISTS waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (public waitlist form)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'waitlist'
      AND policyname = 'Anyone can join the waitlist'
  ) THEN
    CREATE POLICY "Anyone can join the waitlist"
      ON waitlist
      FOR INSERT
      TO anon
      WITH CHECK (true);
  END IF;
END $$;
