-- Fix: allow org owners to select their orgs even before they are added to organization_members
DO $$ BEGIN
  CREATE POLICY "Owners can view their orgs"
    ON organizations FOR SELECT
    USING (owner_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
