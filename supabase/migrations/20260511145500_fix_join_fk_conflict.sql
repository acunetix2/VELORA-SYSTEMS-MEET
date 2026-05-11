-- Migration: Fix Join Foreign Key Conflict
-- Date: 2026-05-11

-- 1. Remove the restrictive foreign key to the profiles table
-- This was causing joins to fail for users who have an auth account but no profile record yet.
-- We rely on the original foreign key to auth.users(id) instead.
ALTER TABLE classroom_members DROP CONSTRAINT IF EXISTS classroom_members_user_id_profiles_fkey;

-- 2. Ensure we still have the link to auth.users (from initial schema)
-- No changes needed as it was defined in 20260501182000_classroom_schema.sql
