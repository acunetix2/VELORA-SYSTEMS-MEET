-- Migration: Enterprise Hub Features (Organizations & Governance)
-- Date: 2026-05-09

-- 1. Ensure organizations table exists and has necessary columns
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    owner_id UUID REFERENCES auth.users(id) NOT NULL,
    settings JSONB DEFAULT '{}'::jsonb,
    admin_passcode_hash TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Ensure organization_members table exists
CREATE TABLE IF NOT EXISTS public.organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role TEXT DEFAULT 'member', -- 'admin', 'member'
    joined_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(org_id, user_id)
);

-- 3. Enable RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- 4. Policies for organizations
DROP POLICY IF EXISTS "Users can view their own organizations" ON public.organizations;
CREATE POLICY "Users can view their own organizations"
    ON public.organizations FOR SELECT
    USING (
        auth.uid() = owner_id OR
        EXISTS (
            SELECT 1 FROM public.organization_members
            WHERE org_id = id AND user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Owners can update their organizations" ON public.organizations;
CREATE POLICY "Owners can update their organizations"
    ON public.organizations FOR UPDATE
    USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Owners can delete their organizations" ON public.organizations;
CREATE POLICY "Owners can delete their organizations"
    ON public.organizations FOR DELETE
    USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Authenticated users can create organizations" ON public.organizations;
CREATE POLICY "Authenticated users can create organizations"
    ON public.organizations FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- 5. Policies for organization_members
DROP POLICY IF EXISTS "Members can view organization structure" ON public.organization_members;
CREATE POLICY "Members can view organization structure"
    ON public.organization_members FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_members
            WHERE org_id = organization_members.org_id AND user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Admins can manage organization members" ON public.organization_members;
CREATE POLICY "Admins can manage organization members"
    ON public.organization_members FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_members
            WHERE org_id = organization_members.org_id AND user_id = auth.uid() AND role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Users can join via invitation" ON public.organization_members;
CREATE POLICY "Users can join via invitation"
    ON public.organization_members FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');
