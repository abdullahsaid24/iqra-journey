-- Drop the existing check constraint
ALTER TABLE lessons DROP CONSTRAINT IF EXISTS lessons_lesson_type_check;

-- Add new check constraint with full_quran included
ALTER TABLE lessons ADD CONSTRAINT lessons_lesson_type_check 
CHECK (lesson_type IN ('current_lesson', 'ahsanul_qawaid_book_1', 'noor_al_bayan', 'full_quran'));