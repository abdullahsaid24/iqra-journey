export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      adult_students: {
        Row: {
          class_id: string | null
          created_at: string | null
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          phone_number: string | null
          updated_at: string | null
        }
        Insert: {
          class_id?: string | null
          created_at?: string | null
          email: string
          first_name?: string | null
          id: string
          last_name?: string | null
          phone_number?: string | null
          updated_at?: string | null
        }
        Update: {
          class_id?: string | null
          created_at?: string | null
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone_number?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "adult_students_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      class_links: {
        Row: {
          created_at: string | null
          id: string
          weekday_class_id: string
          weekend_class_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          weekday_class_id: string
          weekend_class_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          weekday_class_id?: string
          weekend_class_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_links_weekday_class_id_fkey"
            columns: ["weekday_class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_links_weekend_class_id_fkey"
            columns: ["weekend_class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      class_notification_templates: {
        Row: {
          class_id: string
          content: string
          created_at: string
          id: string
          type: string
          updated_at: string
        }
        Insert: {
          class_id: string
          content: string
          created_at?: string
          id?: string
          type: string
          updated_at?: string
        }
        Update: {
          class_id?: string
          content?: string
          created_at?: string
          id?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_notification_templates_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      class_teachers: {
        Row: {
          class_id: string | null
          created_at: string
          id: string
          user_id: string | null
        }
        Insert: {
          class_id?: string | null
          created_at?: string
          id?: string
          user_id?: string | null
        }
        Update: {
          class_id?: string | null
          created_at?: string
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "class_teachers_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      homework_assignments: {
        Row: {
          assigned_by: string
          created_at: string
          id: string
          lesson_id: string | null
          status: string | null
          student_id: string
          surah: string
          type: string | null
          updated_at: string
          verses: string
        }
        Insert: {
          assigned_by: string
          created_at?: string
          id?: string
          lesson_id?: string | null
          status?: string | null
          student_id: string
          surah: string
          type?: string | null
          updated_at?: string
          verses: string
        }
        Update: {
          assigned_by?: string
          created_at?: string
          id?: string
          lesson_id?: string | null
          status?: string | null
          student_id?: string
          surah?: string
          type?: string | null
          updated_at?: string
          verses?: string
        }
        Relationships: [
          {
            foreignKeyName: "homework_assignments_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homework_assignments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          lesson_type: string | null
          order: number | null
          student_id: string | null
          surah: string
          verses: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          lesson_type?: string | null
          order?: number | null
          student_id?: string | null
          surah: string
          verses: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          lesson_type?: string | null
          order?: number | null
          student_id?: string | null
          surah?: string
          verses?: string
        }
        Relationships: [
          {
            foreignKeyName: "lessons_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_progress: {
        Row: {
          active_days: number | null
          class_id: string | null
          created_at: string
          goal_current_lesson: string | null
          goal_direction: string | null
          goal_percentage: number | null
          goal_previous_month: string | null
          goal_range_end: string | null
          goal_range_start: string | null
          id: string
          lessons_failed: number | null
          lessons_passed: number | null
          month: string
          pages_passed_current: number | null
          review_far_failed: number | null
          review_far_passed: number | null
          review_near_failed: number | null
          review_near_passed: number | null
          student_id: string
          total_progress_percentage: number | null
          total_verses: number | null
          updated_at: string
        }
        Insert: {
          active_days?: number | null
          class_id?: string | null
          created_at?: string
          goal_current_lesson?: string | null
          goal_direction?: string | null
          goal_percentage?: number | null
          goal_previous_month?: string | null
          goal_range_end?: string | null
          goal_range_start?: string | null
          id?: string
          lessons_failed?: number | null
          lessons_passed?: number | null
          month: string
          pages_passed_current?: number | null
          review_far_failed?: number | null
          review_far_passed?: number | null
          review_near_failed?: number | null
          review_near_passed?: number | null
          student_id: string
          total_progress_percentage?: number | null
          total_verses?: number | null
          updated_at?: string
        }
        Update: {
          active_days?: number | null
          class_id?: string | null
          created_at?: string
          goal_current_lesson?: string | null
          goal_direction?: string | null
          goal_percentage?: number | null
          goal_previous_month?: string | null
          goal_range_end?: string | null
          goal_range_start?: string | null
          id?: string
          lessons_failed?: number | null
          lessons_passed?: number | null
          month?: string
          pages_passed_current?: number | null
          review_far_failed?: number | null
          review_far_passed?: number | null
          review_near_failed?: number | null
          review_near_passed?: number | null
          student_id?: string
          total_progress_percentage?: number | null
          total_verses?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "monthly_progress_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monthly_progress_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          created_at: string | null
          homework_assigned: boolean | null
          id: string
          lesson_fail: boolean | null
          lesson_pass: boolean | null
          parent_user_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          homework_assigned?: boolean | null
          id?: string
          lesson_fail?: boolean | null
          lesson_pass?: boolean | null
          parent_user_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          homework_assigned?: boolean | null
          id?: string
          lesson_fail?: boolean | null
          lesson_pass?: boolean | null
          parent_user_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      notification_presets: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_adult: boolean | null
          is_default: boolean
          level: number | null
          type: string
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_adult?: boolean | null
          is_default?: boolean
          level?: number | null
          type: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_adult?: boolean | null
          is_default?: boolean
          level?: number | null
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      notification_templates: {
        Row: {
          content: string
          created_at: string
          id: string
          type: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          type: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      parent_student_links: {
        Row: {
          created_at: string
          id: string
          parent_user_id: string
          phone_number: string | null
          secondary_phone_number: string | null
          student_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          parent_user_id: string
          phone_number?: string | null
          secondary_phone_number?: string | null
          student_id: string
        }
        Update: {
          created_at?: string
          id?: string
          parent_user_id?: string
          phone_number?: string | null
          secondary_phone_number?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "parent_student_links_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      registration_students: {
        Row: {
          age: number
          created_at: string
          id: string
          name: string
          registration_id: string | null
        }
        Insert: {
          age: number
          created_at?: string
          id?: string
          name: string
          registration_id?: string | null
        }
        Update: {
          age?: number
          created_at?: string
          id?: string
          name?: string
          registration_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "registration_students_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      registrations: {
        Row: {
          created_at: string
          email: string
          id: string
          parent_name: string | null
          payment_status: string
          phone: string
          registration_type: Database["public"]["Enums"]["registration_type"]
          status: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          parent_name?: string | null
          payment_status?: string
          phone: string
          registration_type: Database["public"]["Enums"]["registration_type"]
          status?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          parent_name?: string | null
          payment_status?: string
          phone?: string
          registration_type?: Database["public"]["Enums"]["registration_type"]
          status?: string
        }
        Relationships: []
      }
      student_feedback: {
        Row: {
          created_at: string
          feedback_text: string
          id: string
          month: string
          student_id: string
          teacher_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          feedback_text: string
          id?: string
          month: string
          student_id: string
          teacher_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          feedback_text?: string
          id?: string
          month?: string
          student_id?: string
          teacher_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_feedback_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_stats: {
        Row: {
          class_id: string | null
          created_at: string | null
          cumulative_active_days: number | null
          id: string
          lessons_completed: number | null
          passing_rate: number | null
          student_id: string | null
          teacher_feedback: string | null
          total_mistakes: number | null
          total_verses_read: number | null
          updated_at: string | null
        }
        Insert: {
          class_id?: string | null
          created_at?: string | null
          cumulative_active_days?: number | null
          id?: string
          lessons_completed?: number | null
          passing_rate?: number | null
          student_id?: string | null
          teacher_feedback?: string | null
          total_mistakes?: number | null
          total_verses_read?: number | null
          updated_at?: string | null
        }
        Update: {
          class_id?: string | null
          created_at?: string | null
          cumulative_active_days?: number | null
          id?: string
          lessons_completed?: number | null
          passing_rate?: number | null
          student_id?: string | null
          teacher_feedback?: string | null
          total_mistakes?: number | null
          total_verses_read?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_stats_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_stats_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          absence_level: number
          class_id: string | null
          consecutive_absences: number
          created_at: string
          email: string | null
          failure_level: number
          first_name: string | null
          id: string
          last_lesson_status: string | null
          last_name: string | null
          name: string
          updated_at: string
        }
        Insert: {
          absence_level?: number
          class_id?: string | null
          consecutive_absences?: number
          created_at?: string
          email?: string | null
          failure_level?: number
          first_name?: string | null
          id?: string
          last_lesson_status?: string | null
          last_name?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          absence_level?: number
          class_id?: string | null
          consecutive_absences?: number
          created_at?: string
          email?: string | null
          failure_level?: number
          first_name?: string | null
          id?: string
          last_lesson_status?: string | null
          last_name?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_students_class"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      weekday_attendance: {
        Row: {
          attendance_date: string
          class_id: string
          created_at: string | null
          created_by: string
          id: string
          note: string | null
          status: string
          student_id: string
        }
        Insert: {
          attendance_date: string
          class_id: string
          created_at?: string | null
          created_by: string
          id?: string
          note?: string | null
          status?: string
          student_id: string
        }
        Update: {
          attendance_date?: string
          class_id?: string
          created_at?: string | null
          created_by?: string
          id?: string
          note?: string | null
          status?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekday_attendance_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weekday_attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      weekday_notification_presets: {
        Row: {
          class_id: string | null
          content: string
          created_at: string | null
          id: string
          type: string
          updated_at: string | null
        }
        Insert: {
          class_id?: string | null
          content: string
          created_at?: string | null
          id?: string
          type: string
          updated_at?: string | null
        }
        Update: {
          class_id?: string | null
          content?: string
          created_at?: string | null
          id?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "weekday_notification_presets_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      word_mistakes: {
        Row: {
          ayah: number
          created_at: string
          id: string
          student_id: string
          surah: string
          word_position: number
          word_text: string
        }
        Insert: {
          ayah: number
          created_at?: string
          id?: string
          student_id: string
          surah: string
          word_position: number
          word_text: string
        }
        Update: {
          ayah?: number
          created_at?: string
          id?: string
          student_id?: string
          surah?: string
          word_position?: number
          word_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "word_mistakes_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      linked_classes_view: {
        Row: {
          weekday_class_id: string | null
          weekday_class_name: string | null
          weekend_class_id: string | null
          weekend_class_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "class_links_weekday_class_id_fkey"
            columns: ["weekday_class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_links_weekend_class_id_fkey"
            columns: ["weekend_class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      calculate_pages_in_range: {
        Args: { p_surah: string; p_verses: string }
        Returns: number
      }
      delete_user: {
        Args: { user_id_to_delete: string }
        Returns: undefined
      }
      get_latest_assignments: {
        Args: { p_student_id: string }
        Returns: {
          id: string
          student_id: string
          type: string
          surah: string
          verses: string
          status: string
          created_at: string
        }[]
      }
      get_student_by_email: {
        Args: { p_email: string }
        Returns: string
      }
      get_student_teacher_info: {
        Args: { student_id: string }
        Returns: {
          student_name: string
          class_id: string
          teacher_user_id: string
        }[]
      }
      get_user_email: {
        Args: { user_id: string }
        Returns: string
      }
      has_role: {
        Args: { user_id: string; role: Database["public"]["Enums"]["app_role"] }
        Returns: boolean
      }
      is_admin: {
        Args: { user_id: string }
        Returns: boolean
      }
      is_subscribed: {
        Args: { user_id: string }
        Returns: boolean
      }
      verses_between: {
        Args: { start_pos: string; end_pos: string }
        Returns: number
      }
    }
    Enums: {
      app_role: "admin" | "teacher" | "parent" | "student"
      registration_type: "parent" | "adult"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "teacher", "parent", "student"],
      registration_type: ["parent", "adult"],
    },
  },
} as const
