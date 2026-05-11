-- Migration: Unified Classroom Stability & Notifications
-- Date: 2026-05-11

-- 1. Fix RLS once and for all by using non-recursive, permissive SELECT policies
-- Discovery and visibility are key for a social learning platform.
DROP POLICY IF EXISTS "Classroom select" ON classrooms;
DROP POLICY IF EXISTS "Classrooms are discoverable" ON classrooms;
CREATE POLICY "Classrooms are discoverable" ON public.classrooms FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Member select" ON classroom_members;
DROP POLICY IF EXISTS "Students can see classmates" ON classroom_members;
DROP POLICY IF EXISTS "Public member select" ON classroom_members;
CREATE POLICY "Classroom members are visible" ON public.classroom_members FOR SELECT TO authenticated USING (true);

-- 2. Fix the Assignment Notification Trigger (student_id -> user_id)
CREATE OR REPLACE FUNCTION handle_new_assignment_notification()
RETURNS TRIGGER AS $$
DECLARE
  student_record RECORD;
  class_name TEXT;
  lecturer_id UUID;
BEGIN
  -- Get classroom details
  SELECT name, user_id INTO class_name, lecturer_id FROM classrooms WHERE id = NEW.classroom_id;

  -- Notify all enrolled students
  FOR student_record IN 
    SELECT cm.user_id 
    FROM classroom_members cm
    WHERE cm.classroom_id = NEW.classroom_id AND cm.role = 'student' AND cm.user_id IS NOT NULL
  LOOP
    INSERT INTO notifications (user_id, title, body, kind, ts)
    VALUES (
      student_record.user_id,
      'New Task: ' || NEW.title,
      'A new task has been posted in ' || class_name || '.',
      'info',
      extract(epoch from now())::bigint
    );
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Add Join Notification Trigger (Notify lecturer when a student joins)
CREATE OR REPLACE FUNCTION handle_new_member_notification()
RETURNS TRIGGER AS $$
DECLARE
  class_name TEXT;
  lecturer_id UUID;
  student_name TEXT;
BEGIN
  -- Get classroom and lecturer details
  SELECT name, user_id INTO class_name, lecturer_id FROM classrooms WHERE id = NEW.classroom_id;
  
  -- Get student name if user_id is set
  IF NEW.user_id IS NOT NULL THEN
    SELECT display_name INTO student_name FROM profiles WHERE id = NEW.user_id;
  ELSE
    student_name := NEW.email;
  END IF;

  -- Only notify if it's a student joining (not the host)
  IF NEW.role = 'student' AND lecturer_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, title, body, kind, ts)
    VALUES (
      lecturer_id,
      'New Student Enrolled',
      student_name || ' has joined your class "' || class_name || '".',
      'success',
      extract(epoch from now())::bigint
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_member_joined ON classroom_members;
CREATE TRIGGER on_member_joined
  AFTER INSERT ON classroom_members
  FOR EACH ROW EXECUTE FUNCTION handle_new_member_notification();
