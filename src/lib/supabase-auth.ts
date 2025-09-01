import { supabase, isSupabaseConfigured } from './supabase'
import type { User } from './supabase'

// Phone OTP Authentication
export const sendOTP = async (phone: string) => {
  if (!isSupabaseConfigured()) {
    // Mock success for demo mode
    return { success: true, data: { message: 'OTP sent (demo mode)' } }
  }

  try {
    const { data, error } = await supabase.auth.signInWithOtp({
      phone: phone,
    })
    
    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Error sending OTP:', error)
    return { success: false, error }
  }
}

// Verify OTP (for testing, always accept "123456")
export const verifyOTP = async (phone: string, token: string) => {
  if (!isSupabaseConfigured()) {
    // Mock verification for demo mode
    if (token === '123456') {
      return { 
        success: true, 
        user: null, 
        needsRegistration: true 
      }
    }
    return { success: false, error: 'Invalid OTP' }
  }

  try {
    // For testing purposes, accept the test code
    if (token === '123456') {
      // Check if user exists in our users table
      const { data: existingUser, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('phone', phone)
        .single()

      if (userError && userError.code !== 'PGRST116') {
        throw userError
      }

      if (existingUser) {
        // User exists, return them
        return { success: true, user: existingUser }
      } else {
        // User doesn't exist, needs registration
        return { success: true, user: null, needsRegistration: true }
      }
    }

    // Real OTP verification
    const { data, error } = await supabase.auth.verifyOtp({
      phone: phone,
      token: token,
      type: 'sms'
    })
    
    if (error) throw error

    if (data.user) {
      // Check if user profile exists
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('phone', phone)
        .single()

      if (userError && userError.code === 'PGRST116') {
        // User doesn't exist in our table, needs registration
        return { success: true, user: data.user, needsRegistration: true }
      }

      if (userError) throw userError

      return { success: true, user: userData }
    }

    return { success: false, error: 'Invalid OTP' }
  } catch (error) {
    console.error('Error verifying OTP:', error)
    return { success: false, error }
  }
}

// Google Sign In
export const signInWithGoogle = async () => {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase not configured' }
  }

  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
    
    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Error signing in with Google:', error)
    return { success: false, error }
  }
}

// Create User Profile
export const createUserProfile = async (userData: {
  phone: string
  name: string
  email?: string
  google_id?: string
}) => {
  if (!isSupabaseConfigured()) {
    // Mock user creation for demo mode
    const mockUser: User = {
      id: 'demo-' + Date.now(),
      phone: userData.phone,
      name: userData.name,
      email: userData.email,
      google_id: userData.google_id,
      is_clinic_staff: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    return { success: true, user: mockUser }
  }

  try {
    // Check if phone indicates clinic staff
    const isClinicStaff = await checkIfClinicStaff(userData.phone)

    // Create user record in our users table
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        phone: userData.phone,
        name: userData.name,
        email: userData.email,
        google_id: userData.google_id,
        is_clinic_staff: isClinicStaff
      })
      .select()
      .single()

    if (error) throw error

    // Log the registration activity
    await logActivity(newUser.id, 'user_registered', { 
      method: userData.google_id ? 'google' : 'phone',
      is_clinic_staff: isClinicStaff
    })

    return { success: true, user: newUser }
  } catch (error) {
    console.error('Error creating user profile:', error)
    return { success: false, error }
  }
}

// Check if phone number belongs to clinic staff
const checkIfClinicStaff = async (phone: string): Promise<boolean> => {
  if (!isSupabaseConfigured()) {
    // For demo mode, check against hardcoded clinic phones
    const clinicPhones = [
      '+1 (555) 999-0001', // Alice Smith - City General Hospital
      '+1 (555) 999-0002', // Bob Johnson - Heart Care Center
      '+1 (555) 123-4567', // Main clinic phone - City General Hospital
      '+1 (555) 234-5678', // Main clinic phone - Heart Care Center
      '+1 (555) 345-6789', // Main clinic phone - Pediatric Wellness
      '+1 (555) 456-7890', // Main clinic phone - Women's Health
      '+1 (555) 567-8901'  // Main clinic phone - Orthopedic Sports
    ]
    return clinicPhones.includes(phone)
  }

  try {
    // Check if phone matches any clinic's main phone
    const { data: clinics, error } = await supabase
      .from('clinics')
      .select('phone')
      .eq('phone', phone)
      .limit(1)

    if (error) throw error

    if (clinics && clinics.length > 0) {
      return true // Main clinic phone = admin access
    }

    // TODO: Add check for clinic staff/handler phones
    // This would require a clinic_staff or handlers table
    // For now, return false for all other numbers
    return false
  } catch (error) {
    console.error('Error checking clinic staff status:', error)
    return false
  }
}

// Sign Out
export const signOut = async () => {
  if (!isSupabaseConfigured()) {
    return { success: true }
  }

  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error('Error signing out:', error)
    return { success: false, error }
  }
}

// Get Current User
export const getCurrentUser = async () => {
  if (!isSupabaseConfigured()) {
    return { success: true, user: null }
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error

    if (user && user.phone) {
      // Get user profile from our users table
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('phone', user.phone)
        .single()

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError
      }

      if (profile) {
        return { success: true, user: profile }
      } else {
        // Auth user exists but no profile - needs registration
        return { success: true, user: null, needsRegistration: true }
      }
    }

    return { success: true, user: null }
  } catch (error) {
    console.error('Error getting current user:', error)
    return { success: false, error }
  }
}

// Activity Logging
export const logActivity = async (userId: string, action: string, details?: any) => {
  if (!isSupabaseConfigured()) {
    return // Skip logging in demo mode
  }

  try {
    const { error } = await supabase
      .from('activity_logs')
      .insert({
        user_id: userId,
        action,
        details
      })

    if (error) throw error
  } catch (error) {
    console.error('Error logging activity:', error)
  }
}