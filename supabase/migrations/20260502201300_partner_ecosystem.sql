
-- Create partners table
CREATE TABLE IF NOT EXISTS public.partners (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    referral_code TEXT UNIQUE NOT NULL,
    tier TEXT DEFAULT 'partner',
    total_earnings NUMERIC DEFAULT 0,
    active_referrals INTEGER DEFAULT 0,
    onboarded BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own partner data"
    ON public.partners FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own partner data"
    ON public.partners FOR UPDATE
    USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_partners_updated_at
    BEFORE UPDATE ON public.partners
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to initialize partner on first visit or application
CREATE OR REPLACE FUNCTION public.initialize_partner(target_user_id UUID, custom_code TEXT DEFAULT NULL)
RETURNS public.partners AS $$
DECLARE
    new_partner public.partners;
    final_code TEXT;
BEGIN
    -- Check if already exists
    SELECT * INTO new_partner FROM public.partners WHERE user_id = target_user_id;
    IF FOUND THEN
        RETURN new_partner;
    END IF;

    -- Generate a default code if not provided (e.g., user_1234)
    IF custom_code IS NULL THEN
        final_code := 'ref_' || encode(gen_random_bytes(6), 'hex');
    ELSE
        final_code := custom_code;
    END IF;

    INSERT INTO public.partners (user_id, referral_code)
    VALUES (target_user_id, final_code)
    RETURNING * INTO new_partner;

    RETURN new_partner;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
