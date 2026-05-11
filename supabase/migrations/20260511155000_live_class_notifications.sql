-- Migration: Live Class Notifications
-- Date: 2026-05-11

-- 1. Add tracking for live session starts
ALTER TABLE public.classrooms ADD COLUMN IF NOT EXISTS last_live_at TIMESTAMPTZ;

-- 2. Create notification trigger for live sessions
CREATE OR REPLACE FUNCTION public.handle_live_session_notification()
RETURNS TRIGGER AS $$
DECLARE
  student_record RECORD;
BEGIN
  -- Only notify if last_live_at was updated and is not null
  IF NEW.last_live_at IS NOT NULL AND (OLD.last_live_at IS NULL OR NEW.last_live_at > OLD.last_live_at) THEN
    -- Notify all enrolled students
    FOR student_record IN 
      SELECT cm.user_id 
      FROM public.classroom_members cm
      WHERE cm.classroom_id = NEW.id AND cm.role = 'student' AND cm.user_id IS NOT NULL
    LOOP
      INSERT INTO public.notifications (user_id, title, body, kind, ts)
      VALUES (
        student_record.user_id,
        'Live Session Started!',
        'Your instructor has started a live session in "' || NEW.name || '". Click to join now.',
        'success',
        extract(epoch from now())::bigint
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_class_live ON public.classrooms;
CREATE TRIGGER on_class_live
  AFTER UPDATE OF last_live_at ON public.classrooms
  FOR EACH ROW EXECUTE FUNCTION public.handle_live_session_notification();
