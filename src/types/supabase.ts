export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      outage_reports: {
        Row: {
          id: string
          website_id: string
          latitude: number
          longitude: number
          timestamp: string
          status: string
          location_city: string | null
          location_country: string | null
          report_count: number
        }
        Insert: {
          id?: string
          website_id: string
          latitude: number
          longitude: number
          timestamp?: string
          status: string
          location_city?: string | null
          location_country?: string | null
          report_count?: number
        }
        Update: {
          id?: string
          website_id?: string
          latitude?: number
          longitude?: number
          timestamp?: string
          status?: string
          location_city?: string | null
          location_country?: string | null
          report_count?: number
        }
      }
      websites: {
        Row: {
          id: string
          url: string
          status: string
          last_checked: string
          response_time: number | null
          name: string | null
        }
        Insert: {
          id?: string
          url: string
          status: string
          last_checked?: string
          response_time?: number | null
          name?: string | null
        }
        Update: {
          id?: string
          url?: string
          status?: string
          last_checked?: string
          response_time?: number | null
          name?: string | null
        }
      }
      incidents: {
        Row: {
          id: string
          website_id: string
          website_url: string
          type: string
          timestamp: string
          ip_address: string
          location_city: string | null
          location_country: string | null
          me_too_count: number
          related_incident_id: string | null
        }
        Insert: {
          id?: string
          website_id: string
          website_url: string
          type: string
          timestamp?: string
          ip_address: string
          location_city?: string | null
          location_country?: string | null
          me_too_count?: number
          related_incident_id?: string | null
        }
        Update: {
          id?: string
          website_id?: string
          website_url?: string
          type?: string
          timestamp?: string
          ip_address?: string
          location_city?: string | null
          location_country?: string | null
          me_too_count?: number
          related_incident_id?: string | null
        }
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