-- Disable problematic recursive trigger
DROP TRIGGER IF EXISTS trigger_linked_class_enrollment ON public.students;

-- Manually add "Student One" to Monday class by duplicating their record with new class_id
INSERT INTO public.students (
  name, first_name, last_name, email, class_id,
  absence_level, failure_level, consecutive_absences, last_lesson_status
)
SELECT 
  name, first_name, last_name, email,
  'a6184b1b-6299-4d0c-9f17-6cbf68591a35'::uuid AS class_id,
  absence_level, failure_level, consecutive_absences, last_lesson_status
FROM public.students
WHERE id = 'c4a87485-2d7b-4038-a3a2-2bb8741cd9e5'
LIMIT 1;