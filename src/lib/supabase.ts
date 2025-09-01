import { createClient } from '@supabase/supabase-js'

// Safely access environment variables with fallbacks
const supabaseUrl = typeof window !== 'undefined' 
  ? (window as any).NEXT_PUBLIC_SUPABASE_URL 
  : (typeof process !== 'undefined' ? process.env?.NEXT_PUBLIC_SUPABASE_URL : '') || ''

const supabaseAnonKey = typeof window !== 'undefined' 
  ? (window as any).NEXT_PUBLIC_SUPABASE_ANON_KEY 
  : (typeof process !== 'undefined' ? process.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY : '') || ''

// Create a mock client if environment variables are not available
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createClient('https://mock.supabase.co', 'mock-key')

// Helper function to check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  return !!(supabaseUrl && supabaseAnonKey && supabaseUrl !== 'https://mock.supabase.co')
}

// Types for our database
export interface User {
  id: string
  phone: string
  name: string
  email?: string
  google_id?: string
  is_clinic_staff: boolean
  created_at: string
  updated_at: string
}

export interface Clinic {
  id: string
  name: string
  address: string
  phone?: string
  specialties: string[]
  rating: number
  total_reviews: number
  booking_type: 'time_based' | 'day_based'
  opens_at?: string
  closes_at?: string
  is_active: boolean
  latitude?: number
  longitude?: number
  created_at: string
  updated_at: string
}

export interface Doctor {
  id: string
  clinic_id: string
  name: string
  specialization?: string
  status: 'available' | 'with_patient' | 'not_arrived' | 'break'
  created_at: string
  updated_at: string
}

export interface Appointment {
  id: string
  user_id: string
  clinic_id: string
  doctor_id?: string
  patient_name: string
  patient_phone: string
  patient_age?: number
  appointment_date: string
  appointment_time?: string
  token_number: string
  queue_position: number
  status: 'upcoming' | 'completed' | 'cancelled' | 'no_show'
  created_at: string
  updated_at: string
  // Joined data
  clinic?: Clinic
  doctor?: Doctor
}

export interface FamilyMember {
  id: string
  user_id: string
  name: string
  age: number
  relationship?: string
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: 'appointment_reminder' | 'queue_update' | 'doctor_arrival' | 'next_in_queue' | 'general'
  is_read: boolean
  appointment_id?: string
  created_at: string
  appointment?: Appointment
}

export interface QueueStatus {
  id: string
  clinic_id: string
  current_token: string
  total_tokens: number
  updated_at: string
}

export interface RecentVisit {
  id: string
  user_id: string
  clinic_id: string
  last_visit: string
  total_visits: number
  clinic?: Clinic
}

export interface ActivityLog {
  id: string
  user_id: string
  action: string
  details?: any
  created_at: string
}