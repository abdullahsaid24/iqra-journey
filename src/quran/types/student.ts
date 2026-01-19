
export interface Student {
  id: string;
  name: string;
  first_name?: string;
  last_name?: string;
  class_id?: string;
  absence_level?: number;
  consecutive_absences?: number;
  currentLesson?: {
    surah: string;
    verses: string;
  };
}

export interface StudentData {
  id: string;
  name: string;
  class_id?: string; // Already exists from previous fix
  absence_level?: number;
  consecutive_absences?: number;
  currentLesson?: {
    surah: string;
    verses: string;
  };
}

export interface LessonData {
  surah: string;
  verses: string;
  is_active: boolean;
}

export interface HomeworkAssignment {
  type: 'lesson' | 'review_near' | 'review_far';
  status: 'passed' | 'failed' | 'pending' | 'absent';
  created_at: string;
  surah: string;
  verses: string;
}

export interface MonthlyProgress {
  goal_current_lesson: string | null;
  lessons_passed: number;
  lessons_failed: number;
  review_near_passed: number;
  review_near_failed: number;
  review_far_passed: number;
  review_far_failed: number;
  active_days: number;
}

export interface StudentWithProgress extends Student {
  lessons: LessonData[];
  homework_assignments: HomeworkAssignment[];
  monthly_progress: MonthlyProgress[];
}
