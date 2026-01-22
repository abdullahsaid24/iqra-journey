-- Step 1: Backfill all linked classes - Weekend to Weekday
-- This will sync missing students but won't create duplicates
INSERT INTO students (name, email, first_name, last_name, class_id,
                      absence_level, failure_level, consecutive_absences,
                      last_lesson_status, created_at, updated_at)
SELECT DISTINCT ON (s.name, s.email, cl.weekday_class_id)
       s.name, s.email, s.first_name, s.last_name, cl.weekday_class_id,
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
)
ORDER BY s.name, s.email, cl.weekday_class_id, s.created_at ASC;

-- Step 2: Backfill all linked classes - Weekday to Weekend
INSERT INTO students (name, email, first_name, last_name, class_id,
                      absence_level, failure_level, consecutive_absences,
                      last_lesson_status, created_at, updated_at)
SELECT DISTINCT ON (s.name, s.email, cl.weekend_class_id)
       s.name, s.email, s.first_name, s.last_name, cl.weekend_class_id,
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
)
ORDER BY s.name, s.email, cl.weekend_class_id, s.created_at ASC;