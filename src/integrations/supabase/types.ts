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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      building_profiles: {
        Row: {
          age_category: string | null
          amenities: string[] | null
          building_name: string
          city: string | null
          construction_year: number | null
          country: string | null
          created_at: string
          has_amenities: boolean | null
          id: string
          neighborhood: string | null
          province: string | null
          unit_count_range: string | null
          updated_at: string
          user_id: string
          zone: string | null
        }
        Insert: {
          age_category?: string | null
          amenities?: string[] | null
          building_name: string
          city?: string | null
          construction_year?: number | null
          country?: string | null
          created_at?: string
          has_amenities?: boolean | null
          id?: string
          neighborhood?: string | null
          province?: string | null
          unit_count_range?: string | null
          updated_at?: string
          user_id: string
          zone?: string | null
        }
        Update: {
          age_category?: string | null
          amenities?: string[] | null
          building_name?: string
          city?: string | null
          construction_year?: number | null
          country?: string | null
          created_at?: string
          has_amenities?: boolean | null
          id?: string
          neighborhood?: string | null
          province?: string | null
          unit_count_range?: string | null
          updated_at?: string
          user_id?: string
          zone?: string | null
        }
        Relationships: []
      }
      expense_analyses: {
        Row: {
          administrator_cuit: string | null
          administrator_name: string | null
          building_name: string | null
          building_profile_id: string | null
          created_at: string
          file_url: string | null
          id: string
          notes: string | null
          payment_id: string | null
          period: string
          period_date: string | null
          previous_total: number | null
          scanned_at: string | null
          status: string
          total_amount: number
          unit: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          administrator_cuit?: string | null
          administrator_name?: string | null
          building_name?: string | null
          building_profile_id?: string | null
          created_at?: string
          file_url?: string | null
          id?: string
          notes?: string | null
          payment_id?: string | null
          period: string
          period_date?: string | null
          previous_total?: number | null
          scanned_at?: string | null
          status?: string
          total_amount: number
          unit?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          administrator_cuit?: string | null
          administrator_name?: string | null
          building_name?: string | null
          building_profile_id?: string | null
          created_at?: string
          file_url?: string | null
          id?: string
          notes?: string | null
          payment_id?: string | null
          period?: string
          period_date?: string | null
          previous_total?: number | null
          scanned_at?: string | null
          status?: string
          total_amount?: number
          unit?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_analyses_building_profile_id_fkey"
            columns: ["building_profile_id"]
            isOneToOne: false
            referencedRelation: "building_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_categories: {
        Row: {
          analysis_id: string
          created_at: string
          current_amount: number
          explanation: string | null
          icon: string | null
          id: string
          name: string
          previous_amount: number | null
          status: string
        }
        Insert: {
          analysis_id: string
          created_at?: string
          current_amount: number
          explanation?: string | null
          icon?: string | null
          id?: string
          name: string
          previous_amount?: number | null
          status?: string
        }
        Update: {
          analysis_id?: string
          created_at?: string
          current_amount?: number
          explanation?: string | null
          icon?: string | null
          id?: string
          name?: string
          previous_amount?: number | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_categories_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "expense_analyses"
            referencedColumns: ["id"]
          },
        ]
      }
      inflation_data: {
        Row: {
          created_at: string
          id: string
          is_estimated: boolean
          period: string
          updated_at: string
          value: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_estimated?: boolean
          period: string
          updated_at?: string
          value: number
        }
        Update: {
          created_at?: string
          id?: string
          is_estimated?: boolean
          period?: string
          updated_at?: string
          value?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          free_analysis: boolean
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          free_analysis?: boolean
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          free_analysis?: boolean
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      shared_analysis_links: {
        Row: {
          analysis_id: string
          created_at: string
          created_by: string
          expires_at: string | null
          id: string
          is_active: boolean
          token: string
          view_count: number
        }
        Insert: {
          analysis_id: string
          created_at?: string
          created_by: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          token: string
          view_count?: number
        }
        Update: {
          analysis_id?: string
          created_at?: string
          created_by?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          token?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "shared_analysis_links_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "expense_analyses"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
  : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
  : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
  : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
