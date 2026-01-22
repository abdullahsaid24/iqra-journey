-- =====================================================
-- STEP 1: Add new class links for Senior classes
-- =====================================================
INSERT INTO class_links (weekday_class_id, weekend_class_id) VALUES
('74410dba-7cee-41ab-81c0-a8bbe3e7a042', 'ffe5f60a-7a8d-46a5-be13-c1a22e71c485'), -- Wednesday ↔️ Sunday Senior
('ee5cf54f-e467-4654-8d7e-051a259d27e4', 'c462afc7-9c2f-4bdf-8e33-6baa638307a1'); -- Thursday ↔️ Saturday Senior

-- =====================================================
-- STEP 2: Update INSERT trigger for Senior classes
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_linked_class_enrollment()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- === JUNIOR CLASSES (existing) ===
  
  -- Saturday Junior → Monday
  IF NEW.class_id = '4d5d044f-7585-411f-9dd9-0522e7c7a5c7' THEN
    INSERT INTO students (
      name, email, first_name, last_name, class_id, absence_level, failure_level,
      consecutive_absences, last_lesson_status, created_at, updated_at
    ) VALUES (
      NEW.name, NEW.email, NEW.first_name, NEW.last_name,
      'a6184b1b-6299-4d0c-9f17-6cbf68591a35',
      NEW.absence_level, NEW.failure_level, NEW.consecutive_absences, 
      NEW.last_lesson_status, NEW.created_at, NEW.updated_at
    );
  END IF;
  
  -- Sunday Junior → Friday
  IF NEW.class_id = '2dcc106b-adfe-4717-b64d-40135a32a5f1' THEN
    INSERT INTO students (
      name, email, first_name, last_name, class_id, absence_level, failure_level,
      consecutive_absences, last_lesson_status, created_at, updated_at
    ) VALUES (
      NEW.name, NEW.email, NEW.first_name, NEW.last_name,
      'c44e5a86-41ef-4714-90c8-542bf6fdf9e4',
      NEW.absence_level, NEW.failure_level, NEW.consecutive_absences,
      NEW.last_lesson_status, NEW.created_at, NEW.updated_at
    );
  END IF;
  
  -- Monday → Saturday Junior
  IF NEW.class_id = 'a6184b1b-6299-4d0c-9f17-6cbf68591a35' THEN
    INSERT INTO students (
      name, email, first_name, last_name, class_id, absence_level, failure_level,
      consecutive_absences, last_lesson_status, created_at, updated_at
    ) VALUES (
      NEW.name, NEW.email, NEW.first_name, NEW.last_name,
      '4d5d044f-7585-411f-9dd9-0522e7c7a5c7',
      NEW.absence_level, NEW.failure_level, NEW.consecutive_absences,
      NEW.last_lesson_status, NEW.created_at, NEW.updated_at
    );
  END IF;
  
  -- Friday → Sunday Junior
  IF NEW.class_id = 'c44e5a86-41ef-4714-90c8-542bf6fdf9e4' THEN
    INSERT INTO students (
      name, email, first_name, last_name, class_id, absence_level, failure_level,
      consecutive_absences, last_lesson_status, created_at, updated_at
    ) VALUES (
      NEW.name, NEW.email, NEW.first_name, NEW.last_name,
      '2dcc106b-adfe-4717-b64d-40135a32a5f1',
      NEW.absence_level, NEW.failure_level, NEW.consecutive_absences,
      NEW.last_lesson_status, NEW.created_at, NEW.updated_at
    );
  END IF;
  
  -- === SENIOR CLASSES (new) ===
  
  -- Sunday Senior → Wednesday
  IF NEW.class_id = 'ffe5f60a-7a8d-46a5-be13-c1a22e71c485' THEN
    INSERT INTO students (
      name, email, first_name, last_name, class_id, absence_level, failure_level,
      consecutive_absences, last_lesson_status, created_at, updated_at
    ) VALUES (
      NEW.name, NEW.email, NEW.first_name, NEW.last_name,
      '74410dba-7cee-41ab-81c0-a8bbe3e7a042',
      NEW.absence_level, NEW.failure_level, NEW.consecutive_absences,
      NEW.last_lesson_status, NEW.created_at, NEW.updated_at
    );
  END IF;
  
  -- Wednesday → Sunday Senior
  IF NEW.class_id = '74410dba-7cee-41ab-81c0-a8bbe3e7a042' THEN
    INSERT INTO students (
      name, email, first_name, last_name, class_id, absence_level, failure_level,
      consecutive_absences, last_lesson_status, created_at, updated_at
    ) VALUES (
      NEW.name, NEW.email, NEW.first_name, NEW.last_name,
      'ffe5f60a-7a8d-46a5-be13-c1a22e71c485',
      NEW.absence_level, NEW.failure_level, NEW.consecutive_absences,
      NEW.last_lesson_status, NEW.created_at, NEW.updated_at
    );
  END IF;
  
  -- Saturday Senior → Thursday
  IF NEW.class_id = 'c462afc7-9c2f-4bdf-8e33-6baa638307a1' THEN
    INSERT INTO students (
      name, email, first_name, last_name, class_id, absence_level, failure_level,
      consecutive_absences, last_lesson_status, created_at, updated_at
    ) VALUES (
      NEW.name, NEW.email, NEW.first_name, NEW.last_name,
      'ee5cf54f-e467-4654-8d7e-051a259d27e4',
      NEW.absence_level, NEW.failure_level, NEW.consecutive_absences,
      NEW.last_lesson_status, NEW.created_at, NEW.updated_at
    );
  END IF;
  
  -- Thursday → Saturday Senior
  IF NEW.class_id = 'ee5cf54f-e467-4654-8d7e-051a259d27e4' THEN
    INSERT INTO students (
      name, email, first_name, last_name, class_id, absence_level, failure_level,
      consecutive_absences, last_lesson_status, created_at, updated_at
    ) VALUES (
      NEW.name, NEW.email, NEW.first_name, NEW.last_name,
      'c462afc7-9c2f-4bdf-8e33-6baa638307a1',
      NEW.absence_level, NEW.failure_level, NEW.consecutive_absences,
      NEW.last_lesson_status, NEW.created_at, NEW.updated_at
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- =====================================================
-- STEP 3: Create DELETE trigger function
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_linked_class_deletion()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  linked_class_id uuid;
BEGIN
  -- Check if deleted student's class is a weekend class with a weekday link
  SELECT weekday_class_id INTO linked_class_id
  FROM class_links
  WHERE weekend_class_id = OLD.class_id;
  
  IF FOUND THEN
    -- Delete from linked weekday class
    DELETE FROM students
    WHERE class_id = linked_class_id
    AND email = OLD.email
    AND name = OLD.name;
    
    RETURN OLD;
  END IF;
  
  -- Check if deleted student's class is a weekday class with a weekend link
  SELECT weekend_class_id INTO linked_class_id
  FROM class_links
  WHERE weekday_class_id = OLD.class_id;
  
  IF FOUND THEN
    -- Delete from linked weekend class
    DELETE FROM students
    WHERE class_id = linked_class_id
    AND email = OLD.email
    AND name = OLD.name;
    
    RETURN OLD;
  END IF;
  
  RETURN OLD;
END;
$$;

-- =====================================================
-- STEP 4: Attach DELETE trigger to students table
-- =====================================================
DROP TRIGGER IF EXISTS handle_student_deletion ON students;

CREATE TRIGGER handle_student_deletion
AFTER DELETE ON students
FOR EACH ROW
EXECUTE FUNCTION handle_linked_class_deletion();

-- =====================================================
-- STEP 5: Backfill existing students
-- =====================================================

-- Copy Sunday Senior students → Wednesday
INSERT INTO students (
  name, email, first_name, last_name, class_id, absence_level, failure_level,
  consecutive_absences, last_lesson_status, created_at, updated_at
)
SELECT 
  name, email, first_name, last_name,
  '74410dba-7cee-41ab-81c0-a8bbe3e7a042' as class_id,
  absence_level, failure_level, consecutive_absences, last_lesson_status,
  created_at, updated_at
FROM students 
WHERE class_id = 'ffe5f60a-7a8d-46a5-be13-c1a22e71c485'
ON CONFLICT DO NOTHING;

-- Copy Saturday Senior students → Thursday
INSERT INTO students (
  name, email, first_name, last_name, class_id, absence_level, failure_level,
  consecutive_absences, last_lesson_status, created_at, updated_at
)
SELECT 
  name, email, first_name, last_name,
  'ee5cf54f-e467-4654-8d7e-051a259d27e4' as class_id,
  absence_level, failure_level, consecutive_absences, last_lesson_status,
  created_at, updated_at
FROM students 
WHERE class_id = 'c462afc7-9c2f-4bdf-8e33-6baa638307a1'
ON CONFLICT DO NOTHING;