import { supabase, isSupabaseConfigured } from './supabase'
import type { Notification } from './supabase'

// Get user notifications
export const getUserNotifications = async (userId: string) => {
  if (!isSupabaseConfigured()) {
    return { success: true, notifications: [] }
  }

  try {
    const { data, error } = await supabase
      .from('notifications')
      .select(`
        *,
        appointment:appointments(
          *,
          clinic:clinics(*),
          doctor:doctors(*)
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return { success: true, notifications: data }
  } catch (error) {
    console.error('Error getting notifications:', error)
    return { success: false, error, notifications: [] }
  }
}

// Mark notification as read
export const markNotificationAsRead = async (notificationId: string) => {
  if (!isSupabaseConfigured()) {
    return { success: true }
  }

  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)

    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error('Error marking notification as read:', error)
    return { success: false, error }
  }
}

// Mark all notifications as read
export const markAllNotificationsAsRead = async (userId: string) => {
  if (!isSupabaseConfigured()) {
    return { success: true }
  }

  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false)

    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error('Error marking all notifications as read:', error)
    return { success: false, error }
  }
}

// Create notification
export const createNotification = async (notificationData: {
  user_id: string
  title: string
  message: string
  type: 'appointment_reminder' | 'queue_update' | 'doctor_arrival' | 'next_in_queue' | 'general'
  appointment_id?: string
}) => {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase not configured' }
  }

  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert(notificationData)
      .select()
      .single()

    if (error) throw error
    return { success: true, notification: data }
  } catch (error) {
    console.error('Error creating notification:', error)
    return { success: false, error }
  }
}

// Subscribe to real-time notifications
export const subscribeToNotifications = (userId: string, callback: (payload: any) => void) => {
  if (!isSupabaseConfigured()) {
    return { unsubscribe: () => {} } // Mock subscription
  }

  return supabase
    .channel(`notifications-${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      },
      callback
    )
    .subscribe()
}

// Smart notification triggers (would typically be handled by database functions/triggers)
export const triggerAppointmentReminder = async (appointmentId: string) => {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase not configured' }
  }

  try {
    // Get appointment details
    const { data: appointment } = await supabase
      .from('appointments')
      .select(`
        *,
        clinic:clinics(*),
        doctor:doctors(*)
      `)
      .eq('id', appointmentId)
      .single()

    if (!appointment) return

    const message = `Reminder: You have an appointment today at ${appointment.clinic?.name} with ${appointment.doctor?.name || 'the doctor'}.`

    await createNotification({
      user_id: appointment.user_id,
      title: 'Appointment Reminder',
      message,
      type: 'appointment_reminder',
      appointment_id: appointmentId
    })

    return { success: true }
  } catch (error) {
    console.error('Error triggering appointment reminder:', error)
    return { success: false, error }
  }
}

export const triggerNextInQueueNotification = async (appointmentId: string) => {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase not configured' }
  }

  try {
    const { data: appointment } = await supabase
      .from('appointments')
      .select(`
        *,
        clinic:clinics(*)
      `)
      .eq('id', appointmentId)
      .single()

    if (!appointment) return

    const message = `🏥 You're next! Please be ready for your appointment at ${appointment.clinic?.name}. Token: ${appointment.token_number}`

    await createNotification({
      user_id: appointment.user_id,
      title: "You're Next!",
      message,
      type: 'next_in_queue',
      appointment_id: appointmentId
    })

    return { success: true }
  } catch (error) {
    console.error('Error triggering next in queue notification:', error)
    return { success: false, error }
  }
}

export const triggerDoctorArrivalNotification = async (doctorId: string) => {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase not configured' }
  }

  try {
    // Get all upcoming appointments for this doctor today
    const today = new Date().toISOString().split('T')[0]
    const { data: appointments } = await supabase
      .from('appointments')
      .select(`
        *,
        clinic:clinics(*),
        doctor:doctors(*)
      `)
      .eq('doctor_id', doctorId)
      .eq('appointment_date', today)
      .eq('status', 'upcoming')

    if (!appointments || appointments.length === 0) return

    // Send notification to all patients with appointments today
    for (const appointment of appointments) {
      const message = `👩‍⚕️ Dr. ${appointment.doctor?.name} has arrived at ${appointment.clinic?.name}. Current token: ${appointment.clinic?.queueStatus?.current_token || 'A001'}`

      await createNotification({
        user_id: appointment.user_id,
        title: 'Doctor Arrived',
        message,
        type: 'doctor_arrival',
        appointment_id: appointment.id
      })
    }

    return { success: true }
  } catch (error) {
    console.error('Error triggering doctor arrival notification:', error)
    return { success: false, error }
  }
}