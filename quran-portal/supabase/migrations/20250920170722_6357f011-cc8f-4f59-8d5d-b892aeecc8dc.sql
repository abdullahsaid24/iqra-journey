-- Update the lessons table constraint to allow 'ahsanul_qawaid_book_1' lesson type
ALTER TABLE lessons DROP CONSTRAINT IF EXISTS lessons_lesson_type_check;

-- Add new constraint that includes the new lesson type
ALTER TABLE lessons ADD CONSTRAINT lessons_lesson_type_check 
CHECK (lesson_type IN ('current_lesson', 'goal_setting', 'ahsanul_qawaid_book_1'));