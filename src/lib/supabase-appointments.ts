import { supabase, isSupabaseConfigured } from './supabase'
import type { Appointment, Clinic, Doctor, QueueStatus } from './supabase'

// Get user appointments
export const getUserAppointments = async (userId: string) => {
  if (!isSupabaseConfigured()) {
    return { success: true, appointments: [] }
  }

  try {
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        clinic:clinics(*),
        doctor:doctors(*)
      `)
      .eq('user_id', userId)
      .order('appointment_date', { ascending: true })

    if (error) throw error
    return { success: true, appointments: data }
  } catch (error) {
    console.error('Error getting appointments:', error)
    return { success: false, error, appointments: [] }
  }
}

// Create appointment
export const createAppointment = async (appointmentData: {
  user_id: string
  clinic_id: string
  doctor_id?: string
  patient_name: string
  patient_phone: string
  patient_age?: number
  appointment_date: string
  appointment_time?: string
}) => {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase not configured' }
  }

  try {
    // Get clinic to determine booking type
    const { data: clinic } = await supabase
      .from('clinics')
      .select('booking_type')
      .eq('id', appointmentData.clinic_id)
      .single()

    // Generate token number
    const tokenNumber = await generateTokenNumber(appointmentData.clinic_id, appointmentData.appointment_date)
    
    // Get queue position
    const queuePosition = await getNextQueuePosition(appointmentData.clinic_id, appointmentData.appointment_date)

    const { data, error } = await supabase
      .from('appointments')
      .insert({
        ...appointmentData,
        token_number: tokenNumber,
        queue_position: queuePosition
      })
      .select(`
        *,
        clinic:clinics(*),
        doctor:doctors(*)
      `)
      .single()

    if (error) throw error

    // Update recent visits
    await updateRecentVisit(appointmentData.user_id, appointmentData.clinic_id)

    return { success: true, appointment: data }
  } catch (error) {
    console.error('Error creating appointment:', error)
    return { success: false, error }
  }
}

// Cancel appointment
export const cancelAppointment = async (appointmentId: string, userId: string) => {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase not configured' }
  }

  try {
    const { data, error } = await supabase
      .from('appointments')
      .update({ status: 'cancelled' })
      .eq('id', appointmentId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error

    // The queue position update will be handled by the database trigger
    return { success: true, appointment: data }
  } catch (error) {
    console.error('Error cancelling appointment:', error)
    return { success: false, error }
  }
}

// Get clinics
export const getClinics = async (searchQuery?: string, specialties?: string[]) => {
  if (!isSupabaseConfigured()) {
    return { success: true, clinics: [] }
  }

  try {
    let query = supabase
      .from('clinics')
      .select('*')
      .eq('is_active', true)

    if (searchQuery) {
      query = query.or(`name.ilike.%${searchQuery}%,address.ilike.%${searchQuery}%`)
    }

    if (specialties && specialties.length > 0) {
      query = query.overlaps('specialties', specialties)
    }

    const { data, error } = await query.order('rating', { ascending: false })

    if (error) throw error
    return { success: true, clinics: data }
  } catch (error) {
    console.error('Error getting clinics:', error)
    return { success: false, error, clinics: [] }
  }
}

// Get clinic details with doctors
export const getClinicDetails = async (clinicId: string) => {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase not configured' }
  }

  try {
    const { data: clinic, error: clinicError } = await supabase
      .from('clinics')
      .select('*')
      .eq('id', clinicId)
      .single()

    if (clinicError) throw clinicError

    const { data: doctors, error: doctorsError } = await supabase
      .from('doctors')
      .select('*')
      .eq('clinic_id', clinicId)

    if (doctorsError) throw doctorsError

    const { data: queueStatus, error: queueError } = await supabase
      .from('queue_status')
      .select('*')
      .eq('clinic_id', clinicId)
      .single()

    // Queue status might not exist yet
    const queue = queueError ? null : queueStatus

    return { 
      success: true, 
      clinic: { ...clinic, doctors, queueStatus: queue }
    }
  } catch (error) {
    console.error('Error getting clinic details:', error)
    return { success: false, error }
  }
}

// Subscribe to real-time queue updates
export const subscribeToQueueUpdates = (clinicId: string, callback: (payload: any) => void) => {
  if (!isSupabaseConfigured()) {
    return { unsubscribe: () => {} } // Mock subscription
  }

  return supabase
    .channel(`queue-${clinicId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'queue_status',
        filter: `clinic_id=eq.${clinicId}`
      },
      callback
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'appointments',
        filter: `clinic_id=eq.${clinicId}`
      },
      callback
    )
    .subscribe()
}

// Helper functions
const generateTokenNumber = async (clinicId: string, date: string): Promise<string> => {
  if (!isSupabaseConfigured()) {
    return 'A001'
  }

  const { data, error } = await supabase
    .from('appointments')
    .select('token_number')
    .eq('clinic_id', clinicId)
    .eq('appointment_date', date)
    .order('created_at', { ascending: false })
    .limit(1)

  if (error || !data || data.length === 0) {
    return 'A001'
  }

  const lastToken = data[0].token_number
  const lastNumber = parseInt(lastToken.slice(1))
  const nextNumber = lastNumber + 1
  
  return `A${nextNumber.toString().padStart(3, '0')}`
}

const getNextQueuePosition = async (clinicId: string, date: string): Promise<number> => {
  if (!isSupabaseConfigured()) {
    return 1
  }

  const { data, error } = await supabase
    .from('appointments')
    .select('queue_position')
    .eq('clinic_id', clinicId)
    .eq('appointment_date', date)
    .eq('status', 'upcoming')
    .order('queue_position', { ascending: false })
    .limit(1)

  if (error || !data || data.length === 0) {
    return 1
  }

  return data[0].queue_position + 1
}

const updateRecentVisit = async (userId: string, clinicId: string) => {
  if (!isSupabaseConfigured()) {
    return
  }

  try {
    const { data: existing } = await supabase
      .from('recent_visits')
      .select('*')
      .eq('user_id', userId)
      .eq('clinic_id', clinicId)
      .single()

    if (existing) {
      await supabase
        .from('recent_visits')
        .update({
          last_visit: new Date().toISOString(),
          total_visits: existing.total_visits + 1
        })
        .eq('id', existing.id)
    } else {
      await supabase
        .from('recent_visits')
        .insert({
          user_id: userId,
          clinic_id: clinicId,
          total_visits: 1
        })
    }
  } catch (error) {
    console.error('Error updating recent visit:', error)
  }
}