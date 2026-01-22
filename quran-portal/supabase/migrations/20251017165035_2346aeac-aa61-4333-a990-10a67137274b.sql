-- Update notification_presets for weekday absence messages to include {{class_name}} placeholder
-- Only applies to junior (weekday) classes (is_adult = false)

UPDATE notification_presets 
SET content = 'Asalamu Alaikum, {{student_name}} was absent for {{class_name}} class. This is the 1st unexcused absence of the month. -Mualim',
    updated_at = now()
WHERE type = 'lesson_absent' 
  AND level = 1
  AND is_adult = false;

UPDATE notification_presets 
SET content = 'Asalamu Alaikum, {{student_name}} was absent for {{class_name}} class. This is the 2nd unexcused absence of the month. -Mualim',
    updated_at = now()
WHERE type = 'lesson_absent' 
  AND level = 2
  AND is_adult = false;

UPDATE notification_presets 
SET content = 'Asalamu Alaikum, {{student_name}} was absent for {{class_name}} class. This is the 3rd unexcused absence of the month. You need to meet with Mualim.',
    updated_at = now()
WHERE type = 'lesson_absent' 
  AND level = 3
  AND is_adult = false;