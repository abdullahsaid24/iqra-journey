-- Step 1: Delete duplicate attendance records that would conflict with the main record
-- For Friday class duplicates
DELETE FROM weekday_attendance 
WHERE student_id IN ('cf690676-9c08-4b37-8c4c-2e7496d21215', 'd2a3693a-2ca8-4bc0-8332-cd17a3e2429d')
AND (student_id, class_id, attendance_date) IN (
  SELECT wa.student_id, wa.class_id, wa.attendance_date
  FROM weekday_attendance wa
  WHERE wa.student_id IN ('cf690676-9c08-4b37-8c4c-2e7496d21215', 'd2a3693a-2ca8-4bc0-8332-cd17a3e2429d')
  AND EXISTS (
    SELECT 1 FROM weekday_attendance wa2
    WHERE wa2.student_id = '17be6942-e2c5-4df5-ba7c-a915ef20dfff'
    AND wa2.class_id = wa.class_id
    AND wa2.attendance_date = wa.attendance_date
  )
);

-- For Sunday Junior class duplicate
DELETE FROM weekday_attendance 
WHERE student_id = '84b5eeb4-6766-42d8-9507-edaeada91094'
AND (student_id, class_id, attendance_date) IN (
  SELECT wa.student_id, wa.class_id, wa.attendance_date
  FROM weekday_attendance wa
  WHERE wa.student_id = '84b5eeb4-6766-42d8-9507-edaeada91094'
  AND EXISTS (
    SELECT 1 FROM weekday_attendance wa2
    WHERE wa2.student_id = '5b780bdb-b6cd-4328-b0fb-fd3554234dcc'
    AND wa2.class_id = wa.class_id
    AND wa2.attendance_date = wa.attendance_date
  )
);

-- Step 2: Move remaining non-conflicting attendance records
UPDATE weekday_attendance 
SET student_id = '17be6942-e2c5-4df5-ba7c-a915ef20dfff'
WHERE student_id IN ('cf690676-9c08-4b37-8c4c-2e7496d21215', 'd2a3693a-2ca8-4bc0-8332-cd17a3e2429d');

UPDATE weekday_attendance 
SET student_id = '5b780bdb-b6cd-4328-b0fb-fd3554234dcc'
WHERE student_id = '84b5eeb4-6766-42d8-9507-edaeada91094';

-- Step 3: Move homework assignments (no unique constraint issue)
UPDATE homework_assignments
SET student_id = '17be6942-e2c5-4df5-ba7c-a915ef20dfff'
WHERE student_id IN ('cf690676-9c08-4b37-8c4c-2e7496d21215', 'd2a3693a-2ca8-4bc0-8332-cd17a3e2429d');

UPDATE homework_assignments
SET student_id = '5b780bdb-b6cd-4328-b0fb-fd3554234dcc'
WHERE student_id = '84b5eeb4-6766-42d8-9507-edaeada91094';

-- Step 4: Move lessons
UPDATE lessons
SET student_id = '17be6942-e2c5-4df5-ba7c-a915ef20dfff'
WHERE student_id IN ('cf690676-9c08-4b37-8c4c-2e7496d21215', 'd2a3693a-2ca8-4bc0-8332-cd17a3e2429d');

UPDATE lessons
SET student_id = '5b780bdb-b6cd-4328-b0fb-fd3554234dcc'
WHERE student_id = '84b5eeb4-6766-42d8-9507-edaeada91094';

-- Step 5: Move monthly_progress
UPDATE monthly_progress
SET student_id = '17be6942-e2c5-4df5-ba7c-a915ef20dfff'
WHERE student_id IN ('cf690676-9c08-4b37-8c4c-2e7496d21215', 'd2a3693a-2ca8-4bc0-8332-cd17a3e2429d');

UPDATE monthly_progress
SET student_id = '5b780bdb-b6cd-4328-b0fb-fd3554234dcc'
WHERE student_id = '84b5eeb4-6766-42d8-9507-edaeada91094';

-- Step 6: Delete duplicate student records
DELETE FROM students 
WHERE id IN ('cf690676-9c08-4b37-8c4c-2e7496d21215', 'd2a3693a-2ca8-4bc0-8332-cd17a3e2429d', '84b5eeb4-6766-42d8-9507-edaeada91094');