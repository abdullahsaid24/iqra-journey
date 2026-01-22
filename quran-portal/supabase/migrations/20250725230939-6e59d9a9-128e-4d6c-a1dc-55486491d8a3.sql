-- Insert default repeat lesson notification presets for parents
INSERT INTO notification_presets (type, content, level, is_adult, is_default) VALUES 
('lesson_repeat', '{{student_name}} is repeating their lesson on {{lesson}}. Please ensure they practice at home. Contact us at (780) 990-7823 if you have questions.', 1, false, true),
('lesson_repeat', '{{student_name}} is repeating their lesson on {{lesson}}. This is the second time repeating this lesson. Please ensure extra practice at home. Contact us at (780) 990-7823 if you need help.', 2, false, true),
('lesson_repeat', '{{student_name}} is repeating their lesson on {{lesson}} for the third time. Please contact us at (780) 990-7823 to discuss additional support.', 3, false, true);

-- Insert default repeat lesson notification presets for adult students
INSERT INTO notification_presets (type, content, level, is_adult, is_default) VALUES 
('lesson_repeat', 'You are repeating your lesson on {{lesson}}. Please review the verses before your next class. Contact us at (780) 990-7823 if you have questions.', 1, true, true),
('lesson_repeat', 'You are repeating your lesson on {{lesson}}. This is the second time repeating this lesson. Please ensure extra practice before your next class. Contact us at (780) 990-7823 if you need help.', 2, true, true),
('lesson_repeat', 'You are repeating your lesson on {{lesson}} for the third time. Please contact us at (780) 990-7823 to discuss additional support.', 3, true, true);