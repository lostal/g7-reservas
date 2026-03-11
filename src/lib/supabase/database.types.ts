export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1";
  };
  public: {
    Tables: {
      alerts: {
        Row: {
          created_at: string;
          date: string;
          id: string;
          notified: boolean;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          date: string;
          id?: string;
          notified?: boolean;
          user_id: string;
        };
        Update: {
          created_at?: string;
          date?: string;
          id?: string;
          notified?: boolean;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "alerts_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      announcement_reads: {
        Row: {
          announcement_id: string;
          read_at: string;
          user_id: string;
        };
        Insert: {
          announcement_id: string;
          read_at?: string;
          user_id: string;
        };
        Update: {
          announcement_id?: string;
          read_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "announcement_reads_announcement_id_fkey";
            columns: ["announcement_id"];
            isOneToOne: false;
            referencedRelation: "announcements";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "announcement_reads_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      announcements: {
        Row: {
          body: string;
          created_at: string;
          created_by: string;
          entity_id: string | null;
          expires_at: string | null;
          id: string;
          published_at: string | null;
          title: string;
          updated_at: string;
        };
        Insert: {
          body: string;
          created_at?: string;
          created_by: string;
          entity_id?: string | null;
          expires_at?: string | null;
          id?: string;
          published_at?: string | null;
          title: string;
          updated_at?: string;
        };
        Update: {
          body?: string;
          created_at?: string;
          created_by?: string;
          entity_id?: string | null;
          expires_at?: string | null;
          id?: string;
          published_at?: string | null;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "announcements_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "announcements_entity_id_fkey";
            columns: ["entity_id"];
            isOneToOne: false;
            referencedRelation: "entities";
            referencedColumns: ["id"];
          },
        ];
      };
      audit_events: {
        Row: {
          actor_email: string;
          actor_id: string | null;
          created_at: string;
          entity_id: string | null;
          entity_type: string;
          event_type: string;
          id: number;
          metadata: Json;
        };
        Insert: {
          actor_email: string;
          actor_id?: string | null;
          created_at?: string;
          entity_id?: string | null;
          entity_type: string;
          event_type: string;
          id?: number;
          metadata?: Json;
        };
        Update: {
          actor_email?: string;
          actor_id?: string | null;
          created_at?: string;
          entity_id?: string | null;
          entity_type?: string;
          event_type?: string;
          id?: number;
          metadata?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "audit_events_actor_id_fkey";
            columns: ["actor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      cession_rules: {
        Row: {
          created_at: string;
          day_of_week: number | null;
          id: string;
          is_active: boolean;
          resource_type: Database["public"]["Enums"]["resource_type"];
          rule_type: Database["public"]["Enums"]["cession_rule_type"];
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          day_of_week?: number | null;
          id?: string;
          is_active?: boolean;
          resource_type?: Database["public"]["Enums"]["resource_type"];
          rule_type: Database["public"]["Enums"]["cession_rule_type"];
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          day_of_week?: number | null;
          id?: string;
          is_active?: boolean;
          resource_type?: Database["public"]["Enums"]["resource_type"];
          rule_type?: Database["public"]["Enums"]["cession_rule_type"];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "cession_rules_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      cessions: {
        Row: {
          created_at: string;
          date: string;
          id: string;
          spot_id: string;
          status: Database["public"]["Enums"]["cession_status"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          date: string;
          id?: string;
          spot_id: string;
          status?: Database["public"]["Enums"]["cession_status"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          date?: string;
          id?: string;
          spot_id?: string;
          status?: Database["public"]["Enums"]["cession_status"];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "cessions_spot_id_fkey";
            columns: ["spot_id"];
            isOneToOne: false;
            referencedRelation: "spots";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "cessions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      documents: {
        Row: {
          access_level: Database["public"]["Enums"]["document_access"];
          category: Database["public"]["Enums"]["document_category"];
          created_at: string;
          entity_id: string | null;
          file_size_bytes: number | null;
          id: string;
          is_active: boolean;
          mime_type: string;
          owner_id: string | null;
          period_month: number | null;
          period_year: number | null;
          storage_path: string;
          title: string;
          updated_at: string;
          uploaded_by: string | null;
        };
        Insert: {
          access_level?: Database["public"]["Enums"]["document_access"];
          category: Database["public"]["Enums"]["document_category"];
          created_at?: string;
          entity_id?: string | null;
          file_size_bytes?: number | null;
          id?: string;
          is_active?: boolean;
          mime_type?: string;
          owner_id?: string | null;
          period_month?: number | null;
          period_year?: number | null;
          storage_path: string;
          title: string;
          updated_at?: string;
          uploaded_by?: string | null;
        };
        Update: {
          access_level?: Database["public"]["Enums"]["document_access"];
          category?: Database["public"]["Enums"]["document_category"];
          created_at?: string;
          entity_id?: string | null;
          file_size_bytes?: number | null;
          id?: string;
          is_active?: boolean;
          mime_type?: string;
          owner_id?: string | null;
          period_month?: number | null;
          period_year?: number | null;
          storage_path?: string;
          title?: string;
          updated_at?: string;
          uploaded_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "documents_entity_id_fkey";
            columns: ["entity_id"];
            isOneToOne: false;
            referencedRelation: "entities";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "documents_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "documents_uploaded_by_fkey";
            columns: ["uploaded_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      entities: {
        Row: {
          created_at: string;
          id: string;
          is_active: boolean;
          name: string;
          short_code: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          is_active?: boolean;
          name: string;
          short_code: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_active?: boolean;
          name?: string;
          short_code?: string;
        };
        Relationships: [];
      };
      entity_config: {
        Row: {
          entity_id: string;
          key: string;
          updated_at: string;
          updated_by: string | null;
          value: Json;
        };
        Insert: {
          entity_id: string;
          key: string;
          updated_at?: string;
          updated_by?: string | null;
          value?: Json;
        };
        Update: {
          entity_id?: string;
          key?: string;
          updated_at?: string;
          updated_by?: string | null;
          value?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "entity_config_entity_id_fkey";
            columns: ["entity_id"];
            isOneToOne: false;
            referencedRelation: "entities";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "entity_config_updated_by_fkey";
            columns: ["updated_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      entity_holiday_calendars: {
        Row: {
          calendar_id: string;
          entity_id: string;
        };
        Insert: {
          calendar_id: string;
          entity_id: string;
        };
        Update: {
          calendar_id?: string;
          entity_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "entity_holiday_calendars_calendar_id_fkey";
            columns: ["calendar_id"];
            isOneToOne: false;
            referencedRelation: "holiday_calendars";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "entity_holiday_calendars_entity_id_fkey";
            columns: ["entity_id"];
            isOneToOne: false;
            referencedRelation: "entities";
            referencedColumns: ["id"];
          },
        ];
      };
      entity_modules: {
        Row: {
          enabled: boolean;
          entity_id: string;
          module: string;
        };
        Insert: {
          enabled?: boolean;
          entity_id: string;
          module: string;
        };
        Update: {
          enabled?: boolean;
          entity_id?: string;
          module?: string;
        };
        Relationships: [
          {
            foreignKeyName: "entity_modules_entity_id_fkey";
            columns: ["entity_id"];
            isOneToOne: false;
            referencedRelation: "entities";
            referencedColumns: ["id"];
          },
        ];
      };
      holiday_calendars: {
        Row: {
          country: string;
          created_at: string;
          id: string;
          is_active: boolean;
          name: string;
          region: string | null;
          updated_at: string;
          year: number;
        };
        Insert: {
          country?: string;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          name: string;
          region?: string | null;
          updated_at?: string;
          year: number;
        };
        Update: {
          country?: string;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          name?: string;
          region?: string | null;
          updated_at?: string;
          year?: number;
        };
        Relationships: [];
      };
      holidays: {
        Row: {
          calendar_id: string;
          created_at: string;
          date: string;
          id: string;
          is_optional: boolean;
          name: string;
        };
        Insert: {
          calendar_id: string;
          created_at?: string;
          date: string;
          id?: string;
          is_optional?: boolean;
          name: string;
        };
        Update: {
          calendar_id?: string;
          created_at?: string;
          date?: string;
          id?: string;
          is_optional?: boolean;
          name?: string;
        };
        Relationships: [
          {
            foreignKeyName: "holidays_calendar_id_fkey";
            columns: ["calendar_id"];
            isOneToOne: false;
            referencedRelation: "holiday_calendars";
            referencedColumns: ["id"];
          },
        ];
      };
      leave_requests: {
        Row: {
          created_at: string;
          employee_id: string;
          end_date: string;
          hr_action_at: string | null;
          hr_id: string | null;
          hr_notes: string | null;
          id: string;
          leave_type: Database["public"]["Enums"]["leave_type"];
          manager_action_at: string | null;
          manager_id: string | null;
          manager_notes: string | null;
          reason: string | null;
          start_date: string;
          status: Database["public"]["Enums"]["leave_status"];
          updated_at: string;
          working_days: number | null;
        };
        Insert: {
          created_at?: string;
          employee_id: string;
          end_date: string;
          hr_action_at?: string | null;
          hr_id?: string | null;
          hr_notes?: string | null;
          id?: string;
          leave_type?: Database["public"]["Enums"]["leave_type"];
          manager_action_at?: string | null;
          manager_id?: string | null;
          manager_notes?: string | null;
          reason?: string | null;
          start_date: string;
          status?: Database["public"]["Enums"]["leave_status"];
          updated_at?: string;
          working_days?: number | null;
        };
        Update: {
          created_at?: string;
          employee_id?: string;
          end_date?: string;
          hr_action_at?: string | null;
          hr_id?: string | null;
          hr_notes?: string | null;
          id?: string;
          leave_type?: Database["public"]["Enums"]["leave_type"];
          manager_action_at?: string | null;
          manager_id?: string | null;
          manager_notes?: string | null;
          reason?: string | null;
          start_date?: string;
          status?: Database["public"]["Enums"]["leave_status"];
          updated_at?: string;
          working_days?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "leave_requests_employee_id_fkey";
            columns: ["employee_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "leave_requests_hr_id_fkey";
            columns: ["hr_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "leave_requests_manager_id_fkey";
            columns: ["manager_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      notification_subscriptions: {
        Row: {
          channel: string;
          event_type: string;
          module: string;
          user_id: string;
        };
        Insert: {
          channel?: string;
          event_type: string;
          module: string;
          user_id: string;
        };
        Update: {
          channel?: string;
          event_type?: string;
          module?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notification_subscriptions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          dni: string | null;
          email: string;
          entity_id: string | null;
          full_name: string;
          id: string;
          job_title: string | null;
          location: string | null;
          manager_id: string | null;
          phone: string | null;
          role: Database["public"]["Enums"]["user_role"];
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          dni?: string | null;
          email: string;
          entity_id?: string | null;
          full_name?: string;
          id: string;
          job_title?: string | null;
          location?: string | null;
          manager_id?: string | null;
          phone?: string | null;
          role?: Database["public"]["Enums"]["user_role"];
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          dni?: string | null;
          email?: string;
          entity_id?: string | null;
          full_name?: string;
          id?: string;
          job_title?: string | null;
          location?: string | null;
          manager_id?: string | null;
          phone?: string | null;
          role?: Database["public"]["Enums"]["user_role"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_entity_id_fkey";
            columns: ["entity_id"];
            isOneToOne: false;
            referencedRelation: "entities";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "profiles_manager_id_fkey";
            columns: ["manager_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      reservations: {
        Row: {
          created_at: string;
          date: string;
          end_time: string | null;
          id: string;
          notes: string | null;
          spot_id: string;
          start_time: string | null;
          status: Database["public"]["Enums"]["reservation_status"];
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          date: string;
          end_time?: string | null;
          id?: string;
          notes?: string | null;
          spot_id: string;
          start_time?: string | null;
          status?: Database["public"]["Enums"]["reservation_status"];
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          date?: string;
          end_time?: string | null;
          id?: string;
          notes?: string | null;
          spot_id?: string;
          start_time?: string | null;
          status?: Database["public"]["Enums"]["reservation_status"];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reservations_spot_id_fkey";
            columns: ["spot_id"];
            isOneToOne: false;
            referencedRelation: "spots";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reservations_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      spots: {
        Row: {
          assigned_to: string | null;
          created_at: string;
          entity_id: string | null;
          id: string;
          is_active: boolean;
          label: string;
          position_x: number | null;
          position_y: number | null;
          resource_type: Database["public"]["Enums"]["resource_type"];
          type: Database["public"]["Enums"]["spot_type"];
          updated_at: string;
        };
        Insert: {
          assigned_to?: string | null;
          created_at?: string;
          entity_id?: string | null;
          id?: string;
          is_active?: boolean;
          label: string;
          position_x?: number | null;
          position_y?: number | null;
          resource_type?: Database["public"]["Enums"]["resource_type"];
          type?: Database["public"]["Enums"]["spot_type"];
          updated_at?: string;
        };
        Update: {
          assigned_to?: string | null;
          created_at?: string;
          entity_id?: string | null;
          id?: string;
          is_active?: boolean;
          label?: string;
          position_x?: number | null;
          position_y?: number | null;
          resource_type?: Database["public"]["Enums"]["resource_type"];
          type?: Database["public"]["Enums"]["spot_type"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "spots_assigned_to_fkey";
            columns: ["assigned_to"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "spots_entity_id_fkey";
            columns: ["entity_id"];
            isOneToOne: false;
            referencedRelation: "entities";
            referencedColumns: ["id"];
          },
        ];
      };
      system_config: {
        Row: {
          key: string;
          updated_at: string;
          updated_by: string | null;
          value: Json;
        };
        Insert: {
          key: string;
          updated_at?: string;
          updated_by?: string | null;
          value?: Json;
        };
        Update: {
          key?: string;
          updated_at?: string;
          updated_by?: string | null;
          value?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "system_config_updated_by_fkey";
            columns: ["updated_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      user_microsoft_tokens: {
        Row: {
          access_token: string;
          created_at: string;
          current_ooo_status: boolean;
          current_ooo_until: string | null;
          last_calendar_sync_at: string | null;
          last_ooo_check_at: string | null;
          outlook_calendar_id: string | null;
          refresh_token: string;
          scopes: string[];
          teams_conversation_id: string | null;
          teams_tenant_id: string | null;
          teams_user_id: string | null;
          token_expires_at: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          access_token: string;
          created_at?: string;
          current_ooo_status?: boolean;
          current_ooo_until?: string | null;
          last_calendar_sync_at?: string | null;
          last_ooo_check_at?: string | null;
          outlook_calendar_id?: string | null;
          refresh_token: string;
          scopes?: string[];
          teams_conversation_id?: string | null;
          teams_tenant_id?: string | null;
          teams_user_id?: string | null;
          token_expires_at: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          access_token?: string;
          created_at?: string;
          current_ooo_status?: boolean;
          current_ooo_until?: string | null;
          last_calendar_sync_at?: string | null;
          last_ooo_check_at?: string | null;
          outlook_calendar_id?: string | null;
          refresh_token?: string;
          scopes?: string[];
          teams_conversation_id?: string | null;
          teams_tenant_id?: string | null;
          teams_user_id?: string | null;
          token_expires_at?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_microsoft_tokens_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      user_preferences: {
        Row: {
          auto_cede_days: number[] | null;
          auto_cede_notify: boolean;
          auto_cede_on_ooo: boolean;
          created_at: string;
          daily_digest_time: string | null;
          default_view: string;
          favorite_spot_ids: string[] | null;
          locale: string;
          notification_channel: string;
          notify_alert_triggered: boolean;
          notify_cession_reserved: boolean;
          notify_daily_digest: boolean;
          notify_reservation_confirmed: boolean;
          notify_reservation_reminder: boolean;
          notify_visitor_confirmed: boolean;
          outlook_calendar_name: string | null;
          outlook_create_events: boolean;
          outlook_sync_enabled: boolean;
          outlook_sync_interval: number | null;
          theme: string;
          updated_at: string;
          user_id: string;
          usual_arrival_time: string | null;
        };
        Insert: {
          auto_cede_days?: number[] | null;
          auto_cede_notify?: boolean;
          auto_cede_on_ooo?: boolean;
          created_at?: string;
          daily_digest_time?: string | null;
          default_view?: string;
          favorite_spot_ids?: string[] | null;
          locale?: string;
          notification_channel?: string;
          notify_alert_triggered?: boolean;
          notify_cession_reserved?: boolean;
          notify_daily_digest?: boolean;
          notify_reservation_confirmed?: boolean;
          notify_reservation_reminder?: boolean;
          notify_visitor_confirmed?: boolean;
          outlook_calendar_name?: string | null;
          outlook_create_events?: boolean;
          outlook_sync_enabled?: boolean;
          outlook_sync_interval?: number | null;
          theme?: string;
          updated_at?: string;
          user_id: string;
          usual_arrival_time?: string | null;
        };
        Update: {
          auto_cede_days?: number[] | null;
          auto_cede_notify?: boolean;
          auto_cede_on_ooo?: boolean;
          created_at?: string;
          daily_digest_time?: string | null;
          default_view?: string;
          favorite_spot_ids?: string[] | null;
          locale?: string;
          notification_channel?: string;
          notify_alert_triggered?: boolean;
          notify_cession_reserved?: boolean;
          notify_daily_digest?: boolean;
          notify_reservation_confirmed?: boolean;
          notify_reservation_reminder?: boolean;
          notify_visitor_confirmed?: boolean;
          outlook_calendar_name?: string | null;
          outlook_create_events?: boolean;
          outlook_sync_enabled?: boolean;
          outlook_sync_interval?: number | null;
          theme?: string;
          updated_at?: string;
          user_id?: string;
          usual_arrival_time?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "user_preferences_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      visitor_reservations: {
        Row: {
          created_at: string;
          date: string;
          id: string;
          notes: string | null;
          notification_sent: boolean;
          reserved_by: string;
          spot_id: string;
          status: Database["public"]["Enums"]["reservation_status"];
          updated_at: string;
          visitor_company: string;
          visitor_email: string;
          visitor_name: string;
        };
        Insert: {
          created_at?: string;
          date: string;
          id?: string;
          notes?: string | null;
          notification_sent?: boolean;
          reserved_by: string;
          spot_id: string;
          status?: Database["public"]["Enums"]["reservation_status"];
          updated_at?: string;
          visitor_company: string;
          visitor_email: string;
          visitor_name: string;
        };
        Update: {
          created_at?: string;
          date?: string;
          id?: string;
          notes?: string | null;
          notification_sent?: boolean;
          reserved_by?: string;
          spot_id?: string;
          status?: Database["public"]["Enums"]["reservation_status"];
          updated_at?: string;
          visitor_company?: string;
          visitor_email?: string;
          visitor_name?: string;
        };
        Relationships: [
          {
            foreignKeyName: "visitor_reservations_reserved_by_fkey";
            columns: ["reserved_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "visitor_reservations_spot_id_fkey";
            columns: ["spot_id"];
            isOneToOne: false;
            referencedRelation: "spots";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_user_entity_id: { Args: never; Returns: string };
      get_user_role: {
        Args: never;
        Returns: Database["public"]["Enums"]["user_role"];
      };
      is_admin: { Args: never; Returns: boolean };
      is_hr: { Args: never; Returns: boolean };
      is_manager_or_above: { Args: never; Returns: boolean };
      reports_to_current_user: {
        Args: { p_user_id: string };
        Returns: boolean;
      };
      reservation_tsrange: {
        Args: { p_date: string; p_end: string; p_start: string };
        Returns: unknown;
      };
      user_has_assigned_spot: {
        Args: { p_resource_type: string };
        Returns: boolean;
      };
    };
    Enums: {
      cession_rule_type: "out_of_office" | "day_of_week";
      cession_status: "available" | "reserved" | "cancelled";
      document_access: "own" | "entity" | "global";
      document_category: "payslip" | "corporate" | "contract" | "other";
      leave_status:
        | "pending"
        | "manager_approved"
        | "hr_approved"
        | "rejected"
        | "cancelled";
      leave_type: "vacation" | "personal" | "sick" | "other";
      reservation_status: "confirmed" | "cancelled";
      resource_type: "parking" | "office";
      spot_type: "standard" | "visitor";
      user_role: "employee" | "manager" | "hr" | "admin";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      cession_rule_type: ["out_of_office", "day_of_week"],
      cession_status: ["available", "reserved", "cancelled"],
      document_access: ["own", "entity", "global"],
      document_category: ["payslip", "corporate", "contract", "other"],
      leave_status: [
        "pending",
        "manager_approved",
        "hr_approved",
        "rejected",
        "cancelled",
      ],
      leave_type: ["vacation", "personal", "sick", "other"],
      reservation_status: ["confirmed", "cancelled"],
      resource_type: ["parking", "office"],
      spot_type: ["standard", "visitor"],
      user_role: ["employee", "manager", "hr", "admin"],
    },
  },
} as const;
