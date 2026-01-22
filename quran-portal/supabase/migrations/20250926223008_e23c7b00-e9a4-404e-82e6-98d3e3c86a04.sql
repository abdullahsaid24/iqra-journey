-- Fix security issue with the new function by setting search_path
CREATE OR REPLACE FUNCTION public.handle_linked_class_enrollment()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- When a student is added to Saturday Junior, also add them to Monday
  IF NEW.class_id = '4d5d044f-7585-411f-9dd9-0522e7c7a5c7' THEN
    INSERT INTO students (
      name, email, first_name, last_name, class_id, absence_level, failure_level,
      consecutive_absences, last_lesson_status, created_at, updated_at
    ) VALUES (
      NEW.name, NEW.email, NEW.first_name, NEW.last_name,
      'a6184b1b-6299-4d0c-9f17-6cbf68591a35', -- Monday class ID
      NEW.absence_level, NEW.failure_level, NEW.consecutive_absences, 
      NEW.last_lesson_status, NEW.created_at, NEW.updated_at
    );
  END IF;
  
  -- When a student is added to Sunday Junior, also add them to Friday  
  IF NEW.class_id = '2dcc106b-adfe-4717-b64d-40135a32a5f1' THEN
    INSERT INTO students (
      name, email, first_name, last_name, class_id, absence_level, failure_level,
      consecutive_absences, last_lesson_status, created_at, updated_at
    ) VALUES (
      NEW.name, NEW.email, NEW.first_name, NEW.last_name,
      'c44e5a86-41ef-4714-90c8-542bf6fdf9e4', -- Friday class ID  
      NEW.absence_level, NEW.failure_level, NEW.consecutive_absences,
      NEW.last_lesson_status, NEW.created_at, NEW.updated_at
    );
  END IF;
  
  -- When a student is added to Monday, also add them to Saturday Junior
  IF NEW.class_id = 'a6184b1b-6299-4d0c-9f17-6cbf68591a35' THEN
    INSERT INTO students (
      name, email, first_name, last_name, class_id, absence_level, failure_level,
      consecutive_absences, last_lesson_status, created_at, updated_at
    ) VALUES (
      NEW.name, NEW.email, NEW.first_name, NEW.last_name,
      '4d5d044f-7585-411f-9dd9-0522e7c7a5c7', -- Saturday Junior class ID
      NEW.absence_level, NEW.failure_level, NEW.consecutive_absences,
      NEW.last_lesson_status, NEW.created_at, NEW.updated_at
    );
  END IF;
  
  -- When a student is added to Friday, also add them to Sunday Junior
  IF NEW.class_id = 'c44e5a86-41ef-4714-90c8-542bf6fdf9e4' THEN
    INSERT INTO students (
      name, email, first_name, last_name, class_id, absence_level, failure_level,
      consecutive_absences, last_lesson_status, created_at, updated_at
    ) VALUES (
      NEW.name, NEW.email, NEW.first_name, NEW.last_name,
      '2dcc106b-adfe-4717-b64d-40135a32a5f1', -- Sunday Junior class ID
      NEW.absence_level, NEW.failure_level, NEW.consecutive_absences,
      NEW.last_lesson_status, NEW.created_at, NEW.updated_at
    );
  END IF;
  
  RETURN NEW;
END;
$$;