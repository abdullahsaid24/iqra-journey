-- Fix auto-removal trigger to properly calculate consecutive absences
-- from ACTUAL attendance records instead of a running counter
-- 
-- Problems fixed:
-- 1. Running counter could double-increment on upsert (teacher re-submits same day)
-- 2. Counter didn't verify absences were truly on consecutive dates
-- 3. Threshold changed from 4 to 3 per requirements
--
-- New approach: Recalculate the consecutive absence streak from the most recent
-- attendance records every time, making it idempotent and accurate.

CREATE OR REPLACE FUNCTION public.update_student_absence_level()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    monthly_absences_count integer;
    consecutive_count integer;
BEGIN
  -- Calculate ACTUAL consecutive absences from attendance records.
  -- Counts the unbroken streak of 'absent' from the most recent date backward.
  -- Recalculated every time so upserts and re-submissions cannot cause errors.
  -- Only considers records from 2026-04-19 onward (clean slate).
  WITH ranked AS (
    SELECT 
      status,
      ROW_NUMBER() OVER (ORDER BY attendance_date DESC) as rn
    FROM weekday_attendance
    WHERE student_id = NEW.student_id
      AND class_id = NEW.class_id
      AND attendance_date >= '2026-04-19'::date
  ),
  first_break AS (
    SELECT MIN(rn) as pos FROM ranked WHERE status != 'absent'
  )
  SELECT COALESCE(
    -- If there's a non-absent record, streak = its position - 1
    (SELECT pos - 1 FROM first_break WHERE pos IS NOT NULL),
    -- If ALL records are absent, streak = total number of records
    (SELECT COUNT(*) FROM ranked)
  ) INTO consecutive_count;

  -- Default to 0 if no records exist at all
  consecutive_count := COALESCE(consecutive_count, 0);

  -- Count total absences for this student in this class in the current month
  SELECT COUNT(*) INTO monthly_absences_count
  FROM weekday_attendance
  WHERE student_id = NEW.student_id
    AND class_id = NEW.class_id
    AND status = 'absent'
    AND attendance_date >= date_trunc('month', CURRENT_DATE)
    AND attendance_date < date_trunc('month', CURRENT_DATE) + interval '1 month';

  -- Update student record with recalculated values
  UPDATE students
  SET 
    consecutive_absences = consecutive_count,
    absence_level = CASE 
      WHEN monthly_absences_count >= 3 THEN 3
      WHEN monthly_absences_count >= 1 THEN 2
      ELSE 1
    END,
    -- AUTO-REMOVE: clear class_id after 3 consecutive absences
    class_id = CASE 
      WHEN consecutive_count >= 3 THEN NULL 
      ELSE class_id 
    END
  WHERE id = NEW.student_id;
  
  RETURN NEW;
END;
$$;
