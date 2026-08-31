-- PHASE 1 of the duplicate-student merge: make lessons and homework class-aware.
--
-- lessons and homework_assignments are keyed on student_id only. That is the
-- reason a child needs two students rows to have different homework on Monday
-- and Saturday - the duplicate rows are load bearing.
--
-- Adding class_id here, and backfilling it from the student row each record
-- currently hangs off, is what lets those duplicate rows be merged later
-- without collapsing the two days' homework into one pile.
--
-- MUST run after 20260830_student_removed_from_class.sql, because the backfill
-- uses removed_from_class_id to attribute records owned by orphaned rows.
--
-- Non-destructive: adds columns and fills them in. Nothing is deleted.

alter table public.lessons
  add column if not exists class_id uuid references public.classes(id);

alter table public.homework_assignments
  add column if not exists class_id uuid references public.classes(id);

comment on column public.lessons.class_id is
  'Class this lesson belongs to. Lessons differ per class for students attending both a weekday and weekend class.';

comment on column public.homework_assignments.class_id is
  'Class this assignment belongs to. Homework differs per class for students attending both a weekday and weekend class.';

create index if not exists idx_lessons_student_class
  on public.lessons (student_id, class_id);

create index if not exists idx_homework_assignments_student_class
  on public.homework_assignments (student_id, class_id);

-- Attribute each record to the class of the student row that owns it.
-- For rows still assigned to a class that is class_id; for orphaned rows it is
-- the class they were removed from, recovered by the previous migration.
update public.lessons l
   set class_id = coalesce(s.class_id, s.removed_from_class_id)
  from public.students s
 where s.id = l.student_id
   and l.class_id is null
   and coalesce(s.class_id, s.removed_from_class_id) is not null;

update public.homework_assignments h
   set class_id = coalesce(s.class_id, s.removed_from_class_id)
  from public.students s
 where s.id = h.student_id
   and h.class_id is null
   and coalesce(s.class_id, s.removed_from_class_id) is not null;
