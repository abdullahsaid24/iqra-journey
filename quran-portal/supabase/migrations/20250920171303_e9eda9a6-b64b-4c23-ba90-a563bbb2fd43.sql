-- Update the lessons table constraint to include 'noor_al_bayan' lesson type
ALTER TABLE lessons DROP CONSTRAINT IF EXISTS lessons_lesson_type_check;
ALTER TABLE lessons ADD CONSTRAINT lessons_lesson_type_check 
  CHECK (lesson_type IN ('current_lesson', 'goal_setting', 'ahsanul_qawaid_book_1', 'noor_al_bayan'));