-- Delete attendance records for the duplicate student
DELETE FROM weekday_attendance 
WHERE student_id = '4032fafd-b326-45e7-8860-768a1f764327';

-- Delete duplicate student records
DELETE FROM students 
WHERE email = 'sumaya.sumayamuse@iqra.com';