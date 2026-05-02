-- Add participants array to scheduled_meetings
ALTER TABLE scheduled_meetings ADD COLUMN IF NOT EXISTS participants TEXT[] DEFAULT '{}';
