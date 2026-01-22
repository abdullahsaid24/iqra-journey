-- Add the missing AFTER INSERT trigger for automatic class linking
DROP TRIGGER IF EXISTS trigger_linked_class_insert ON public.students;
CREATE TRIGGER trigger_linked_class_insert
AFTER INSERT ON public.students
FOR EACH ROW
EXECUTE FUNCTION handle_linked_class_enrollment();

-- One-time backfill: Copy students from Saturday Junior to Monday class
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