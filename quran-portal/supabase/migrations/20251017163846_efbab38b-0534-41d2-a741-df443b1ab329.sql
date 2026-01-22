-- Synchronize Sunday Junior ↔️ Friday classes
-- This fixes the 2-student discrepancy between these linked classes

-- Copy students from Friday to Sunday Junior (if they don't exist)
INSERT INTO students (
  name, email, first_name, last_name, class_id, absence_level, failure_level,
  consecutive_absences, last_lesson_status, created_at, updated_at
)
SELECT 
  s.name, s.email, s.first_name, s.last_name,
  '2dcc106b-adfe-4717-b64d-40135a32a5f1' as class_id, -- Sunday Junior
  s.absence_level, s.failure_level, s.consecutive_absences, 
  s.last_lesson_status, s.created_at, s.updated_at
FROM students s
WHERE s.class_id = 'c44e5a86-41ef-4714-90c8-542bf6fdf9e4' -- Friday
AND NOT EXISTS (
  SELECT 1 FROM students s2 
  WHERE s2.class_id = '2dcc106b-adfe-4717-b64d-40135a32a5f1' -- Sunday Junior
  AND s2.email = s.email
  AND s2.name = s.name
)
ON CONFLICT DO NOTHING;

-- Copy students from Sunday Junior to Friday (if they don't exist)
INSERT INTO students (
  name, email, first_name, last_name, class_id, absence_level, failure_level,
  consecutive_absences, last_lesson_status, created_at, updated_at
)
SELECT 
  s.name, s.email, s.first_name, s.last_name,
  'c44e5a86-41ef-4714-90c8-542bf6fdf9e4' as class_id, -- Friday
  s.absence_level, s.failure_level, s.consecutive_absences,
  s.last_lesson_status, s.created_at, s.updated_at
FROM students s
WHERE s.class_id = '2dcc106b-adfe-4717-b64d-40135a32a5f1' -- Sunday Junior
AND NOT EXISTS (
  SELECT 1 FROM students s2 
  WHERE s2.class_id = 'c44e5a86-41ef-4714-90c8-542bf6fdf9e4' -- Friday
  AND s2.email = s.email
  AND s2.name = s.name
)
ON CONFLICT DO NOTHING;