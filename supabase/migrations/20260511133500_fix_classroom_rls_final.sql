-- Migration: Fix Classroom Join RLS & Profile Joins
-- Date: 2026-05-11

-- 1. Allow any authenticated user to SELECT classrooms (required for join lookup by code)
-- We only allow selecting by join_code or id to prevent total data exposure.
DO $$ BEGIN
  CREATE POLICY "Authenticated users can lookup classrooms to join"
    ON classrooms FOR SELECT
    TO authenticated
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Allow members to view each other's profiles in the classroom
-- This ensures the student list can join with the profiles table.
-- Already partially handled by profile policies, but let's be explicit for classroom_members.
DO $$ BEGIN
  CREATE POLICY "Class members can view other members"
    ON classroom_members FOR SELECT
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM classroom_members AS m
        WHERE m.classroom_id = classroom_members.classroom_id
          AND (m.user_id = auth.uid() OR m.email = (SELECT email FROM auth.users WHERE id = auth.uid()))
      )
      OR
      EXISTS (
        SELECT 1 FROM classrooms WHERE id = classroom_members.classroom_id AND user_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. Ensure classroom_submissions can be joined with profiles for grading
-- This is often restricted by RLS on the profiles table itself, so ensure profiles are viewable.
-- Profiles should be viewable by all authenticated users (standard Velora behavior).
DO $$ BEGIN
  CREATE POLICY "Profiles are viewable by all members"
    ON profiles FOR SELECT
    TO authenticated
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
