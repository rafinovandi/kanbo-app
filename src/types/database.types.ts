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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      agent_bots: {
        Row: {
          bot_id: string
          bot_username: string
          channel: string
          created_at: string
          id: string
          name: string
          owner_id: string
          revoked_at: string | null
          secret_id: string | null
          token_hint: string | null
        }
        Insert: {
          bot_id: string
          bot_username: string
          channel?: string
          created_at?: string
          id?: string
          name: string
          owner_id: string
          revoked_at?: string | null
          secret_id?: string | null
          token_hint?: string | null
        }
        Update: {
          bot_id?: string
          bot_username?: string
          channel?: string
          created_at?: string
          id?: string
          name?: string
          owner_id?: string
          revoked_at?: string | null
          secret_id?: string | null
          token_hint?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_bots_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_link_codes: {
        Row: {
          bot_id: string | null
          code_hash: string
          created_by: string
          expires_at: string
          kind: string
          project_id: string
          used_at: string | null
        }
        Insert: {
          bot_id?: string | null
          code_hash: string
          created_by: string
          expires_at?: string
          kind?: string
          project_id: string
          used_at?: string | null
        }
        Update: {
          bot_id?: string | null
          code_hash?: string
          created_by?: string
          expires_at?: string
          kind?: string
          project_id?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_link_codes_bot_id_created_by_fkey"
            columns: ["bot_id", "created_by"]
            isOneToOne: false
            referencedRelation: "agent_bots"
            referencedColumns: ["id", "owner_id"]
          },
          {
            foreignKeyName: "agent_link_codes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_links: {
        Row: {
          bot_id: string | null
          channel: string
          chat_id: string
          client_name: string | null
          created_at: string
          id: string
          kind: string
          last_used_at: string | null
          linked_by: string
          notify_disabled_reason: string | null
          notify_task_completed: boolean
          notify_task_created: boolean
          project_id: string
          revoked_at: string | null
          token_hash: string
        }
        Insert: {
          bot_id?: string | null
          channel?: string
          chat_id: string
          client_name?: string | null
          created_at?: string
          id?: string
          kind?: string
          last_used_at?: string | null
          linked_by: string
          notify_disabled_reason?: string | null
          notify_task_completed?: boolean
          notify_task_created?: boolean
          project_id: string
          revoked_at?: string | null
          token_hash: string
        }
        Update: {
          bot_id?: string | null
          channel?: string
          chat_id?: string
          client_name?: string | null
          created_at?: string
          id?: string
          kind?: string
          last_used_at?: string | null
          linked_by?: string
          notify_disabled_reason?: string | null
          notify_task_completed?: boolean
          notify_task_created?: boolean
          project_id?: string
          revoked_at?: string | null
          token_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_links_bot_id_fkey"
            columns: ["bot_id"]
            isOneToOne: false
            referencedRelation: "agent_bots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_links_linked_by_fkey"
            columns: ["linked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_links_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_link_attempts: {
        Row: {
          client_hash: string
          count: number
          window_start: string
        }
        Insert: {
          client_hash: string
          count?: number
          window_start: string
        }
        Update: {
          client_hash?: string
          count?: number
          window_start?: string
        }
        Relationships: []
      }
      agent_rate_limits: {
        Row: {
          count: number
          token_id: string
          window_start: string
        }
        Insert: {
          count?: number
          token_id: string
          window_start: string
        }
        Update: {
          count?: number
          token_id?: string
          window_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_rate_limits_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "agent_links"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_requests: {
        Row: {
          created_at: string
          idempotency_key: string
          payload_hash: string
          response_body: Json | null
          response_status: number
          token_id: string
        }
        Insert: {
          created_at?: string
          idempotency_key: string
          payload_hash: string
          response_body?: Json | null
          response_status: number
          token_id: string
        }
        Update: {
          created_at?: string
          idempotency_key?: string
          payload_hash?: string
          response_body?: Json | null
          response_status?: number
          token_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_requests_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "agent_links"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          color: Database["public"]["Enums"]["project_color"]
          created_at: string
          id: string
          key: Database["public"]["Enums"]["category_key"] | null
          name: string
          position: number
          project_id: string
        }
        Insert: {
          color?: Database["public"]["Enums"]["project_color"]
          created_at?: string
          id?: string
          key?: Database["public"]["Enums"]["category_key"] | null
          name: string
          position?: number
          project_id: string
        }
        Update: {
          color?: Database["public"]["Enums"]["project_color"]
          created_at?: string
          id?: string
          key?: Database["public"]["Enums"]["category_key"] | null
          name?: string
          position?: number
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_log: {
        Row: {
          created_at: string
          error: string | null
          event: string
          id: string
          link_id: string
          status: Database["public"]["Enums"]["notify_status"]
          task_id: string
        }
        Insert: {
          created_at?: string
          error?: string | null
          event: string
          id?: string
          link_id: string
          status: Database["public"]["Enums"]["notify_status"]
          task_id: string
        }
        Update: {
          created_at?: string
          error?: string | null
          event?: string
          id?: string
          link_id?: string
          status?: Database["public"]["Enums"]["notify_status"]
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_log_link_id_fkey"
            columns: ["link_id"]
            isOneToOne: false
            referencedRelation: "agent_links"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_log_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_bg: string
          avatar_fg: string
          avatar_url: string | null
          bio: string | null
          created_at: string
          email: string
          headline: string | null
          id: string
          location: string | null
          name: string
          show_activity: boolean
          show_pinned: boolean
          show_recent_tasks: boolean
          show_stats: boolean
          telegram_username: string | null
          timezone: string
          updated_at: string
          username: string
          website: string | null
        }
        Insert: {
          avatar_bg?: string
          avatar_fg?: string
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email: string
          headline?: string | null
          id: string
          location?: string | null
          name: string
          show_activity?: boolean
          show_pinned?: boolean
          show_recent_tasks?: boolean
          show_stats?: boolean
          telegram_username?: string | null
          timezone?: string
          updated_at?: string
          username: string
          website?: string | null
        }
        Update: {
          avatar_bg?: string
          avatar_fg?: string
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string
          headline?: string | null
          id?: string
          location?: string | null
          name?: string
          show_activity?: boolean
          show_pinned?: boolean
          show_recent_tasks?: boolean
          show_stats?: boolean
          telegram_username?: string | null
          timezone?: string
          updated_at?: string
          username?: string
          website?: string | null
        }
        Relationships: []
      }
      project_members: {
        Row: {
          accepted_at: string | null
          email: string
          id: string
          invited_at: string
          invited_by: string | null
          is_admin: boolean
          project_id: string
          roles: string[]
          status: Database["public"]["Enums"]["member_status"]
          user_id: string | null
        }
        Insert: {
          accepted_at?: string | null
          email: string
          id?: string
          invited_at?: string
          invited_by?: string | null
          is_admin?: boolean
          project_id: string
          roles?: string[]
          status?: Database["public"]["Enums"]["member_status"]
          user_id?: string | null
        }
        Update: {
          accepted_at?: string | null
          email?: string
          id?: string
          invited_at?: string
          invited_by?: string | null
          is_admin?: boolean
          project_id?: string
          roles?: string[]
          status?: Database["public"]["Enums"]["member_status"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_members_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      project_pins: {
        Row: {
          pinned_at: string
          project_id: string
          user_id: string
        }
        Insert: {
          pinned_at?: string
          project_id: string
          user_id?: string
        }
        Update: {
          pinned_at?: string
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_pins_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_pins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          color: Database["public"]["Enums"]["project_color"]
          created_at: string
          description: string
          id: string
          name: string
          owner_id: string
          updated_at: string
        }
        Insert: {
          color?: Database["public"]["Enums"]["project_color"]
          created_at?: string
          description?: string
          id?: string
          name: string
          owner_id?: string
          updated_at?: string
        }
        Update: {
          color?: Database["public"]["Enums"]["project_color"]
          created_at?: string
          description?: string
          id?: string
          name?: string
          owner_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      task_assignees: {
        Row: {
          assigned_at: string
          task_id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          task_id: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_assignees_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_assignees_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          category_id: string
          completed_at: string | null
          created_at: string
          created_by: string | null
          description: string
          due_date: string | null
          id: string
          position: number
          priority: Database["public"]["Enums"]["task_priority"]
          project_id: string
          source: Database["public"]["Enums"]["task_source"]
          source_channel: string | null
          source_sender: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category_id: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          due_date?: string | null
          id?: string
          position?: number
          priority?: Database["public"]["Enums"]["task_priority"]
          project_id: string
          source?: Database["public"]["Enums"]["task_source"]
          source_channel?: string | null
          source_sender?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category_id?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          due_date?: string | null
          id?: string
          position?: number
          priority?: Database["public"]["Enums"]["task_priority"]
          project_id?: string
          source?: Database["public"]["Enums"]["task_source"]
          source_channel?: string | null
          source_sender?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_category_same_project_fk"
            columns: ["category_id", "project_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id", "project_id"]
          },
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_invite: {
        Args: { p_token_hash: string }
        Returns: {
          invited_email: string
          project_id: string
          status: string
        }[]
      }
      accept_pending_invite: { Args: { p_member_id: string }; Returns: string }
      activity_graph: {
        Args: { p_days?: number; p_user_id: string }
        Returns: {
          completed: number
          day: string
        }[]
      }
      agent_link_rate_limit: {
        Args: { p_client_hash: string }
        Returns: {
          allowed: boolean
          retry_after: number
        }[]
      }
      agent_rate_limit: {
        Args: { p_token_id: string }
        Returns: {
          allowed: boolean
          retry_after: number
        }[]
      }
      cleanup_agent_data: { Args: never; Returns: undefined }
      dashboard_stats: { Args: never; Returns: Json }
      delete_category: { Args: { p_category_id: string }; Returns: string }
      get_agent_bot_token: { Args: { p_bot_id: string }; Returns: string }
      get_profile: { Args: { p_username: string }; Returns: Json }
      invite_member: {
        Args: {
          p_email: string
          p_expires_at: string
          p_project_id: string
          p_roles: string[]
          p_token_hash: string
        }
        Returns: string
      }
      my_due_notifications: {
        Args: { p_days?: number; p_today: string }
        Returns: {
          due_date: string
          project_color: Database["public"]["Enums"]["project_color"]
          project_id: string
          project_name: string
          status_key: Database["public"]["Enums"]["category_key"]
          task_id: string
          title: string
        }[]
      }
      my_pending_invites: {
        Args: never
        Returns: {
          invited_at: string
          invited_by_name: string
          member_id: string
          project_color: Database["public"]["Enums"]["project_color"]
          project_id: string
          project_name: string
        }[]
      }
      project_access: { Args: { p_project_id: string }; Returns: string }
      reorder_categories: {
        Args: { p_category_ids: string[]; p_project_id: string }
        Returns: undefined
      }
      set_agent_bot_token: {
        Args: { p_bot_id: string; p_token: string }
        Returns: undefined
      }
    }
    Enums: {
      category_key: "todo" | "progress" | "review" | "done"
      member_status: "pending" | "active"
      notify_status: "sent" | "failed" | "skipped"
      project_color: "gray" | "blue" | "lilac" | "pink" | "orange" | "green"
      task_priority: "low" | "medium" | "high"
      task_source: "web" | "agent"
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
      category_key: ["todo", "progress", "review", "done"],
      member_status: ["pending", "active"],
      notify_status: ["sent", "failed", "skipped"],
      project_color: ["gray", "blue", "lilac", "pink", "orange", "green"],
      task_priority: ["low", "medium", "high"],
      task_source: ["web", "agent"],
    },
  },
} as const
