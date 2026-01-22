-- Create trigger to update student absence levels when weekday attendance is recorded
CREATE TRIGGER update_weekday_student_absence_level
    AFTER INSERT OR UPDATE ON weekday_attendance
    FOR EACH ROW
    EXECUTE FUNCTION update_student_absence_level();