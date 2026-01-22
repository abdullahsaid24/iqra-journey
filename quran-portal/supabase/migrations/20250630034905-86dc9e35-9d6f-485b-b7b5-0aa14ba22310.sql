
-- Assign default homework (Al-Fatiha 1-7) to students who don't have any lessons
INSERT INTO lessons (student_id, surah, verses, is_active, lesson_type, created_at)
SELECT 
    s.id as student_id,
    'Al-Fatihah' as surah,
    '1-7' as verses,
    true as is_active,
    'current_lesson' as lesson_type,
    now() as created_at
FROM students s
LEFT JOIN lessons l ON s.id = l.student_id AND l.is_active = true
WHERE l.id IS NULL;
