-- ============================================================
-- Velora AI Infrastructure: Conversations & Settings
-- ============================================================

-- 1. AI Conversations Table
CREATE TABLE IF NOT EXISTS ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. AI Messages Table
CREATE TABLE IF NOT EXISTS ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES ai_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. AI Settings in Profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ai_persona TEXT DEFAULT 'concierge';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ai_context TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ai_voice_enabled BOOLEAN DEFAULT false;

-- 4. RLS for Conversations
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own conversations" ON ai_conversations;
CREATE POLICY "Users can manage their own conversations" ON ai_conversations
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage messages in their conversations" ON ai_messages;
CREATE POLICY "Users can manage messages in their conversations" ON ai_messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM ai_conversations 
      WHERE id = ai_messages.conversation_id AND user_id = auth.uid()
    )
  );

-- Function to update conversation timestamp
CREATE OR REPLACE FUNCTION update_ai_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE ai_conversations SET updated_at = now() WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ai_conversation_ts_trigger
AFTER INSERT ON ai_messages
FOR EACH ROW
EXECUTE FUNCTION update_ai_conversation_timestamp();
