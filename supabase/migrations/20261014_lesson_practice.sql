-- Lesson practice: repetition tracking for students and parents.
--
-- Replaces 20260705_merge_homework_into_lessons.sql, which used bare ADD COLUMN
-- and so could not be re-run after a partial apply. Everything here is
-- idempotent and safe to run more than once.

-- ---------------------------------------------------------------------------
-- 1. The columns the practice page reads and writes
-- ---------------------------------------------------------------------------
ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS required_repetitions integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS listen_count integer DEFAULT 0;

-- Existing rows predate the columns and come back NULL, which breaks the
-- "3 of 5" display and makes least() below return NULL.
UPDATE public.lessons SET required_repetitions = 1 WHERE required_repetitions IS NULL;
UPDATE public.lessons SET listen_count = 0 WHERE listen_count IS NULL;

ALTER TABLE public.lessons ALTER COLUMN required_repetitions SET DEFAULT 1;
ALTER TABLE public.lessons ALTER COLUMN listen_count SET DEFAULT 0;

-- ---------------------------------------------------------------------------
-- 2. Recording a listen
-- ---------------------------------------------------------------------------
-- The client previously read listen_count and wrote back count + 1. Two devices
-- practising together - a parent's phone and the student's tablet - would read
-- the same value and one listen would be lost. It was also uncapped, so a
-- lesson could report more repetitions than the teacher asked for, and the
-- client could set it to anything at all.
--
-- A single statement does the increment, caps it at the teacher's target, and
-- refuses callers who are not the student, their parent, or staff.
CREATE OR REPLACE FUNCTION public.record_lesson_listen(p_lesson_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_student_id uuid;
  v_new_count  integer;
BEGIN
  SELECT student_id INTO v_student_id
  FROM public.lessons
  WHERE id = p_lesson_id;

  IF v_student_id IS NULL THEN
    RAISE EXCEPTION 'Lesson not found';
  END IF;

  IF NOT (
    -- the student themselves, matched the way the app maps a login to a student
    EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.id = v_student_id
        AND lower(s.email) = lower(auth.email())
    )
    -- a parent the student is linked to
    OR EXISTS (
      SELECT 1 FROM public.parent_student_links psl
      WHERE psl.student_id = v_student_id
        AND psl.parent_user_id = auth.uid()
    )
    -- staff
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('admin', 'teacher')
    )
  ) THEN
    RAISE EXCEPTION 'Not allowed to record a listen for this lesson';
  END IF;

  UPDATE public.lessons
  SET listen_count = least(
        coalesce(listen_count, 0) + 1,
        greatest(coalesce(required_repetitions, 1), 1)
      )
  WHERE id = p_lesson_id
  RETURNING listen_count INTO v_new_count;

  RETURN v_new_count;
END;
$$;

REVOKE ALL ON FUNCTION public.record_lesson_listen(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.record_lesson_listen(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- 3. Let students and parents read the lesson they are practising
-- ---------------------------------------------------------------------------
-- The practice page is useless if RLS hides the lesson from the people meant to
-- use it. These are additive: they only widen SELECT, and only to the student
-- themselves and their linked parents.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables
    WHERE schemaname = 'public' AND tablename = 'lessons' AND rowsecurity
  ) THEN
    DROP POLICY IF EXISTS "Students can read their own lessons" ON public.lessons;
    CREATE POLICY "Students can read their own lessons"
      ON public.lessons FOR SELECT TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.students s
          WHERE s.id = lessons.student_id
            AND lower(s.email) = lower(auth.email())
        )
      );

    DROP POLICY IF EXISTS "Parents can read their children's lessons" ON public.lessons;
    CREATE POLICY "Parents can read their children's lessons"
      ON public.lessons FOR SELECT TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.parent_student_links psl
          WHERE psl.student_id = lessons.student_id
            AND psl.parent_user_id = auth.uid()
        )
      );
  END IF;
END $$;
