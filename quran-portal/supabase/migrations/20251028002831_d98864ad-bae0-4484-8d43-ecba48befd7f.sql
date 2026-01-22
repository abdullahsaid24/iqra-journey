-- Drop existing functions and triggers
DROP TRIGGER IF EXISTS sync_linked_class_update ON students;
DROP TRIGGER IF EXISTS sync_linked_class_deletion ON students;
DROP FUNCTION IF EXISTS handle_linked_class_update() CASCADE;
DROP FUNCTION IF EXISTS handle_linked_class_deletion() CASCADE;

-- Helper function to get ALL linked classes (not just direct counterpart)
CREATE OR REPLACE FUNCTION public.get_all_linked_classes(p_class_id uuid)
RETURNS TABLE(linked_class_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT 
    CASE 
      WHEN cl.weekend_class_id = p_class_id THEN cl.weekday_class_id
      WHEN cl.weekday_class_id = p_class_id THEN cl.weekend_class_id
    END AS linked_class_id
  FROM class_links cl
  WHERE cl.weekend_class_id = p_class_id 
     OR cl.weekday_class_id = p_class_id;
END;
$$;

-- Updated handle_linked_class_update with attendance preservation
CREATE OR REPLACE FUNCTION public.handle_linked_class_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  linked_rec RECORD;
  exists_count int;
BEGIN
  -- Handle removal/transfer FROM old class
  IF OLD.class_id IS NOT NULL AND (NEW.class_id IS NULL OR NEW.class_id <> OLD.class_id) THEN
    FOR linked_rec IN 
      SELECT linked_class_id FROM get_all_linked_classes(OLD.class_id)
    LOOP
      -- First, unlink mirrors that have attendance (preserve records)
      UPDATE students s
      SET class_id = NULL
      WHERE s.class_id = linked_rec.linked_class_id
        AND (
          (NEW.email IS NOT NULL AND s.email = NEW.email)
          OR (NEW.email IS NULL AND s.name = NEW.name)
        )
        AND EXISTS (
          SELECT 1 FROM weekday_attendance wa
          WHERE wa.student_id = s.id
        );
      
      -- Then delete mirrors that have NO attendance
      DELETE FROM students s
      WHERE s.class_id = linked_rec.linked_class_id
        AND (
          (NEW.email IS NOT NULL AND s.email = NEW.email)
          OR (NEW.email IS NULL AND s.name = NEW.name)
        )
        AND NOT EXISTS (
          SELECT 1 FROM weekday_attendance wa
          WHERE wa.student_id = s.id
        );
    END LOOP;
  END IF;

  -- Handle enrollment INTO new class
  IF NEW.class_id IS NOT NULL THEN
    FOR linked_rec IN 
      SELECT linked_class_id FROM get_all_linked_classes(NEW.class_id)
    LOOP
      -- Check if mirror already exists
      SELECT COUNT(*) INTO exists_count
      FROM students s
      WHERE s.class_id = linked_rec.linked_class_id
        AND (
          (NEW.email IS NOT NULL AND s.email = NEW.email)
          OR (NEW.email IS NULL AND s.name = NEW.name)
        );

      IF exists_count = 0 THEN
        -- Create new mirror
        INSERT INTO students (
          name, email, first_name, last_name, class_id,
          absence_level, failure_level, consecutive_absences,
          last_lesson_status, created_at, updated_at
        ) VALUES (
          NEW.name, NEW.email, NEW.first_name, NEW.last_name, linked_rec.linked_class_id,
          NEW.absence_level, NEW.failure_level, NEW.consecutive_absences,
          NEW.last_lesson_status, NEW.created_at, NEW.updated_at
        );
      ELSE
        -- Update existing mirror (in case it was previously unlinked)
        UPDATE students s
        SET name = NEW.name,
            first_name = NEW.first_name,
            last_name = NEW.last_name,
            email = COALESCE(NEW.email, s.email),
            class_id = linked_rec.linked_class_id,
            absence_level = NEW.absence_level,
            failure_level = NEW.failure_level,
            consecutive_absences = NEW.consecutive_absences,
            last_lesson_status = NEW.last_lesson_status,
            updated_at = NEW.updated_at
        WHERE (s.class_id = linked_rec.linked_class_id OR s.class_id IS NULL)
          AND (
            (NEW.email IS NOT NULL AND s.email = NEW.email)
            OR (NEW.email IS NULL AND s.name = NEW.name)
          );
      END IF;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

-- Updated handle_linked_class_deletion with attendance preservation
CREATE OR REPLACE FUNCTION public.handle_linked_class_deletion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  linked_rec RECORD;
BEGIN
  IF OLD.class_id IS NOT NULL THEN
    FOR linked_rec IN 
      SELECT linked_class_id FROM get_all_linked_classes(OLD.class_id)
    LOOP
      -- Unlink mirrors that have attendance (preserve records)
      UPDATE students s
      SET class_id = NULL
      WHERE s.class_id = linked_rec.linked_class_id
        AND (
          (OLD.email IS NOT NULL AND s.email = OLD.email)
          OR (OLD.email IS NULL AND s.name = OLD.name)
        )
        AND EXISTS (
          SELECT 1 FROM weekday_attendance wa
          WHERE wa.student_id = s.id
        );
      
      -- Delete mirrors that have NO attendance
      DELETE FROM students s
      WHERE s.class_id = linked_rec.linked_class_id
        AND (
          (OLD.email IS NOT NULL AND s.email = OLD.email)
          OR (OLD.email IS NULL AND s.name = OLD.name)
        )
        AND NOT EXISTS (
          SELECT 1 FROM weekday_attendance wa
          WHERE wa.student_id = s.id
        );
    END LOOP;
  END IF;

  RETURN OLD;
END;
$$;

-- Recreate triggers
CREATE TRIGGER sync_linked_class_update
AFTER UPDATE OF class_id ON students
FOR EACH ROW
WHEN (OLD.class_id IS DISTINCT FROM NEW.class_id)
EXECUTE FUNCTION handle_linked_class_update();

CREATE TRIGGER sync_linked_class_deletion
AFTER DELETE ON students
FOR EACH ROW
EXECUTE FUNCTION handle_linked_class_deletion();