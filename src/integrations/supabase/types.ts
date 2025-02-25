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
      parent_student_links: {
        Row: {
          created_at: string
          id: string
          parent_user_id: string
          student_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          parent_user_id: string
          student_id: string
        }
        Update: {
          created_at?: string
          id?: string
          parent_user_id?: string
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
          class_id: string | null
          created_at: string
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          name: string
          updated_at: string
        }
        Insert: {
          class_id?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          class_id?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
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
      [_ in never]: never
    }
    Functions: {
      calculate_pages_in_range: {
        Args: {
          p_surah: string
          p_verses: string
        }
        Returns: number
      }
      delete_user: {
        Args: {
          user_id_to_delete: string
        }
        Returns: undefined
      }
      get_latest_assignments: {
        Args: {
          p_student_id: string
        }
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
        Args: {
          p_email: string
        }
        Returns: string
      }
      get_student_teacher_info: {
        Args: {
          student_id: string
        }
        Returns: {
          student_name: string
          class_id: string
          teacher_user_id: string
        }[]
      }
      has_role: {
        Args: {
          user_id: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      is_subscribed: {
        Args: {
          user_id: string
        }
        Returns: boolean
      }
      verses_between: {
        Args: {
          start_pos: string
          end_pos: string
        }
        Returns: number
      }
    }
    Enums: {
      app_role: "admin" | "teacher" | "parent" | "student"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
