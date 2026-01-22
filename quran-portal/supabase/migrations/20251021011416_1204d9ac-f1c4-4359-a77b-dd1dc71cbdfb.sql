-- Fix class linking system to handle both INSERT and UPDATE operations
-- This will ensure students added to linked classes (like Saturday Junior → Monday) are properly mirrored

-- 1. Replace INSERT trigger to be dynamic and idempotent
CREATE OR REPLACE FUNCTION public.handle_linked_class_enrollment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  linked_class uuid;
  exists_count int;
BEGIN
  -- Find the linked class (either direction)
  SELECT CASE
           WHEN cl.weekend_class_id = NEW.class_id THEN cl.weekday_class_id
           WHEN cl.weekday_class_id = NEW.class_id THEN cl.weekend_class_id
         END
    INTO linked_class
  FROM class_links cl
  WHERE cl.weekend_class_id = NEW.class_id OR cl.weekday_class_id = NEW.class_id
  LIMIT 1;

  -- If there's a linked class, ensure the mirror exists
  IF linked_class IS NOT NULL THEN
    -- Check if student already exists in linked class (match by email if present, otherwise by name)
    SELECT COUNT(*)
      INTO exists_count
    FROM students s
    WHERE s.class_id = linked_class
      AND (
        (NEW.email IS NOT NULL AND s.email = NEW.email)
        OR (NEW.email IS NULL AND s.name = NEW.name)
      );

    -- Only insert if doesn't exist
    IF exists_count = 0 THEN
      INSERT INTO students (
        name, email, first_name, last_name, class_id,
        absence_level, failure_level, consecutive_absences,
        last_lesson_status, created_at, updated_at
      ) VALUES (
        NEW.name, NEW.email, NEW.first_name, NEW.last_name, linked_class,
        NEW.absence_level, NEW.failure_level, NEW.consecutive_absences,
        NEW.last_lesson_status, NEW.created_at, NEW.updated_at
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- 2. Create UPDATE trigger function to sync when class_id changes
CREATE OR REPLACE FUNCTION public.handle_linked_class_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  old_linked uuid;
  new_linked uuid;
  exists_count int;
BEGIN
  -- Find counterpart of OLD class_id
  SELECT CASE
           WHEN cl.weekend_class_id = OLD.class_id THEN cl.weekday_class_id
           WHEN cl.weekday_class_id = OLD.class_id THEN cl.weekend_class_id
         END
    INTO old_linked
  FROM class_links cl
  WHERE cl.weekend_class_id = OLD.class_id OR cl.weekday_class_id = OLD.class_id
  LIMIT 1;

  -- Find counterpart of NEW class_id
  SELECT CASE
           WHEN cl.weekend_class_id = NEW.class_id THEN cl.weekday_class_id
           WHEN cl.weekday_class_id = NEW.class_id THEN cl.weekend_class_id
         END
    INTO new_linked
  FROM class_links cl
  WHERE cl.weekend_class_id = NEW.class_id OR cl.weekday_class_id = NEW.class_id
  LIMIT 1;

  -- Remove old mirror if student moved away from a linked class
  IF old_linked IS NOT NULL AND (new_linked IS NULL OR new_linked <> old_linked) THEN
    DELETE FROM students s
    WHERE s.class_id = old_linked
      AND (
        (NEW.email IS NOT NULL AND s.email = NEW.email)
        OR (NEW.email IS NULL AND s.name = NEW.name)
      );
  END IF;

  -- Ensure mirror exists in new linked class
  IF new_linked IS NOT NULL THEN
    SELECT COUNT(*)
      INTO exists_count
    FROM students s
    WHERE s.class_id = new_linked
      AND (
        (NEW.email IS NOT NULL AND s.email = NEW.email)
        OR (NEW.email IS NULL AND s.name = NEW.name)
      );

    IF exists_count = 0 THEN
      -- Insert new mirror
      INSERT INTO students (
        name, email, first_name, last_name, class_id,
        absence_level, failure_level, consecutive_absences,
        last_lesson_status, created_at, updated_at
      ) VALUES (
        NEW.name, NEW.email, NEW.first_name, NEW.last_name, new_linked,
        NEW.absence_level, NEW.failure_level, NEW.consecutive_absences,
        NEW.last_lesson_status, NEW.created_at, NEW.updated_at
      );
    ELSE
      -- Update existing mirror
      UPDATE students s
      SET name = NEW.name,
          first_name = NEW.first_name,
          last_name = NEW.last_name,
          email = COALESCE(NEW.email, s.email),
          absence_level = NEW.absence_level,
          failure_level = NEW.failure_level,
          consecutive_absences = NEW.consecutive_absences,
          last_lesson_status = NEW.last_lesson_status,
          updated_at = NEW.updated_at
      WHERE s.class_id = new_linked
        AND (
          (NEW.email IS NOT NULL AND s.email = NEW.email)
          OR (NEW.email IS NULL AND s.name = NEW.name)
        );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- 3. Create the UPDATE trigger (only fires when class_id changes)
DROP TRIGGER IF EXISTS trigger_linked_class_update ON students;
CREATE TRIGGER trigger_linked_class_update
AFTER UPDATE OF class_id ON students
FOR EACH ROW
WHEN (OLD.class_id IS DISTINCT FROM NEW.class_id)
EXECUTE FUNCTION public.handle_linked_class_update();

-- 4. Backfill missing students in both directions
-- Weekend → Weekday
INSERT INTO students (name, email, first_name, last_name, class_id,
                      absence_level, failure_level, consecutive_absences,
                      last_lesson_status, created_at, updated_at)
SELECT s.name, s.email, s.first_name, s.last_name, cl.weekday_class_id,
       s.absence_level, s.failure_level, s.consecutive_absences,
       s.last_lesson_status, s.created_at, s.updated_at
FROM students s
JOIN class_links cl ON cl.weekend_class_id = s.class_id
WHERE NOT EXISTS (
  SELECT 1 FROM students t
  WHERE t.class_id = cl.weekday_class_id
    AND (
      (s.email IS NOT NULL AND t.email = s.email)
      OR (s.email IS NULL AND t.name = s.name)
    )
);

-- Weekday → Weekend
INSERT INTO students (name, email, first_name, last_name, class_id,
                      absence_level, failure_level, consecutive_absences,
                      last_lesson_status, created_at, updated_at)
SELECT s.name, s.email, s.first_name, s.last_name, cl.weekend_class_id,
       s.absence_level, s.failure_level, s.consecutive_absences,
       s.last_lesson_status, s.created_at, s.updated_at
FROM students s
JOIN class_links cl ON cl.weekday_class_id = s.class_id
WHERE NOT EXISTS (
  SELECT 1 FROM students t
  WHERE t.class_id = cl.weekend_class_id
    AND (
      (s.email IS NOT NULL AND t.email = s.email)
      OR (s.email IS NULL AND t.name = s.name)
    )
);