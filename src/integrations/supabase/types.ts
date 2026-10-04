export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          achieved_on: string | null
          created_at: string
          description: string | null
          document_id: string | null
          feedback: string | null
          id: string
          issuer: string | null
          kind: string
          link: string | null
          status: Database["public"]["Enums"]["verification_status"]
          student_id: string
          title: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          achieved_on?: string | null
          created_at?: string
          description?: string | null
          document_id?: string | null
          feedback?: string | null
          id?: string
          issuer?: string | null
          kind?: string
          link?: string | null
          status?: Database["public"]["Enums"]["verification_status"]
          student_id: string
          title: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          achieved_on?: string | null
          created_at?: string
          description?: string | null
          document_id?: string | null
          feedback?: string | null
          id?: string
          issuer?: string | null
          kind?: string
          link?: string | null
          status?: Database["public"]["Enums"]["verification_status"]
          student_id?: string
          title?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "achievements_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          category: string
          created_at: string
          feedback: string | null
          file_name: string | null
          file_path: string
          id: string
          mime_type: string | null
          semester_no: number | null
          size_bytes: number | null
          status: Database["public"]["Enums"]["verification_status"]
          student_id: string
          title: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          category?: string
          created_at?: string
          feedback?: string | null
          file_name?: string | null
          file_path: string
          id?: string
          mime_type?: string | null
          semester_no?: number | null
          size_bytes?: number | null
          status?: Database["public"]["Enums"]["verification_status"]
          student_id: string
          title: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          feedback?: string | null
          file_name?: string | null
          file_path?: string
          id?: string
          mime_type?: string | null
          semester_no?: number | null
          size_bytes?: number | null
          status?: Database["public"]["Enums"]["verification_status"]
          student_id?: string
          title?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          batch: string | null
          created_at: string
          current_semester: number | null
          department: string
          email: string | null
          full_name: string
          id: string
          onboarded: boolean
          phone: string | null
          profile_photo_path: string | null
          register_no: string | null
          updated_at: string
        }
        Insert: {
          batch?: string | null
          created_at?: string
          current_semester?: number | null
          department?: string
          email?: string | null
          full_name?: string
          id: string
          onboarded?: boolean
          phone?: string | null
          profile_photo_path?: string | null
          register_no?: string | null
          updated_at?: string
        }
        Update: {
          batch?: string | null
          created_at?: string
          current_semester?: number | null
          department?: string
          email?: string | null
          full_name?: string
          id?: string
          onboarded?: boolean
          phone?: string | null
          profile_photo_path?: string | null
          register_no?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      semester_records: {
        Row: {
          attendance: number | null
          created_at: string
          credits: number | null
          document_id: string | null
          feedback: string | null
          id: string
          semester_no: number
          sgpa: number | null
          status: Database["public"]["Enums"]["verification_status"]
          student_id: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          attendance?: number | null
          created_at?: string
          credits?: number | null
          document_id?: string | null
          feedback?: string | null
          id?: string
          semester_no: number
          sgpa?: number | null
          status?: Database["public"]["Enums"]["verification_status"]
          student_id: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          attendance?: number | null
          created_at?: string
          credits?: number | null
          document_id?: string | null
          feedback?: string | null
          id?: string
          semester_no?: number
          sgpa?: number | null
          status?: Database["public"]["Enums"]["verification_status"]
          student_id?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: []
      }
      subject_marks: {
        Row: {
          course_code: string | null
          course_name: string
          created_at: string
          credits: number | null
          grade: string | null
          grade_points: number | null
          id: string
          marks: number | null
          semester_record_id: string
          student_id: string
        }
        Insert: {
          course_code?: string | null
          course_name: string
          created_at?: string
          credits?: number | null
          grade?: string | null
          grade_points?: number | null
          id?: string
          marks?: number | null
          semester_record_id: string
          student_id: string
        }
        Update: {
          course_code?: string | null
          course_name?: string
          created_at?: string
          credits?: number | null
          grade?: string | null
          grade_points?: number | null
          id?: string
          marks?: number | null
          semester_record_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subject_marks_semester_record_id_fkey"
            columns: ["semester_record_id"]
            isOneToOne: false
            referencedRelation: "semester_records"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "student" | "faculty" | "hod"
      verification_status: "pending" | "verified" | "rejected"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["student", "faculty", "hod"],
      verification_status: ["pending", "verified", "rejected"],
    },
  },
} as const
