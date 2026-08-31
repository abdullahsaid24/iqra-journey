-- DESTRUCTIVE. Take a backup first. Run outside teaching hours.
-- Ships together with the application changes - after this runs, each child has
-- one row with one class_id, so until the app resolves rosters through
-- class_links they will not appear in the other class of the pair.
--
-- Merges duplicate student rows into one row per child.
-- Group key is (normalised name + exact set of linked parents), which keeps the
-- two different "amina bain" children apart. Survivor is the row holding the
-- most history, preferring one still assigned to a class.
--
-- Per-day homework survives because 20260830_class_scoped_lessons.sql already
-- stamped every lesson and assignment with the class it belonged to.

begin;

-- ---------------------------------------------------------------------
-- 0. Silence the triggers that would fight the merge.
--    handle_linked_class_deletion would unassign every survivor as its
--    losers are deleted; handle_linked_class_update would sweep orphans
--    back into linked classes; manage_active_lesson cascades to sibling
--    rows; update_lesson_failure_level rewrites students.failure_level.
-- ---------------------------------------------------------------------
alter table public.students              disable trigger sync_linked_class_enrollment;
alter table public.students              disable trigger sync_linked_class_update;
alter table public.students              disable trigger sync_linked_class_deletion;
alter table public.students              disable trigger trigger_auto_link_parent;
alter table public.lessons               disable trigger manage_active_lesson;
alter table public.homework_assignments  disable trigger update_lesson_failure_level_trigger;

-- ---------------------------------------------------------------------
-- 1. Decide survivors.
-- ---------------------------------------------------------------------
create temp table merge_map on commit drop as
with sp as (
  select s.id,
         lower(btrim(s.name)) as nname,
         s.class_id,
         s.created_at,
         (select array_agg(distinct l.parent_user_id::text order by l.parent_user_id::text)
            from parent_student_links l where l.student_id = s.id) as parents,
           (select count(*) from lessons x              where x.student_id = s.id)
         + (select count(*) from homework_assignments x where x.student_id = s.id)
         + (select count(*) from weekday_attendance x   where x.student_id = s.id) as n_data
  from students s
),
grp as (
  select nname, parents from sp
  where parents is not null
  group by nname, parents having count(*) > 1
),
ranked as (
  select sp.*,
         row_number() over (
           partition by sp.nname, sp.parents
           order by sp.n_data desc, (sp.class_id is not null) desc, sp.created_at asc) as rn
  from sp join grp g on g.nname = sp.nname and g.parents = sp.parents
)
select l.id as loser_id, w.id as survivor_id
from ranked l
join ranked w
  on w.nname = l.nname and w.parents = l.parents and w.rn = 1
where l.rn > 1;

create index on merge_map (loser_id);

-- ---------------------------------------------------------------------
-- 2. Repoint the tables with no uniqueness to worry about.
-- ---------------------------------------------------------------------
update lessons t              set student_id = m.survivor_id from merge_map m where t.student_id = m.loser_id;
update homework_assignments t set student_id = m.survivor_id from merge_map m where t.student_id = m.loser_id;
update homework_listen_logs t set student_id = m.survivor_id from merge_map m where t.student_id = m.loser_id;
update word_mistakes t        set student_id = m.survivor_id from merge_map m where t.student_id = m.loser_id;
update student_stats t        set student_id = m.survivor_id from merge_map m where t.student_id = m.loser_id;

-- ---------------------------------------------------------------------
-- 3. Repoint the constrained tables, keeping the survivor's row on clash.
-- ---------------------------------------------------------------------
update weekday_attendance t
   set student_id = m.survivor_id
  from merge_map m
 where t.student_id = m.loser_id
   and not exists (select 1 from weekday_attendance x
                    where x.student_id = m.survivor_id
                      and x.class_id is not distinct from t.class_id
                      and x.attendance_date = t.attendance_date);
delete from weekday_attendance t using merge_map m where t.student_id = m.loser_id;

update parent_student_links t
   set student_id = m.survivor_id
  from merge_map m
 where t.student_id = m.loser_id
   and not exists (select 1 from parent_student_links x
                    where x.student_id = m.survivor_id
                      and x.parent_user_id = t.parent_user_id);
delete from parent_student_links t using merge_map m where t.student_id = m.loser_id;

update student_feedback t
   set student_id = m.survivor_id
  from merge_map m
 where t.student_id = m.loser_id
   and not exists (select 1 from student_feedback x
                    where x.student_id = m.survivor_id and x.month = t.month);
delete from student_feedback t using merge_map m where t.student_id = m.loser_id;

-- ---------------------------------------------------------------------
-- 4. monthly_progress is unique on (student_id, month) and its columns are
--    running totals, so clashes must be summed rather than discarded.
-- ---------------------------------------------------------------------
create temp table mp_merged on commit drop as
select coalesce(m.survivor_id, mp.student_id) as student_id,
       mp.month,
       max(mp.class_id)                       as class_id,
       sum(coalesce(mp.lessons_passed,0))       as lessons_passed,
       sum(coalesce(mp.lessons_failed,0))       as lessons_failed,
       sum(coalesce(mp.review_near_passed,0))   as review_near_passed,
       sum(coalesce(mp.review_near_failed,0))   as review_near_failed,
       sum(coalesce(mp.review_far_passed,0))    as review_far_passed,
       sum(coalesce(mp.review_far_failed,0))    as review_far_failed,
       sum(coalesce(mp.pages_passed_current,0)) as pages_passed_current,
       sum(coalesce(mp.active_days,0))          as active_days
from monthly_progress mp
left join merge_map m on m.loser_id = mp.student_id
where mp.student_id in (select loser_id from merge_map)
   or mp.student_id in (select survivor_id from merge_map)
group by 1, 2;

delete from monthly_progress
 where student_id in (select loser_id from merge_map)
    or student_id in (select survivor_id from merge_map);

insert into monthly_progress (
  student_id, month, class_id, lessons_passed, lessons_failed,
  review_near_passed, review_near_failed, review_far_passed, review_far_failed,
  pages_passed_current, active_days)
select student_id, month, class_id, lessons_passed, lessons_failed,
       review_near_passed, review_near_failed, review_far_passed, review_far_failed,
       pages_passed_current, active_days
from mp_merged;

-- ---------------------------------------------------------------------
-- 5. Delete the duplicate rows.
-- ---------------------------------------------------------------------
delete from students s using merge_map m where s.id = m.loser_id;

-- ---------------------------------------------------------------------
-- 6. Park each survivor on the weekend side of its pair, so the app has a
--    consistent anchor to resolve the pair from.
-- ---------------------------------------------------------------------
update students s
   set class_id = cl.weekend_class_id
  from class_links cl
 where s.class_id = cl.weekday_class_id;

-- Give the few records whose class could not be recovered a home, so they
-- stay visible once the app filters lessons and homework by class.
update lessons l      set class_id = s.class_id from students s
 where s.id = l.student_id and l.class_id is null and s.class_id is not null;
update homework_assignments h set class_id = s.class_id from students s
 where s.id = h.student_id and h.class_id is null and s.class_id is not null;

-- ---------------------------------------------------------------------
-- 7. Stop the mirror rows ever coming back.
-- ---------------------------------------------------------------------
drop trigger if exists sync_linked_class_enrollment on public.students;
drop trigger if exists sync_linked_class_update     on public.students;
drop trigger if exists sync_linked_class_deletion   on public.students;
drop function if exists public.handle_linked_class_enrollment();
drop function if exists public.handle_linked_class_update();
drop function if exists public.handle_linked_class_deletion();

-- ---------------------------------------------------------------------
-- 8. Fix the parent auto-link. Exact name matching is why children whose
--    name had a trailing space or different capitalisation - "Semira ahmed "
--    vs "Semira Ahmed" - silently never received a parent link.
-- ---------------------------------------------------------------------
create or replace function public.auto_link_parent_for_new_student()
returns trigger
language plpgsql
as $function$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM parent_student_links WHERE student_id = NEW.id) THEN
    INSERT INTO parent_student_links (parent_user_id, student_id, phone_number, secondary_phone_number)
    SELECT DISTINCT psl.parent_user_id, NEW.id, psl.phone_number, psl.secondary_phone_number
    FROM students s
    JOIN parent_student_links psl ON psl.student_id = s.id
    WHERE lower(btrim(s.name)) = lower(btrim(NEW.name))
      AND s.id <> NEW.id
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$function$;

-- ---------------------------------------------------------------------
-- 9. Restore the triggers we kept.
-- ---------------------------------------------------------------------
alter table public.students              enable trigger trigger_auto_link_parent;
alter table public.lessons               enable trigger manage_active_lesson;
alter table public.homework_assignments  enable trigger update_lesson_failure_level_trigger;

commit;
