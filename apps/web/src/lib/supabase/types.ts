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
      assessment_answers: {
        Row: {
          attempt_id: string
          id: string
          is_correct: boolean | null
          question_id: string
          selected_option: string | null
        }
        Insert: {
          attempt_id: string
          id?: string
          is_correct?: boolean | null
          question_id: string
          selected_option?: string | null
        }
        Update: {
          attempt_id?: string
          id?: string
          is_correct?: boolean | null
          question_id?: string
          selected_option?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assessment_answers_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "assessment_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_answers_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "v_export_assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "assessment_question_bank"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_attempts: {
        Row: {
          assessment_cycle: number
          attempt_number: number
          completed_at: string | null
          id: string
          passed: boolean | null
          professional_id: string
          score: number | null
          served_question_ids: Json
          started_at: string
        }
        Insert: {
          assessment_cycle?: number
          attempt_number: number
          completed_at?: string | null
          id?: string
          passed?: boolean | null
          professional_id: string
          score?: number | null
          served_question_ids: Json
          started_at?: string
        }
        Update: {
          assessment_cycle?: number
          attempt_number?: number
          completed_at?: string | null
          id?: string
          passed?: boolean | null
          professional_id?: string
          score?: number | null
          served_question_ids?: Json
          started_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_attempts_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_attempts_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "v_export_professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_question_bank: {
        Row: {
          correct_option: string
          created_at: string
          id: string
          is_active: boolean
          options: Json
          professional_role_id: string | null
          question_text: string
          topic: Database["public"]["Enums"]["assessment_topic"]
          weight: number
        }
        Insert: {
          correct_option: string
          created_at?: string
          id?: string
          is_active?: boolean
          options: Json
          professional_role_id?: string | null
          question_text: string
          topic: Database["public"]["Enums"]["assessment_topic"]
          weight?: number
        }
        Update: {
          correct_option?: string
          created_at?: string
          id?: string
          is_active?: boolean
          options?: Json
          professional_role_id?: string | null
          question_text?: string
          topic?: Database["public"]["Enums"]["assessment_topic"]
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "assessment_question_bank_professional_role_id_fkey"
            columns: ["professional_role_id"]
            isOneToOne: false
            referencedRelation: "professional_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          actor_type: string
          actor_user_id: string | null
          changes: Json | null
          entity_id: string
          entity_type: string
          id: number
          ip_address: unknown
          occurred_at: string
          summary: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_type?: string
          actor_user_id?: string | null
          changes?: Json | null
          entity_id: string
          entity_type: string
          id?: never
          ip_address?: unknown
          occurred_at?: string
          summary?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_type?: string
          actor_user_id?: string | null
          changes?: Json | null
          entity_id?: string
          entity_type?: string
          id?: never
          ip_address?: unknown
          occurred_at?: string
          summary?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_cancellations: {
        Row: {
          booking_id: string
          cancelled_at: string
          cancelled_by: string | null
          cancelled_role: string | null
          id: string
          is_last_minute: boolean
          reason: string | null
        }
        Insert: {
          booking_id: string
          cancelled_at?: string
          cancelled_by?: string | null
          cancelled_role?: string | null
          id?: string
          is_last_minute?: boolean
          reason?: string | null
        }
        Update: {
          booking_id?: string
          cancelled_at?: string
          cancelled_by?: string | null
          cancelled_role?: string | null
          id?: string
          is_last_minute?: boolean
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_cancellations_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_cancellations_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_export_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_cancellations_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_platform_revenue"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "booking_cancellations_cancelled_by_fkey"
            columns: ["cancelled_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_declines: {
        Row: {
          booking_id: string
          declined_at: string
          id: string
          professional_id: string
          reason: string | null
        }
        Insert: {
          booking_id: string
          declined_at?: string
          id?: string
          professional_id: string
          reason?: string | null
        }
        Update: {
          booking_id?: string
          declined_at?: string
          id?: string
          professional_id?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_declines_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_declines_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_export_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_declines_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_platform_revenue"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "booking_declines_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_declines_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "v_export_professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_status_history: {
        Row: {
          booking_id: string
          changed_at: string
          changed_by: string | null
          from_status: Database["public"]["Enums"]["booking_status"] | null
          id: string
          reason: string | null
          to_status: Database["public"]["Enums"]["booking_status"]
        }
        Insert: {
          booking_id: string
          changed_at?: string
          changed_by?: string | null
          from_status?: Database["public"]["Enums"]["booking_status"] | null
          id?: string
          reason?: string | null
          to_status: Database["public"]["Enums"]["booking_status"]
        }
        Update: {
          booking_id?: string
          changed_at?: string
          changed_by?: string | null
          from_status?: Database["public"]["Enums"]["booking_status"] | null
          id?: string
          reason?: string | null
          to_status?: Database["public"]["Enums"]["booking_status"]
        }
        Relationships: [
          {
            foreignKeyName: "booking_status_history_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_status_history_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_export_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_status_history_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_platform_revenue"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "booking_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          accepted_at: string | null
          assigned_by: string | null
          assigned_professional_id: string | null
          booking_type: string
          created_at: string
          created_by: string | null
          duration_hours: number
          id: string
          location_address: string
          location_postcode: string | null
          notes: string | null
          organisation_id: string | null
          private_client_id: string | null
          professional_role_id: string
          rate_card_id: string | null
          requester_user_id: string
          scheduled_end: string
          scheduled_start: string
          snap_client_charge_rate: number
          snap_currency: string
          snap_payout_rate: number
          snap_platform_fee: number
          status: Database["public"]["Enums"]["booking_status"]
          total_client_charge: number | null
          total_payout: number | null
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          assigned_by?: string | null
          assigned_professional_id?: string | null
          booking_type?: string
          created_at?: string
          created_by?: string | null
          duration_hours: number
          id?: string
          location_address: string
          location_postcode?: string | null
          notes?: string | null
          organisation_id?: string | null
          private_client_id?: string | null
          professional_role_id: string
          rate_card_id?: string | null
          requester_user_id: string
          scheduled_end: string
          scheduled_start: string
          snap_client_charge_rate: number
          snap_currency?: string
          snap_payout_rate: number
          snap_platform_fee: number
          status?: Database["public"]["Enums"]["booking_status"]
          total_client_charge?: number | null
          total_payout?: number | null
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          assigned_by?: string | null
          assigned_professional_id?: string | null
          booking_type?: string
          created_at?: string
          created_by?: string | null
          duration_hours?: number
          id?: string
          location_address?: string
          location_postcode?: string | null
          notes?: string | null
          organisation_id?: string | null
          private_client_id?: string | null
          professional_role_id?: string
          rate_card_id?: string | null
          requester_user_id?: string
          scheduled_end?: string
          scheduled_start?: string
          snap_client_charge_rate?: number
          snap_currency?: string
          snap_payout_rate?: number
          snap_platform_fee?: number
          status?: Database["public"]["Enums"]["booking_status"]
          total_client_charge?: number | null
          total_payout?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_assigned_professional_id_fkey"
            columns: ["assigned_professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_assigned_professional_id_fkey"
            columns: ["assigned_professional_id"]
            isOneToOne: false
            referencedRelation: "v_export_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "v_export_organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_private_client_id_fkey"
            columns: ["private_client_id"]
            isOneToOne: false
            referencedRelation: "private_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_private_client_id_fkey"
            columns: ["private_client_id"]
            isOneToOne: false
            referencedRelation: "v_export_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_professional_role_id_fkey"
            columns: ["professional_role_id"]
            isOneToOne: false
            referencedRelation: "professional_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_rate_card_id_fkey"
            columns: ["rate_card_id"]
            isOneToOne: false
            referencedRelation: "rate_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_requester_user_id_fkey"
            columns: ["requester_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_alerts: {
        Row: {
          acknowledged: boolean
          alert_type: string
          created_at: string
          document_id: string | null
          due_date: string | null
          id: string
          professional_id: string
        }
        Insert: {
          acknowledged?: boolean
          alert_type: string
          created_at?: string
          document_id?: string | null
          due_date?: string | null
          id?: string
          professional_id: string
        }
        Update: {
          acknowledged?: boolean
          alert_type?: string
          created_at?: string
          document_id?: string | null
          due_date?: string | null
          id?: string
          professional_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "compliance_alerts_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_alerts_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "v_export_compliance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_alerts_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_alerts_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "v_export_professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_requirements: {
        Row: {
          document_type_id: string
          id: string
          is_mandatory: boolean
          professional_role_id: string
        }
        Insert: {
          document_type_id: string
          id?: string
          is_mandatory?: boolean
          professional_role_id: string
        }
        Update: {
          document_type_id?: string
          id?: string
          is_mandatory?: boolean
          professional_role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "compliance_requirements_document_type_id_fkey"
            columns: ["document_type_id"]
            isOneToOne: false
            referencedRelation: "document_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_requirements_professional_role_id_fkey"
            columns: ["professional_role_id"]
            isOneToOne: false
            referencedRelation: "professional_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      consents: {
        Row: {
          accepted_at: string
          consent_type: string
          id: string
          ip_address: unknown
          user_id: string
          version: string
        }
        Insert: {
          accepted_at?: string
          consent_type: string
          id?: string
          ip_address?: unknown
          user_id: string
          version: string
        }
        Update: {
          accepted_at?: string
          consent_type?: string
          id?: string
          ip_address?: unknown
          user_id?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "consents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          subject: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          subject?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          subject?: string | null
        }
        Relationships: []
      }
      content_pages: {
        Row: {
          body: string | null
          id: string
          slug: string
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          body?: string | null
          id?: string
          slug: string
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          body?: string | null
          id?: string
          slug?: string
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_pages_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      document_types: {
        Row: {
          category: string
          code: string
          has_expiry: boolean
          id: string
          is_active: boolean
          is_compliance_critical: boolean
          name: string
        }
        Insert: {
          category: string
          code: string
          has_expiry?: boolean
          id?: string
          is_active?: boolean
          is_compliance_critical?: boolean
          name: string
        }
        Update: {
          category?: string
          code?: string
          has_expiry?: boolean
          id?: string
          is_active?: boolean
          is_compliance_critical?: boolean
          name?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          created_at: string
          document_type_id: string
          expiry_date: string | null
          id: string
          issued_date: string | null
          issuing_body: string | null
          notes: string | null
          original_filename: string | null
          professional_id: string
          reference_number: string | null
          rejection_reason: string | null
          storage_path: string
          superseded_at: string | null
          updated_at: string
          uploaded_by: string | null
          verification_status: Database["public"]["Enums"]["document_status"]
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          created_at?: string
          document_type_id: string
          expiry_date?: string | null
          id?: string
          issued_date?: string | null
          issuing_body?: string | null
          notes?: string | null
          original_filename?: string | null
          professional_id: string
          reference_number?: string | null
          rejection_reason?: string | null
          storage_path: string
          superseded_at?: string | null
          updated_at?: string
          uploaded_by?: string | null
          verification_status?: Database["public"]["Enums"]["document_status"]
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          created_at?: string
          document_type_id?: string
          expiry_date?: string | null
          id?: string
          issued_date?: string | null
          issuing_body?: string | null
          notes?: string | null
          original_filename?: string | null
          professional_id?: string
          reference_number?: string | null
          rejection_reason?: string | null
          storage_path?: string
          superseded_at?: string | null
          updated_at?: string
          uploaded_by?: string | null
          verification_status?: Database["public"]["Enums"]["document_status"]
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_document_type_id_fkey"
            columns: ["document_type_id"]
            isOneToOne: false
            referencedRelation: "document_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "v_export_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      eligibility_screenings: {
        Row: {
          employment_status: Database["public"]["Enums"]["employment_status"]
          id: string
          outcome: string
          professional_id: string
          submitted_at: string
          training_attestations: Json | null
          training_current: boolean
        }
        Insert: {
          employment_status: Database["public"]["Enums"]["employment_status"]
          id?: string
          outcome: string
          professional_id: string
          submitted_at?: string
          training_attestations?: Json | null
          training_current: boolean
        }
        Update: {
          employment_status?: Database["public"]["Enums"]["employment_status"]
          id?: string
          outcome?: string
          professional_id?: string
          submitted_at?: string
          training_attestations?: Json | null
          training_current?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "eligibility_screenings_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eligibility_screenings_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "v_export_professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      faq_items: {
        Row: {
          answer: string
          id: string
          is_active: boolean
          question: string
          sort_order: number
        }
        Insert: {
          answer: string
          id?: string
          is_active?: boolean
          question: string
          sort_order?: number
        }
        Update: {
          answer?: string
          id?: string
          is_active?: boolean
          question?: string
          sort_order?: number
        }
        Relationships: []
      }
      mandatory_training_types: {
        Row: {
          code: string
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          code: string
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          code?: string
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      notification_templates: {
        Row: {
          body: string
          id: string
          subject: string
          type: string
        }
        Insert: {
          body: string
          id?: string
          subject: string
          type: string
        }
        Update: {
          body?: string
          id?: string
          subject?: string
          type?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          channel: string
          created_at: string
          id: string
          payload: Json | null
          recipient_user_id: string
          related_entity: string | null
          sent_at: string | null
          status: string
          type: string
        }
        Insert: {
          channel?: string
          created_at?: string
          id?: string
          payload?: Json | null
          recipient_user_id: string
          related_entity?: string | null
          sent_at?: string | null
          status?: string
          type: string
        }
        Update: {
          channel?: string
          created_at?: string
          id?: string
          payload?: Json | null
          recipient_user_id?: string
          related_entity?: string | null
          sent_at?: string | null
          status?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_recipient_user_id_fkey"
            columns: ["recipient_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      organisations: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          billing_address: string | null
          billing_email: string | null
          city: string | null
          contact_person: string | null
          cqc_registration_number: string | null
          created_at: string
          email_contact: string | null
          id: string
          organisation_name: string
          phone: string | null
          postcode: string | null
          stripe_customer_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          billing_address?: string | null
          billing_email?: string | null
          city?: string | null
          contact_person?: string | null
          cqc_registration_number?: string | null
          created_at?: string
          email_contact?: string | null
          id?: string
          organisation_name: string
          phone?: string | null
          postcode?: string | null
          stripe_customer_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          billing_address?: string | null
          billing_email?: string | null
          city?: string | null
          contact_person?: string | null
          cqc_registration_number?: string | null
          created_at?: string
          email_contact?: string | null
          id?: string
          organisation_name?: string
          phone?: string | null
          postcode?: string | null
          stripe_customer_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organisations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          booking_id: string
          created_at: string
          currency: string
          id: string
          paid_at: string | null
          payer_user_id: string | null
          refunded_amount: number | null
          refunded_at: string | null
          status: Database["public"]["Enums"]["payment_status"]
          stripe_payment_intent_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          booking_id: string
          created_at?: string
          currency?: string
          id?: string
          paid_at?: string | null
          payer_user_id?: string | null
          refunded_amount?: number | null
          refunded_at?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          stripe_payment_intent_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          booking_id?: string
          created_at?: string
          currency?: string
          id?: string
          paid_at?: string | null
          payer_user_id?: string | null
          refunded_amount?: number | null
          refunded_at?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          stripe_payment_intent_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_export_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_platform_revenue"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "payments_payer_user_id_fkey"
            columns: ["payer_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      payouts: {
        Row: {
          amount: number
          booking_id: string | null
          created_at: string
          currency: string
          id: string
          method: string | null
          notes: string | null
          paid_at: string | null
          professional_id: string
          recorded_at: string | null
          recorded_by: string | null
          reference: string | null
          status: Database["public"]["Enums"]["payout_status"]
        }
        Insert: {
          amount: number
          booking_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          method?: string | null
          notes?: string | null
          paid_at?: string | null
          professional_id: string
          recorded_at?: string | null
          recorded_by?: string | null
          reference?: string | null
          status?: Database["public"]["Enums"]["payout_status"]
        }
        Update: {
          amount?: number
          booking_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          method?: string | null
          notes?: string | null
          paid_at?: string | null
          professional_id?: string
          recorded_at?: string | null
          recorded_by?: string | null
          reference?: string | null
          status?: Database["public"]["Enums"]["payout_status"]
        }
        Relationships: [
          {
            foreignKeyName: "payouts_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payouts_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_export_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payouts_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_platform_revenue"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "payouts_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payouts_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "v_export_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payouts_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      private_clients: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          city: string | null
          created_at: string
          email_contact: string | null
          full_name: string
          id: string
          phone: string | null
          postcode: string | null
          stripe_customer_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          created_at?: string
          email_contact?: string | null
          full_name: string
          id?: string
          phone?: string | null
          postcode?: string | null
          stripe_customer_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          created_at?: string
          email_contact?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          postcode?: string | null
          stripe_customer_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "private_clients_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_availability: {
        Row: {
          day_of_week: number | null
          end_time: string | null
          id: string
          professional_id: string
          start_time: string | null
        }
        Insert: {
          day_of_week?: number | null
          end_time?: string | null
          id?: string
          professional_id: string
          start_time?: string | null
        }
        Update: {
          day_of_week?: number | null
          end_time?: string | null
          id?: string
          professional_id?: string
          start_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "professional_availability_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_availability_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "v_export_professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_payout_details: {
        Row: {
          account_name: string | null
          account_number_enc: string | null
          account_number_last4: string | null
          id: string
          professional_id: string
          recorded_at: string
          sort_code_enc: string | null
          updated_at: string
        }
        Insert: {
          account_name?: string | null
          account_number_enc?: string | null
          account_number_last4?: string | null
          id?: string
          professional_id: string
          recorded_at?: string
          sort_code_enc?: string | null
          updated_at?: string
        }
        Update: {
          account_name?: string | null
          account_number_enc?: string | null
          account_number_last4?: string | null
          id?: string
          professional_id?: string
          recorded_at?: string
          sort_code_enc?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_payout_details_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: true
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_payout_details_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: true
            referencedRelation: "v_export_professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_roles: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      professional_skills: {
        Row: {
          professional_id: string
          skill_id: string
        }
        Insert: {
          professional_id: string
          skill_id: string
        }
        Update: {
          professional_id?: string
          skill_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_skills_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_skills_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "v_export_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_status_actions: {
        Row: {
          action_type: string
          applied_at: string
          applied_by: string | null
          id: string
          internal_notes: string | null
          is_automatic: boolean
          professional_id: string
          reason_code: string | null
          reason_text: string | null
          resolved_at: string | null
          resulting_status:
            | Database["public"]["Enums"]["professional_status"]
            | null
          review_date: string | null
        }
        Insert: {
          action_type: string
          applied_at?: string
          applied_by?: string | null
          id?: string
          internal_notes?: string | null
          is_automatic?: boolean
          professional_id: string
          reason_code?: string | null
          reason_text?: string | null
          resolved_at?: string | null
          resulting_status?:
            | Database["public"]["Enums"]["professional_status"]
            | null
          review_date?: string | null
        }
        Update: {
          action_type?: string
          applied_at?: string
          applied_by?: string | null
          id?: string
          internal_notes?: string | null
          is_automatic?: boolean
          professional_id?: string
          reason_code?: string | null
          reason_text?: string | null
          resolved_at?: string | null
          resulting_status?:
            | Database["public"]["Enums"]["professional_status"]
            | null
          review_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "professional_status_actions_applied_by_fkey"
            columns: ["applied_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_status_actions_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_status_actions_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "v_export_professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_training_records: {
        Row: {
          certificate_doc_id: string | null
          completed_date: string | null
          created_at: string
          expiry_date: string | null
          id: string
          professional_id: string
          training_type_id: string
        }
        Insert: {
          certificate_doc_id?: string | null
          completed_date?: string | null
          created_at?: string
          expiry_date?: string | null
          id?: string
          professional_id: string
          training_type_id: string
        }
        Update: {
          certificate_doc_id?: string | null
          completed_date?: string | null
          created_at?: string
          expiry_date?: string | null
          id?: string
          professional_id?: string
          training_type_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_training_cert"
            columns: ["certificate_doc_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_training_cert"
            columns: ["certificate_doc_id"]
            isOneToOne: false
            referencedRelation: "v_export_compliance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_training_records_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_training_records_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "v_export_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_training_records_training_type_id_fkey"
            columns: ["training_type_id"]
            isOneToOne: false
            referencedRelation: "mandatory_training_types"
            referencedColumns: ["id"]
          },
        ]
      }
      professionals: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          assessment_locked_until: string | null
          can_accept_bookings: boolean | null
          city: string | null
          compliance_status: Database["public"]["Enums"]["compliance_status"]
          created_at: string
          date_of_birth: string | null
          employment_status:
            | Database["public"]["Enums"]["employment_status"]
            | null
          full_name: string
          has_driving_licence: boolean | null
          has_vehicle: boolean | null
          id: string
          national_insurance_no: string | null
          postcode: string | null
          professional_role_id: string | null
          professional_status: Database["public"]["Enums"]["professional_status"]
          professional_summary: string | null
          profile_photo_path: string | null
          registration_body: string | null
          registration_number: string | null
          travel_distance_km: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          assessment_locked_until?: string | null
          can_accept_bookings?: boolean | null
          city?: string | null
          compliance_status?: Database["public"]["Enums"]["compliance_status"]
          created_at?: string
          date_of_birth?: string | null
          employment_status?:
            | Database["public"]["Enums"]["employment_status"]
            | null
          full_name: string
          has_driving_licence?: boolean | null
          has_vehicle?: boolean | null
          id?: string
          national_insurance_no?: string | null
          postcode?: string | null
          professional_role_id?: string | null
          professional_status?: Database["public"]["Enums"]["professional_status"]
          professional_summary?: string | null
          profile_photo_path?: string | null
          registration_body?: string | null
          registration_number?: string | null
          travel_distance_km?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          assessment_locked_until?: string | null
          can_accept_bookings?: boolean | null
          city?: string | null
          compliance_status?: Database["public"]["Enums"]["compliance_status"]
          created_at?: string
          date_of_birth?: string | null
          employment_status?:
            | Database["public"]["Enums"]["employment_status"]
            | null
          full_name?: string
          has_driving_licence?: boolean | null
          has_vehicle?: boolean | null
          id?: string
          national_insurance_no?: string | null
          postcode?: string | null
          professional_role_id?: string | null
          professional_status?: Database["public"]["Enums"]["professional_status"]
          professional_summary?: string | null
          profile_photo_path?: string | null
          registration_body?: string | null
          registration_number?: string | null
          travel_distance_km?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "professionals_professional_role_id_fkey"
            columns: ["professional_role_id"]
            isOneToOne: false
            referencedRelation: "professional_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professionals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_cards: {
        Row: {
          client_charge_rate: number
          created_at: string
          created_by: string | null
          currency: string
          effective_from: string
          effective_to: string | null
          id: string
          notes: string | null
          platform_fee_type: string
          platform_fee_value: number | null
          professional_payout_rate: number
          professional_role_id: string
        }
        Insert: {
          client_charge_rate: number
          created_at?: string
          created_by?: string | null
          currency?: string
          effective_from?: string
          effective_to?: string | null
          id?: string
          notes?: string | null
          platform_fee_type?: string
          platform_fee_value?: number | null
          professional_payout_rate: number
          professional_role_id: string
        }
        Update: {
          client_charge_rate?: number
          created_at?: string
          created_by?: string | null
          currency?: string
          effective_from?: string
          effective_to?: string | null
          id?: string
          notes?: string | null
          platform_fee_type?: string
          platform_fee_value?: number | null
          professional_payout_rate?: number
          professional_role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rate_cards_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rate_cards_professional_role_id_fkey"
            columns: ["professional_role_id"]
            isOneToOne: false
            referencedRelation: "professional_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      skills: {
        Row: {
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      stripe_webhook_events: {
        Row: {
          event_id: string
          event_type: string
          payment_id: string | null
          received_at: string
        }
        Insert: {
          event_id: string
          event_type: string
          payment_id?: string | null
          received_at?: string
        }
        Update: {
          event_id?: string
          event_type?: string
          payment_id?: string | null
          received_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stripe_webhook_events_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stripe_webhook_events_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "v_export_payments"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          account_status: Database["public"]["Enums"]["account_status"]
          account_type: Database["public"]["Enums"]["account_type"]
          created_at: string
          email: string
          id: string
          is_active: boolean
          is_founder: boolean
          last_login_at: string | null
          updated_at: string
        }
        Insert: {
          account_status?: Database["public"]["Enums"]["account_status"]
          account_type: Database["public"]["Enums"]["account_type"]
          created_at?: string
          email: string
          id: string
          is_active?: boolean
          is_founder?: boolean
          last_login_at?: string | null
          updated_at?: string
        }
        Update: {
          account_status?: Database["public"]["Enums"]["account_status"]
          account_type?: Database["public"]["Enums"]["account_type"]
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          is_founder?: boolean
          last_login_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      v_export_assessments: {
        Row: {
          attempt_number: number | null
          completed_at: string | null
          full_name: string | null
          id: string | null
          passed: boolean | null
          role: string | null
          score: number | null
          started_at: string | null
        }
        Relationships: []
      }
      v_export_audit: {
        Row: {
          action: string | null
          actor_type: string | null
          entity_id: string | null
          entity_type: string | null
          id: number | null
          occurred_at: string | null
          summary: string | null
        }
        Insert: {
          action?: string | null
          actor_type?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: number | null
          occurred_at?: string | null
          summary?: string | null
        }
        Update: {
          action?: string | null
          actor_type?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: number | null
          occurred_at?: string | null
          summary?: string | null
        }
        Relationships: []
      }
      v_export_bookings: {
        Row: {
          booking_type: string | null
          created_at: string | null
          duration_hours: number | null
          id: string | null
          location_address: string | null
          location_postcode: string | null
          platform_revenue: number | null
          role: string | null
          scheduled_end: string | null
          scheduled_start: string | null
          snap_currency: string | null
          status: Database["public"]["Enums"]["booking_status"] | null
          total_client_charge: number | null
          total_payout: number | null
        }
        Relationships: []
      }
      v_export_clients: {
        Row: {
          city: string | null
          created_at: string | null
          email_contact: string | null
          full_name: string | null
          id: string | null
          phone: string | null
          postcode: string | null
        }
        Insert: {
          city?: string | null
          created_at?: string | null
          email_contact?: string | null
          full_name?: string | null
          id?: string | null
          phone?: string | null
          postcode?: string | null
        }
        Update: {
          city?: string | null
          created_at?: string | null
          email_contact?: string | null
          full_name?: string | null
          id?: string | null
          phone?: string | null
          postcode?: string | null
        }
        Relationships: []
      }
      v_export_compliance: {
        Row: {
          document_type: string | null
          expiry_date: string | null
          full_name: string | null
          id: string | null
          is_compliance_critical: boolean | null
          issued_date: string | null
          issuing_body: string | null
          reference_number: string | null
          verification_status:
            | Database["public"]["Enums"]["document_status"]
            | null
        }
        Relationships: []
      }
      v_export_organisations: {
        Row: {
          billing_email: string | null
          city: string | null
          contact_person: string | null
          cqc_registration_number: string | null
          created_at: string | null
          email_contact: string | null
          id: string | null
          organisation_name: string | null
          phone: string | null
          postcode: string | null
        }
        Insert: {
          billing_email?: string | null
          city?: string | null
          contact_person?: string | null
          cqc_registration_number?: string | null
          created_at?: string | null
          email_contact?: string | null
          id?: string | null
          organisation_name?: string | null
          phone?: string | null
          postcode?: string | null
        }
        Update: {
          billing_email?: string | null
          city?: string | null
          contact_person?: string | null
          cqc_registration_number?: string | null
          created_at?: string | null
          email_contact?: string | null
          id?: string | null
          organisation_name?: string | null
          phone?: string | null
          postcode?: string | null
        }
        Relationships: []
      }
      v_export_payments: {
        Row: {
          amount: number | null
          booking_id: string | null
          created_at: string | null
          currency: string | null
          id: string | null
          paid_at: string | null
          status: Database["public"]["Enums"]["payment_status"] | null
        }
        Insert: {
          amount?: number | null
          booking_id?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string | null
          paid_at?: string | null
          status?: Database["public"]["Enums"]["payment_status"] | null
        }
        Update: {
          amount?: number | null
          booking_id?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string | null
          paid_at?: string | null
          status?: Database["public"]["Enums"]["payment_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_export_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_platform_revenue"
            referencedColumns: ["booking_id"]
          },
        ]
      }
      v_export_payouts: {
        Row: {
          amount: number | null
          booking_id: string | null
          currency: string | null
          full_name: string | null
          id: string | null
          method: string | null
          paid_at: string | null
          recorded_at: string | null
          reference: string | null
          status: Database["public"]["Enums"]["payout_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "payouts_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payouts_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_export_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payouts_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "v_platform_revenue"
            referencedColumns: ["booking_id"]
          },
        ]
      }
      v_export_professionals: {
        Row: {
          can_accept_bookings: boolean | null
          city: string | null
          compliance_status:
            | Database["public"]["Enums"]["compliance_status"]
            | null
          created_at: string | null
          employment_status:
            | Database["public"]["Enums"]["employment_status"]
            | null
          full_name: string | null
          id: string | null
          postcode: string | null
          professional_status:
            | Database["public"]["Enums"]["professional_status"]
            | null
          role: string | null
        }
        Relationships: []
      }
      v_platform_revenue: {
        Row: {
          booking_id: string | null
          platform_revenue: number | null
          scheduled_start: string | null
          snap_currency: string | null
          status: Database["public"]["Enums"]["booking_status"] | null
          total_client_charge: number | null
          total_payout: number | null
        }
        Insert: {
          booking_id?: string | null
          platform_revenue?: never
          scheduled_start?: string | null
          snap_currency?: string | null
          status?: Database["public"]["Enums"]["booking_status"] | null
          total_client_charge?: number | null
          total_payout?: number | null
        }
        Update: {
          booking_id?: string | null
          platform_revenue?: never
          scheduled_start?: string | null
          snap_currency?: string | null
          status?: Database["public"]["Enums"]["booking_status"] | null
          total_client_charge?: number | null
          total_payout?: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      amend_rate_card: {
        Args: {
          p_admin_id: string
          p_charge: number
          p_currency: string
          p_fee_type: string
          p_fee_value: number
          p_payout: number
          p_role_id: string
        }
        Returns: string
      }
      fn_anonymise_user: { Args: { p_admin_id: string; p_user_id: string }; Returns: undefined }
      fn_run_compliance_sweep: { Args: never; Returns: undefined }
      get_payout_last4: { Args: { p_professional_id: string }; Returns: string }
      is_admin: { Args: never; Returns: boolean }
      set_payout_details: {
        Args: {
          p_account_name: string
          p_account_number: string
          p_key: string
          p_professional_id: string
          p_sort_code: string
        }
        Returns: undefined
      }
    }
    Enums: {
      account_status: "active" | "suspended" | "deactivated"
      account_type: "professional" | "private_client" | "organisation" | "admin"
      assessment_topic:
        | "safeguarding"
        | "infection_prevention_control"
        | "gdpr_confidentiality"
        | "professional_boundaries"
        | "documentation_record_keeping"
        | "medication_awareness"
        | "health_safety"
        | "role_specific"
      booking_status:
        | "open"
        | "assigned"
        | "accepted"
        | "confirmed"
        | "in_progress"
        | "completed"
        | "cancelled"
        | "no_show"
      compliance_status:
        | "pending_review"
        | "approved"
        | "rejected"
        | "compliance_expired"
        | "further_info_required"
      document_status:
        | "pending_review"
        | "approved"
        | "rejected"
        | "expired"
        | "further_info_required"
      employment_status:
        | "nhs_employed"
        | "private_sector_employed"
        | "self_employed"
        | "not_employed_in_healthcare"
      payment_status:
        | "pending"
        | "requires_action"
        | "succeeded"
        | "failed"
        | "refunded"
      payout_status: "pending" | "recorded" | "paid"
      professional_status:
        | "pending_verification"
        | "active"
        | "compliance_hold"
        | "booking_restricted"
        | "temporarily_suspended"
        | "under_investigation"
        | "rejected"
        | "removed"
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
      account_status: ["active", "suspended", "deactivated"],
      account_type: ["professional", "private_client", "organisation", "admin"],
      assessment_topic: [
        "safeguarding",
        "infection_prevention_control",
        "gdpr_confidentiality",
        "professional_boundaries",
        "documentation_record_keeping",
        "medication_awareness",
        "health_safety",
        "role_specific",
      ],
      booking_status: [
        "open",
        "assigned",
        "accepted",
        "confirmed",
        "in_progress",
        "completed",
        "cancelled",
        "no_show",
      ],
      compliance_status: [
        "pending_review",
        "approved",
        "rejected",
        "compliance_expired",
        "further_info_required",
      ],
      document_status: [
        "pending_review",
        "approved",
        "rejected",
        "expired",
        "further_info_required",
      ],
      employment_status: [
        "nhs_employed",
        "private_sector_employed",
        "self_employed",
        "not_employed_in_healthcare",
      ],
      payment_status: [
        "pending",
        "requires_action",
        "succeeded",
        "failed",
        "refunded",
      ],
      payout_status: ["pending", "recorded", "paid"],
      professional_status: [
        "pending_verification",
        "active",
        "compliance_hold",
        "booking_restricted",
        "temporarily_suspended",
        "under_investigation",
        "rejected",
        "removed",
      ],
    },
  },
} as const
