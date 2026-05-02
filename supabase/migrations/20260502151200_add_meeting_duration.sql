-- Add duration column to scheduled_meetings
ALTER TABLE scheduled_meetings ADD COLUMN IF NOT EXISTS duration INT DEFAULT 60;
