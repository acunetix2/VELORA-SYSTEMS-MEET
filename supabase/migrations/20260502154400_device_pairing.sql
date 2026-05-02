-- Create device pairing table using gen_random_uuid() which is standard in Supabase
CREATE TABLE IF NOT EXISTS device_pairing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    pair_code TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    device_info JSONB,
    UNIQUE(pair_code)
);

-- RLS
ALTER TABLE device_pairing ENABLE ROW LEVEL SECURITY;

-- Remove existing policies if they exist to avoid errors on retry
DROP POLICY IF EXISTS "Users can manage their own pairing codes" ON device_pairing;
DROP POLICY IF EXISTS "Anyone can view a pairing code for verification" ON device_pairing;

CREATE POLICY "Users can manage their own pairing codes" 
ON device_pairing FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view a pairing code for verification" 
ON device_pairing FOR SELECT 
USING (true);
