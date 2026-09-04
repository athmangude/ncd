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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      care_fund_transactions: {
        Row: {
          created_at: string | null
          currency: Json
          description: string | null
          expires_at: string | null
          id: string
          loan: Json | null
          receiver: Json | null
          receiver_phone_number: string | null
          sender: Json | null
          status: string | null
          transaction_amount: number
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          currency: Json
          description?: string | null
          expires_at?: string | null
          id: string
          loan?: Json | null
          receiver?: Json | null
          receiver_phone_number?: string | null
          sender?: Json | null
          status?: string | null
          transaction_amount: number
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          currency?: Json
          description?: string | null
          expires_at?: string | null
          id?: string
          loan?: Json | null
          receiver?: Json | null
          receiver_phone_number?: string | null
          sender?: Json | null
          status?: string | null
          transaction_amount?: number
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      circle_activity: {
        Row: {
          acknowledged_at: string | null
          event_type: string
          id: string
          invite_id: string | null
          member: Json
          occurred_at: string
          still_qualifies_for_borrowing: boolean | null
          user_id: string
        }
        Insert: {
          acknowledged_at?: string | null
          event_type: string
          id: string
          invite_id?: string | null
          member: Json
          occurred_at: string
          still_qualifies_for_borrowing?: boolean | null
          user_id: string
        }
        Update: {
          acknowledged_at?: string | null
          event_type?: string
          id?: string
          invite_id?: string | null
          member?: Json
          occurred_at?: string
          still_qualifies_for_borrowing?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      country_codes: {
        Row: {
          calling_code: string
          country_code: string
          name: string
        }
        Insert: {
          calling_code: string
          country_code: string
          name: string
        }
        Update: {
          calling_code?: string
          country_code?: string
          name?: string
        }
        Relationships: []
      }
      discount_codes: {
        Row: {
          code: string
          context: string
          currency: Json
          description: string | null
          discount_amount: string | null
          discount_type: string
          discount_value: string
          id: number
          is_active: boolean | null
          is_valid: boolean | null
          maximum_discount_amount: string | null
          minimum_order_amount: string | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          code: string
          context: string
          currency: Json
          description?: string | null
          discount_amount?: string | null
          discount_type: string
          discount_value: string
          id: number
          is_active?: boolean | null
          is_valid?: boolean | null
          maximum_discount_amount?: string | null
          minimum_order_amount?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          code?: string
          context?: string
          currency?: Json
          description?: string | null
          discount_amount?: string | null
          discount_type?: string
          discount_value?: string
          id?: number
          is_active?: boolean | null
          is_valid?: boolean | null
          maximum_discount_amount?: string | null
          minimum_order_amount?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: []
      }
      education_content: {
        Row: {
          body: string
          category: string
          conditions: string[] | null
          content_type: string
          created_at: string | null
          estimated_minutes: number | null
          id: string
          image_theme: string | null
          learning_objectives: string[] | null
          sections: Json | null
          slug: string
          summary: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          body: string
          category: string
          conditions?: string[] | null
          content_type: string
          created_at?: string | null
          estimated_minutes?: number | null
          id?: string
          image_theme?: string | null
          learning_objectives?: string[] | null
          sections?: Json | null
          slug: string
          summary?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          body?: string
          category?: string
          conditions?: string[] | null
          content_type?: string
          created_at?: string | null
          estimated_minutes?: number | null
          id?: string
          image_theme?: string | null
          learning_objectives?: string[] | null
          sections?: Json | null
          slug?: string
          summary?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      education_progress: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          content_id: string
          current_section: number | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          content_id: string
          current_section?: number | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          content_id?: string
          current_section?: number | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "education_progress_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "education_content"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string | null
          data: Json
          id: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          data: Json
          id?: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          data?: Json
          id?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      facilities: {
        Row: {
          active_discount: Json | null
          bed_capacity: number | null
          closing_time: string | null
          county: string
          created_at: string | null
          discount_percentage: string | null
          distance: number | null
          facility_level: string | null
          facility_type: string
          has_active_discount: boolean | null
          id: number
          is_onboarded: boolean | null
          latitude: number | null
          linked_facility: Json | null
          location_name: string | null
          longitude: number | null
          name: string
          phone_number: string | null
          place_image_url: string | null
          plot_number: string | null
          po_box: string | null
          rating: number | null
          registration_number: string | null
          service_categories: string[] | null
          status: string | null
          updated_at: string | null
          verification_status: string | null
        }
        Insert: {
          active_discount?: Json | null
          bed_capacity?: number | null
          closing_time?: string | null
          county: string
          created_at?: string | null
          discount_percentage?: string | null
          distance?: number | null
          facility_level?: string | null
          facility_type: string
          has_active_discount?: boolean | null
          id: number
          is_onboarded?: boolean | null
          latitude?: number | null
          linked_facility?: Json | null
          location_name?: string | null
          longitude?: number | null
          name: string
          phone_number?: string | null
          place_image_url?: string | null
          plot_number?: string | null
          po_box?: string | null
          rating?: number | null
          registration_number?: string | null
          service_categories?: string[] | null
          status?: string | null
          updated_at?: string | null
          verification_status?: string | null
        }
        Update: {
          active_discount?: Json | null
          bed_capacity?: number | null
          closing_time?: string | null
          county?: string
          created_at?: string | null
          discount_percentage?: string | null
          distance?: number | null
          facility_level?: string | null
          facility_type?: string
          has_active_discount?: boolean | null
          id?: number
          is_onboarded?: boolean | null
          latitude?: number | null
          linked_facility?: Json | null
          location_name?: string | null
          longitude?: number | null
          name?: string
          phone_number?: string | null
          place_image_url?: string | null
          plot_number?: string | null
          po_box?: string | null
          rating?: number | null
          registration_number?: string | null
          service_categories?: string[] | null
          status?: string | null
          updated_at?: string | null
          verification_status?: string | null
        }
        Relationships: []
      }
      facility_reviews: {
        Row: {
          could_do_better: string | null
          created_at: string | null
          facility_id: number
          id: string
          loved_most: string | null
          make_it_a_ten: string | null
          nps_score: number
          payment_id: string
          user_id: string
        }
        Insert: {
          could_do_better?: string | null
          created_at?: string | null
          facility_id: number
          id: string
          loved_most?: string | null
          make_it_a_ten?: string | null
          nps_score: number
          payment_id: string
          user_id: string
        }
        Update: {
          could_do_better?: string | null
          created_at?: string | null
          facility_id?: number
          id?: string
          loved_most?: string | null
          make_it_a_ten?: string | null
          nps_score?: number
          payment_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "facility_reviews_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
        ]
      }
      facility_services: {
        Row: {
          category: string
          code: string
          facility_id: number
          id: string
          name: string
        }
        Insert: {
          category: string
          code: string
          facility_id: number
          id: string
          name: string
        }
        Update: {
          category?: string
          code?: string
          facility_id?: number
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "facility_services_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
        ]
      }
      fast_track_providers: {
        Row: {
          created_at: string | null
          facility: Json
          id: number
          is_active: boolean | null
          name: string
          payment_code: string
          payment_number: string
          sms_phone_numbers: string[] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          facility: Json
          id: number
          is_active?: boolean | null
          name: string
          payment_code: string
          payment_number: string
          sms_phone_numbers?: string[] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          facility?: Json
          id?: number
          is_active?: boolean | null
          name?: string
          payment_code?: string
          payment_number?: string
          sms_phone_numbers?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      guarantor_invites: {
        Row: {
          data: Json
          user_id: string
        }
        Insert: {
          data: Json
          user_id: string
        }
        Update: {
          data?: Json
          user_id?: string
        }
        Relationships: []
      }
      link_social_options: {
        Row: {
          label: string
          provider: string
        }
        Insert: {
          label: string
          provider: string
        }
        Update: {
          label?: string
          provider?: string
        }
        Relationships: []
      }
      loans: {
        Row: {
          accumulated_interest_amount: number | null
          amount: number
          care_fund_discount_amount: number | null
          created_at: string | null
          currency: Json
          first_payment_due: string | null
          id: string
          late_fees: number | null
          loan_due_date: string | null
          loan_type: string | null
          outstanding_amount: number | null
          patient_medical_info_request: Json | null
          patient_name: string | null
          status: string | null
          total_bill_amount: number
          total_paid: number | null
          transactions: Json | null
          user_id: string
        }
        Insert: {
          accumulated_interest_amount?: number | null
          amount: number
          care_fund_discount_amount?: number | null
          created_at?: string | null
          currency: Json
          first_payment_due?: string | null
          id: string
          late_fees?: number | null
          loan_due_date?: string | null
          loan_type?: string | null
          outstanding_amount?: number | null
          patient_medical_info_request?: Json | null
          patient_name?: string | null
          status?: string | null
          total_bill_amount: number
          total_paid?: number | null
          transactions?: Json | null
          user_id: string
        }
        Update: {
          accumulated_interest_amount?: number | null
          amount?: number
          care_fund_discount_amount?: number | null
          created_at?: string | null
          currency?: Json
          first_payment_due?: string | null
          id?: string
          late_fees?: number | null
          loan_due_date?: string | null
          loan_type?: string | null
          outstanding_amount?: number | null
          patient_medical_info_request?: Json | null
          patient_name?: string | null
          status?: string | null
          total_bill_amount?: number
          total_paid?: number | null
          transactions?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      manual_requests: {
        Row: {
          bill_amount: string
          care_provider_name: string
          created_at: string | null
          dependent: Json | null
          id: string
          invoice_file: Json | null
          kmpdc_facility: Json | null
          patient: Json | null
          payment_info: Json | null
          reason: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          bill_amount: string
          care_provider_name: string
          created_at?: string | null
          dependent?: Json | null
          id: string
          invoice_file?: Json | null
          kmpdc_facility?: Json | null
          patient?: Json | null
          payment_info?: Json | null
          reason?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          bill_amount?: string
          care_provider_name?: string
          created_at?: string | null
          dependent?: Json | null
          id?: string
          invoice_file?: Json | null
          kmpdc_facility?: Json | null
          patient?: Json | null
          payment_info?: Json | null
          reason?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      medication_cards: {
        Row: {
          content: Json
          created_at: string | null
          id: string
          medication_id: string
          slug: string
          user_id: string
        }
        Insert: {
          content: Json
          created_at?: string | null
          id?: string
          medication_id: string
          slug: string
          user_id: string
        }
        Update: {
          content?: Json
          created_at?: string | null
          id?: string
          medication_id?: string
          slug?: string
          user_id?: string
        }
        Relationships: []
      }
      medication_taxonomy: {
        Row: {
          category: string
          common_brands: string[] | null
          condition_tags: string[] | null
          dosage_form: string | null
          generic_name: string | null
          id: string
          interactions: string[] | null
          is_controlled: boolean | null
          name: string
          notes: string | null
          price_kes: number | null
          requires_prescription: boolean | null
          side_effects: string[] | null
          storage: string | null
          strength: string | null
          sub_category: string | null
          unit: string | null
        }
        Insert: {
          category: string
          common_brands?: string[] | null
          condition_tags?: string[] | null
          dosage_form?: string | null
          generic_name?: string | null
          id: string
          interactions?: string[] | null
          is_controlled?: boolean | null
          name: string
          notes?: string | null
          price_kes?: number | null
          requires_prescription?: boolean | null
          side_effects?: string[] | null
          storage?: string | null
          strength?: string | null
          sub_category?: string | null
          unit?: string | null
        }
        Update: {
          category?: string
          common_brands?: string[] | null
          condition_tags?: string[] | null
          dosage_form?: string | null
          generic_name?: string | null
          id?: string
          interactions?: string[] | null
          is_controlled?: boolean | null
          name?: string
          notes?: string | null
          price_kes?: number | null
          requires_prescription?: boolean | null
          side_effects?: string[] | null
          storage?: string | null
          strength?: string | null
          sub_category?: string | null
          unit?: string | null
        }
        Relationships: []
      }
      network_invites: {
        Row: {
          created_at: string | null
          first_name: string
          id: string
          invite_link: string | null
          last_name: string
          nickname: string | null
          phone_number: string | null
          profile_photo: string | null
          relationship: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          first_name: string
          id: string
          invite_link?: string | null
          last_name: string
          nickname?: string | null
          phone_number?: string | null
          profile_photo?: string | null
          relationship?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          first_name?: string
          id?: string
          invite_link?: string | null
          last_name?: string
          nickname?: string | null
          phone_number?: string | null
          profile_photo?: string | null
          relationship?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      network_members: {
        Row: {
          first_name: string
          has_defaulted_loan: boolean | null
          id: string
          joined_at: string | null
          last_name: string
          nickname: string | null
          phone_number: string | null
          profile_photo: string | null
          relationship: string
          status: string | null
          type: string
          user_id: string
        }
        Insert: {
          first_name: string
          has_defaulted_loan?: boolean | null
          id: string
          joined_at?: string | null
          last_name: string
          nickname?: string | null
          phone_number?: string | null
          profile_photo?: string | null
          relationship: string
          status?: string | null
          type: string
          user_id: string
        }
        Update: {
          first_name?: string
          has_defaulted_loan?: boolean | null
          id?: string
          joined_at?: string | null
          last_name?: string
          nickname?: string | null
          phone_number?: string | null
          profile_photo?: string | null
          relationship?: string
          status?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          deep_link: string | null
          id: string
          metadata: Json | null
          read_at: string | null
          sent_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          deep_link?: string | null
          id?: string
          metadata?: Json | null
          read_at?: string | null
          sent_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          deep_link?: string | null
          id?: string
          metadata?: Json | null
          read_at?: string | null
          sent_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      patient_details: {
        Row: {
          data: Json
          updated_at: string | null
          user_id: string
        }
        Insert: {
          data: Json
          updated_at?: string | null
          user_id: string
        }
        Update: {
          data?: Json
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          cashback_amount: number | null
          cashback_details: Json | null
          created_at: string | null
          currency: string | null
          description: string | null
          disbursement_transaction: Json | null
          facility_id: number | null
          facility_name: string
          facility_type: string | null
          funding_sources: Json | null
          id: string
          line_items: Json | null
          patient_medical_info_request: Json | null
          payment_splits: Json | null
          status: string | null
          user_id: string
          user_info: Json | null
        }
        Insert: {
          amount: number
          cashback_amount?: number | null
          cashback_details?: Json | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          disbursement_transaction?: Json | null
          facility_id?: number | null
          facility_name: string
          facility_type?: string | null
          funding_sources?: Json | null
          id?: string
          line_items?: Json | null
          patient_medical_info_request?: Json | null
          payment_splits?: Json | null
          status?: string | null
          user_id: string
          user_info?: Json | null
        }
        Update: {
          amount?: number
          cashback_amount?: number | null
          cashback_details?: Json | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          disbursement_transaction?: Json | null
          facility_id?: number | null
          facility_name?: string
          facility_type?: string | null
          funding_sources?: Json | null
          id?: string
          line_items?: Json | null
          patient_medical_info_request?: Json | null
          payment_splits?: Json | null
          status?: string | null
          user_id?: string
          user_info?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
        ]
      }
      pharmacy_stock: {
        Row: {
          facility_id: number
          id: string
          last_verified_at: string | null
          medication_name: string
          price_kes: number | null
          status: string
        }
        Insert: {
          facility_id: number
          id: string
          last_verified_at?: string | null
          medication_name: string
          price_kes?: number | null
          status: string
        }
        Update: {
          facility_id?: number
          id?: string
          last_verified_at?: string | null
          medication_name?: string
          price_kes?: number | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "pharmacy_stock_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
        ]
      }
      preferred_providers: {
        Row: {
          created_at: string | null
          facility_id: number
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          facility_id: number
          id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          facility_id?: number
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "preferred_providers_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          challenges: Json | null
          completed_at: string | null
          conditions: string[] | null
          conditions_other_description: string | null
          coping: Json | null
          cost_estimates: Json | null
          created_at: string | null
          diagnosis_recency: string | null
          first_name: string | null
          goals: string[] | null
          id: string
          last_name: string | null
          patient_relationship: string | null
          phone: string
          recurring_tests: Json | null
          treatment: Json | null
          updated_at: string | null
          user_role: string | null
        }
        Insert: {
          challenges?: Json | null
          completed_at?: string | null
          conditions?: string[] | null
          conditions_other_description?: string | null
          coping?: Json | null
          cost_estimates?: Json | null
          created_at?: string | null
          diagnosis_recency?: string | null
          first_name?: string | null
          goals?: string[] | null
          id: string
          last_name?: string | null
          patient_relationship?: string | null
          phone: string
          recurring_tests?: Json | null
          treatment?: Json | null
          updated_at?: string | null
          user_role?: string | null
        }
        Update: {
          challenges?: Json | null
          completed_at?: string | null
          conditions?: string[] | null
          conditions_other_description?: string | null
          coping?: Json | null
          cost_estimates?: Json | null
          created_at?: string | null
          diagnosis_recency?: string | null
          first_name?: string | null
          goals?: string[] | null
          id?: string
          last_name?: string | null
          patient_relationship?: string | null
          phone?: string
          recurring_tests?: Json | null
          treatment?: Json | null
          updated_at?: string | null
          user_role?: string | null
        }
        Relationships: []
      }
      recent_searches: {
        Row: {
          created_at: string | null
          facility_id: number
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          facility_id: number
          id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          facility_id?: number
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recent_searches_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
        ]
      }
      recurring_tests: {
        Row: {
          category: string
          condition_tags: string[] | null
          description: string | null
          estimated_cost_kes: number | null
          frequency_months: number | null
          id: string
          name: string
        }
        Insert: {
          category: string
          condition_tags?: string[] | null
          description?: string | null
          estimated_cost_kes?: number | null
          frequency_months?: number | null
          id: string
          name: string
        }
        Update: {
          category?: string
          condition_tags?: string[] | null
          description?: string | null
          estimated_cost_kes?: number | null
          frequency_months?: number | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      refill_schedules: {
        Row: {
          created_at: string | null
          frequency_days: number
          id: string
          medication_name: string
          next_date: string
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          frequency_days: number
          id?: string
          medication_name: string
          next_date: string
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          frequency_days?: number
          id?: string
          medication_name?: string
          next_date?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      service_categories: {
        Row: {
          category: string
          count: number | null
          display_name: string
        }
        Insert: {
          category: string
          count?: number | null
          display_name: string
        }
        Update: {
          category?: string
          count?: number | null
          display_name?: string
        }
        Relationships: []
      }
      test_schedules: {
        Row: {
          created_at: string | null
          frequency_months: number
          id: string
          next_date: string
          status: string | null
          test_name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          frequency_months: number
          id?: string
          next_date: string
          status?: string | null
          test_name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          frequency_months?: number
          id?: string
          next_date?: string
          status?: string | null
          test_name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      wallets: {
        Row: {
          cashback_balance: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cashback_balance?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cashback_balance?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_otp_for_phone: { Args: { phone_number: string }; Returns: string }
      rpc_activate_membership: { Args: never; Returns: Json }
      rpc_apply_for_loan: {
        Args: {
          p_amount: number
          p_currency?: string
          p_facility_name: string
          p_facility_type: string
        }
        Returns: Json
      }
      rpc_care_fund_transfer: {
        Args: {
          p_amount: number
          p_description?: string
          p_receiver_phone: string
        }
        Returns: Json
      }
      rpc_fast_track_initiate: {
        Args: {
          p_amount: number
          p_funding_sources: Json
          p_provider_id: number
        }
        Returns: Json
      }
      rpc_initiate_multi_payment: {
        Args: {
          p_amount: number
          p_currency?: string
          p_facility_name: string
          p_facility_type: string
          p_funding_sources: Json
          p_line_items?: Json
        }
        Returns: Json
      }
      rpc_initiate_repayment: {
        Args: { p_amount: number; p_loan_id: string }
        Returns: Json
      }
      rpc_reset_to_onboarding: { Args: never; Returns: Json }
      rpc_seed_at_stage: { Args: { p_stage: string }; Returns: Json }
      rpc_seed_demo_account: { Args: never; Returns: Json }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
