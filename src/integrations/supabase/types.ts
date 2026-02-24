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
      anomalias: {
        Row: {
          created_at: string
          grupo_id: string | null
          id: string
          occurred_at: string
          payload: Json
          sector_id: string | null
          team_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          grupo_id?: string | null
          id?: string
          occurred_at?: string
          payload?: Json
          sector_id?: string | null
          team_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          grupo_id?: string | null
          id?: string
          occurred_at?: string
          payload?: Json
          sector_id?: string | null
          team_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "anomalias_grupo_id_fkey"
            columns: ["grupo_id"]
            isOneToOne: false
            referencedRelation: "grupos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anomalias_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "sectors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anomalias_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      anomalies: {
        Row: {
          assigned_to: string | null
          created_at: string
          description: string
          detected_at: string
          detected_by: string | null
          group_id: string | null
          id: string
          organization_id: string
          resolution: string | null
          resolved_at: string | null
          resolved_by: string | null
          severity: Database["public"]["Enums"]["anomaly_severity"]
          status: Database["public"]["Enums"]["anomaly_status"]
          type: Database["public"]["Enums"]["anomaly_type"]
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          description: string
          detected_at?: string
          detected_by?: string | null
          group_id?: string | null
          id?: string
          organization_id: string
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity: Database["public"]["Enums"]["anomaly_severity"]
          status?: Database["public"]["Enums"]["anomaly_status"]
          type: Database["public"]["Enums"]["anomaly_type"]
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          description?: string
          detected_at?: string
          detected_by?: string | null
          group_id?: string | null
          id?: string
          organization_id?: string
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: Database["public"]["Enums"]["anomaly_severity"]
          status?: Database["public"]["Enums"]["anomaly_status"]
          type?: Database["public"]["Enums"]["anomaly_type"]
        }
        Relationships: [
          {
            foreignKeyName: "anomalies_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anomalies_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          created_at: string
          details: Json
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: unknown
          organization_id: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: unknown
          organization_id: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: unknown
          organization_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_user_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          grupo_id: string | null
          id: string
          metadata: Json
          sector_id: string | null
          team_id: string | null
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          grupo_id?: string | null
          id?: string
          metadata?: Json
          sector_id?: string | null
          team_id?: string | null
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          grupo_id?: string | null
          id?: string
          metadata?: Json
          sector_id?: string | null
          team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_grupo_id_fkey"
            columns: ["grupo_id"]
            isOneToOne: false
            referencedRelation: "grupos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "sectors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      churn: {
        Row: {
          created_at: string
          grupo_id: string | null
          id: string
          occurred_at: string
          payload: Json
          sector_id: string | null
          team_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          grupo_id?: string | null
          id?: string
          occurred_at?: string
          payload?: Json
          sector_id?: string | null
          team_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          grupo_id?: string | null
          id?: string
          occurred_at?: string
          payload?: Json
          sector_id?: string | null
          team_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "churn_grupo_id_fkey"
            columns: ["grupo_id"]
            isOneToOne: false
            referencedRelation: "grupos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "churn_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "sectors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "churn_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      churn_records: {
        Row: {
          category: string | null
          churn_count: number
          created_at: string
          date: string
          description: string | null
          group_id: string
          id: string
          organization_id: string
          reason: string
          reported_by: string | null
        }
        Insert: {
          category?: string | null
          churn_count: number
          created_at?: string
          date: string
          description?: string | null
          group_id: string
          id?: string
          organization_id: string
          reason: string
          reported_by?: string | null
        }
        Update: {
          category?: string | null
          churn_count?: number
          created_at?: string
          date?: string
          description?: string | null
          group_id?: string
          id?: string
          organization_id?: string
          reason?: string
          reported_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "churn_records_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "churn_records_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_monitoring: {
        Row: {
          churn_count: number
          created_at: string
          date: string
          group_id: string
          grupos_responsabilidade: number
          grupos_revisados: number
          id: string
          justificativa: string | null
          organization_id: string
          pendencias: number
          respondido_930: boolean
          user_id: string
        }
        Insert: {
          churn_count?: number
          created_at?: string
          date: string
          group_id: string
          grupos_responsabilidade?: number
          grupos_revisados?: number
          id?: string
          justificativa?: string | null
          organization_id: string
          pendencias?: number
          respondido_930?: boolean
          user_id: string
        }
        Update: {
          churn_count?: number
          created_at?: string
          date?: string
          group_id?: string
          grupos_responsabilidade?: number
          grupos_revisados?: number
          id?: string
          justificativa?: string | null
          organization_id?: string
          pendencias?: number
          respondido_930?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_monitoring_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_monitoring_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      evolution_instances: {
        Row: {
          api_key: string
          base_url: string
          created_at: string
          id: string
          instance_name: string
          last_sync: string | null
          organization_id: string
          phone_number: string | null
          qr_code: string | null
          status: string
          updated_at: string
        }
        Insert: {
          api_key: string
          base_url: string
          created_at?: string
          id?: string
          instance_name: string
          last_sync?: string | null
          organization_id: string
          phone_number?: string | null
          qr_code?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          api_key?: string
          base_url?: string
          created_at?: string
          id?: string
          instance_name?: string
          last_sync?: string | null
          organization_id?: string
          phone_number?: string | null
          qr_code?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "evolution_instances_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          created_at: string
          current_score: number
          evolution_instance_id: string | null
          group_id: string
          id: string
          name: string
          organization_id: string
          squad: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_score?: number
          evolution_instance_id?: string | null
          group_id: string
          id?: string
          name: string
          organization_id: string
          squad?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_score?: number
          evolution_instance_id?: string | null
          group_id?: string
          id?: string
          name?: string
          organization_id?: string
          squad?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "groups_evolution_instance_id_fkey"
            columns: ["evolution_instance_id"]
            isOneToOne: false
            referencedRelation: "evolution_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "groups_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      grupo_messages: {
        Row: {
          created_at: string
          grupo_id: string | null
          id: string
          instance_id: string | null
          message_text: string | null
          message_type: string
          received_at: string
          sender_name: string | null
          whatsapp_group_id: string | null
        }
        Insert: {
          created_at?: string
          grupo_id?: string | null
          id?: string
          instance_id?: string | null
          message_text?: string | null
          message_type?: string
          received_at?: string
          sender_name?: string | null
          whatsapp_group_id?: string | null
        }
        Update: {
          created_at?: string
          grupo_id?: string | null
          id?: string
          instance_id?: string | null
          message_text?: string | null
          message_type?: string
          received_at?: string
          sender_name?: string | null
          whatsapp_group_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "grupo_messages_grupo_id_fkey"
            columns: ["grupo_id"]
            isOneToOne: false
            referencedRelation: "grupos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grupo_messages_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      grupos: {
        Row: {
          ativo: boolean
          created_at: string
          gestor: string | null
          gestor_id: string | null
          id: string
          instance_id: string | null
          last_message: string | null
          last_message_at: string | null
          mensagens: number
          nome: string
          sector_id: string | null
          sla: string
          status: string
          team_id: string | null
          ultima_atividade: string | null
          updated_at: string
          whatsapp_group_id: string | null
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          gestor?: string | null
          gestor_id?: string | null
          id?: string
          instance_id?: string | null
          last_message?: string | null
          last_message_at?: string | null
          mensagens?: number
          nome: string
          sector_id?: string | null
          sla?: string
          status?: string
          team_id?: string | null
          ultima_atividade?: string | null
          updated_at?: string
          whatsapp_group_id?: string | null
        }
        Update: {
          ativo?: boolean
          created_at?: string
          gestor?: string | null
          gestor_id?: string | null
          id?: string
          instance_id?: string | null
          last_message?: string | null
          last_message_at?: string | null
          mensagens?: number
          nome?: string
          sector_id?: string | null
          sla?: string
          status?: string
          team_id?: string | null
          ultima_atividade?: string | null
          updated_at?: string
          whatsapp_group_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "grupos_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grupos_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "sectors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grupos_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      monitoring_settings: {
        Row: {
          category: string
          color: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          label: string
          max_value: number | null
          min_value: number | null
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          category: string
          color?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          label: string
          max_value?: number | null
          min_value?: number | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          color?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          label?: string
          max_value?: number | null
          min_value?: number | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          data: Json
          description: string | null
          id: string
          organization_id: string
          read: boolean
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json
          description?: string | null
          id?: string
          organization_id: string
          read?: boolean
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json
          description?: string | null
          id?: string
          organization_id?: string
          read?: boolean
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          id: string
          is_admin: boolean
          joined_at: string
          organization_id: string
          user_id: string
        }
        Insert: {
          id?: string
          is_admin?: boolean
          joined_at?: string
          organization_id: string
          user_id: string
        }
        Update: {
          id?: string
          is_admin?: boolean
          joined_at?: string
          organization_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          max_instances: number
          max_users: number
          name: string
          plan: Database["public"]["Enums"]["subscription_plan"]
          plan_expires_at: string | null
          subdomain: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          max_instances?: number
          max_users?: number
          name: string
          plan?: Database["public"]["Enums"]["subscription_plan"]
          plan_expires_at?: string | null
          subdomain?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          max_instances?: number
          max_users?: number
          name?: string
          plan?: Database["public"]["Enums"]["subscription_plan"]
          plan_expires_at?: string | null
          subdomain?: string | null
        }
        Relationships: []
      }
      permissions: {
        Row: {
          code: string
          created_at: string
          description: string
          id: string
          module: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string
          id?: string
          module?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string
          id?: string
          module?: string
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          created_at: string
          id: string
          permission_id: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          created_at?: string
          id?: string
          permission_id: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          created_at?: string
          id?: string
          permission_id?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
        ]
      }
      sectors: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      sla: {
        Row: {
          created_at: string
          grupo_id: string | null
          id: string
          occurred_at: string
          payload: Json
          sector_id: string | null
          team_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          grupo_id?: string | null
          id?: string
          occurred_at?: string
          payload?: Json
          sector_id?: string | null
          team_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          grupo_id?: string | null
          id?: string
          occurred_at?: string
          payload?: Json
          sector_id?: string | null
          team_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sla_grupo_id_fkey"
            columns: ["grupo_id"]
            isOneToOne: false
            referencedRelation: "grupos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sla_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "sectors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sla_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          capacidade_maxima: number
          created_at: string
          gestores: string[]
          id: string
          is_active: boolean
          name: string
          supervisor: string | null
          updated_at: string
        }
        Insert: {
          capacidade_maxima?: number
          created_at?: string
          gestores?: string[]
          id?: string
          is_active?: boolean
          name: string
          supervisor?: string | null
          updated_at?: string
        }
        Update: {
          capacidade_maxima?: number
          created_at?: string
          gestores?: string[]
          id?: string
          is_active?: boolean
          name?: string
          supervisor?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_group_permissions: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          group_id: string
          id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          group_id: string
          id?: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          group_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_group_permissions_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      user_grupos: {
        Row: {
          created_at: string
          grupo_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          grupo_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          grupo_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_grupos_grupo_id_fkey"
            columns: ["grupo_id"]
            isOneToOne: false
            referencedRelation: "grupos"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          capacidade_maxima_gestor: number
          created_at: string
          email: string
          full_name: string
          funcao: string
          is_active: boolean
          last_access_at: string | null
          sector_id: string | null
          team_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          capacidade_maxima_gestor?: number
          created_at?: string
          email: string
          full_name: string
          funcao?: string
          is_active?: boolean
          last_access_at?: string | null
          sector_id?: string | null
          team_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          capacidade_maxima_gestor?: number
          created_at?: string
          email?: string
          full_name?: string
          funcao?: string
          is_active?: boolean
          last_access_at?: string | null
          sector_id?: string | null
          team_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_sector_fk"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "sectors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_profiles_team_fk"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
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
      user_squad_history: {
        Row: {
          changed_by: string
          created_at: string
          id: string
          new_team_id: string | null
          old_team_id: string | null
          reason: string
          user_id: string
        }
        Insert: {
          changed_by: string
          created_at?: string
          id?: string
          new_team_id?: string | null
          old_team_id?: string | null
          reason?: string
          user_id: string
        }
        Update: {
          changed_by?: string
          created_at?: string
          id?: string
          new_team_id?: string | null
          old_team_id?: string | null
          reason?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_squad_history_new_team_id_fkey"
            columns: ["new_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_squad_history_old_team_id_fkey"
            columns: ["old_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_instances: {
        Row: {
          created_at: string
          id: string
          instance_name: string
          last_health_check: string | null
          phone_number: string | null
          provider_id: string
          qr_code: string | null
          session_data: Json
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          instance_name: string
          last_health_check?: string | null
          phone_number?: string | null
          provider_id: string
          qr_code?: string | null
          session_data?: Json
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          instance_name?: string
          last_health_check?: string | null
          phone_number?: string | null
          provider_id?: string
          qr_code?: string | null
          session_data?: Json
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_instances_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_message_log: {
        Row: {
          created_at: string
          direction: string
          error_message: string | null
          id: string
          instance_id: string | null
          latency_ms: number | null
          message_type: string
          payload: Json
          status: string
        }
        Insert: {
          created_at?: string
          direction?: string
          error_message?: string | null
          id?: string
          instance_id?: string | null
          latency_ms?: number | null
          message_type?: string
          payload?: Json
          status?: string
        }
        Update: {
          created_at?: string
          direction?: string
          error_message?: string | null
          id?: string
          instance_id?: string | null
          latency_ms?: number | null
          message_type?: string
          payload?: Json
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_message_log_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_providers: {
        Row: {
          config: Json
          created_at: string
          display_name: string
          id: string
          is_active: boolean
          is_default: boolean
          name: string
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          display_name: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          display_name?: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      whatsapp_webhooks_log: {
        Row: {
          created_at: string
          event_type: string
          id: string
          instance_id: string | null
          payload: Json
          processed: boolean
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          instance_id?: string | null
          payload?: Json
          processed?: boolean
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          instance_id?: string | null
          payload?: Json
          processed?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_webhooks_log_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_instances"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string | null
          sector_id: string | null
          status: boolean | null
          supervisor_id: string | null
          team_id: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: never
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string | null
          sector_id?: string | null
          status?: boolean | null
          supervisor_id?: never
          team_id?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: never
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string | null
          sector_id?: string | null
          status?: boolean | null
          supervisor_id?: never
          team_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_sector_fk"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "sectors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_profiles_team_fk"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          email: string | null
          equipe: string | null
          id: string | null
          nome: string | null
          role: Database["public"]["Enums"]["app_role"] | null
          setor: string | null
          status: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      can_access_group: {
        Args: { _group_id: string; _user_id: string }
        Returns: boolean
      }
      can_manage_users: { Args: { _user_id: string }; Returns: boolean }
      current_app_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      current_sector_id: { Args: { _user_id: string }; Returns: string }
      current_team_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_org_member: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      user_org_ids: { Args: { _user_id: string }; Returns: string[] }
    }
    Enums: {
      anomaly_severity: "CRITICA" | "ALTA" | "MEDIA" | "BAIXA"
      anomaly_status: "ABERTA" | "EM_PROGRESSO" | "RESOLVIDA" | "FECHADA"
      anomaly_type:
        | "CHURN"
        | "SLA_FAIL"
        | "PENDING_REVIEW"
        | "CRITICAL_SCORE"
        | "MANUAL"
      app_role: "DIRETOR" | "GERENTE" | "SUPERVISOR" | "OPERACIONAL"
      subscription_plan: "FREE" | "BASIC" | "PRO" | "ENTERPRISE"
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
    Enums: {
      anomaly_severity: ["CRITICA", "ALTA", "MEDIA", "BAIXA"],
      anomaly_status: ["ABERTA", "EM_PROGRESSO", "RESOLVIDA", "FECHADA"],
      anomaly_type: [
        "CHURN",
        "SLA_FAIL",
        "PENDING_REVIEW",
        "CRITICAL_SCORE",
        "MANUAL",
      ],
      app_role: ["DIRETOR", "GERENTE", "SUPERVISOR", "OPERACIONAL"],
      subscription_plan: ["FREE", "BASIC", "PRO", "ENTERPRISE"],
    },
  },
} as const
