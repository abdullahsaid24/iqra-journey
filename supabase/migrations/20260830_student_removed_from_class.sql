-- Fixes weekday/weekend history being swapped when a student is removed and re-added.
--
-- Removing a student sets students.class_id = NULL rather than deleting the row,
-- so a student who has been removed and re-added several times accumulates
-- several unassigned rows. The re-add path then matched those rows on name only,
-- with LIMIT 1 and no ORDER BY, so Postgres returned an arbitrary one. If it
-- picked the row holding (say) the Monday history, that history was reattached
-- to the Saturday class.
--
-- Recording the class a row was removed from makes the reconnect deterministic.

alter table public.students
  add column if not exists removed_from_class_id uuid references public.classes(id);

comment on column public.students.removed_from_class_id is
  'Class this row was last removed from. Used to reconnect the correct record on re-add. NULL while the student is assigned to a class.';

create index if not exists idx_students_removed_from_class
  on public.students (removed_from_class_id)
  where class_id is null;

-- Backfill existing orphans from their own attendance history.
-- weekday_attendance already carries class_id, so the class each orphaned row
-- actually belonged to is recoverable: take the class it was marked in most
-- often, breaking ties on the most recent attendance date.
with best as (
  select w.student_id,
         w.class_id,
         row_number() over (
           partition by w.student_id
           order by count(*) desc, max(w.attendance_date) desc, w.class_id
         ) as rn
  from public.weekday_attendance w
  join public.students s on s.id = w.student_id
  where s.class_id is null
  group by w.student_id, w.class_id
)
update public.students s
   set removed_from_class_id = b.class_id
  from best b
 where b.student_id = s.id
   and b.rn = 1
   and s.class_id is null
   and s.removed_from_class_id is null;
