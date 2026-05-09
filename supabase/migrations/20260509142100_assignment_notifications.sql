-- Migration: Automated Assignment Notifications
-- Date: 2026-05-09

-- 1. Function to handle assignment notifications (In-app + Email)
CREATE OR REPLACE FUNCTION handle_new_assignment_notification()
RETURNS TRIGGER AS $$
DECLARE
  student_record RECORD;
  class_name TEXT;
BEGIN
  -- Get classroom name
  SELECT name INTO class_name FROM classrooms WHERE id = NEW.classroom_id;

  -- 1. Create In-app Notifications for all enrolled students
  FOR student_record IN 
    SELECT cm.student_id, p.display_name, au.email 
    FROM classroom_members cm
    JOIN profiles p ON cm.student_id = p.id
    JOIN auth.users au ON cm.student_id = au.id
    WHERE cm.classroom_id = NEW.classroom_id AND cm.role = 'student'
  LOOP
    INSERT INTO notifications (user_id, title, body, kind, ts)
    VALUES (
      student_record.student_id,
      'New Task: ' || NEW.title,
      'A new ' || NEW.type || ' has been posted in ' || class_name || '.',
      'info',
      extract(epoch from now())::bigint
    );
  END LOOP;

  -- 2. Trigger Email Notification (Via Edge Function)
  -- We'll use the http extension to call our Edge Function asynchronously
  -- Note: This requires the 'http' or 'net' extension to be enabled in Supabase
  PERFORM
    net.http_post(
      url := 'https://' || current_setting('request.headers')::json->>'host' || '/functions/v1/notify-students',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := jsonb_build_object(
        'assignment_id', NEW.id,
        'classroom_id', NEW.classroom_id,
        'title', NEW.title,
        'type', NEW.type,
        'class_name', class_name
      )::text
    );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create the Trigger
DROP TRIGGER IF EXISTS on_assignment_created ON classroom_assignments;
CREATE TRIGGER on_assignment_created
  AFTER INSERT ON classroom_assignments
  FOR EACH ROW EXECUTE FUNCTION handle_new_assignment_notification();
