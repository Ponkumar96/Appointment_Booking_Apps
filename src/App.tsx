import React, { useState, useEffect, useCallback, useMemo } from 'react'
import AuthPage from './components/AuthPage'
import UserDashboard from './components/UserDashboard'
import ClinicDashboard from './components/ClinicDashboard'
import ClinicSetup from './components/ClinicSetup'
import { SupabaseProvider } from './components/SupabaseProvider'
import SupabaseConnectionStatus from './components/SupabaseConnectionStatus'
import SetupValidator from './components/SetupValidator'
import TestCredentialsCard from './components/TestCredentialsCard'
import { useSupabaseAuth } from './hooks/useSupabaseAuth'
import { getUserAppointments, getClinics } from './lib/supabase-appointments'
import { getUserNotifications } from './lib/supabase-notifications'
import { isSupabaseConfigured } from './lib/supabase'

// Keep the existing interfaces for compatibility
interface User {
  id: string
  phone: string
  role: 'user' | 'clinic'
  name: string
  age?: number
  clinicId?: string
  isHandler?: boolean
  handlerName?: string
  isAdmin?: boolean
}

interface Patient {
  id: string
  tokenNumber: string
  patientName: string
  patientAge: number
  patientPhone: string
  reason?: string
  bookingTime: string
  doctorId: string
  clinicId: string
  date: string
  status: 'waiting' | 'arrived' | 'with_doctor' | 'completed' | 'missed' | 'no_show'
  arrivalTime?: string
  consultationStartTime?: string
  consultationEndTime?: string
  queuePosition: number
}

interface Doctor {
  id: string
  name: string
  specialty: string
  experience: string
  available: boolean
  clinicId: string
  clinicName: string
  clinicAddress: string
  status: 'not_arrived' | 'available' | 'with_patient' | 'break'
  timings: {
    startTime: string
    endTime: string
    days: string[]
  }
  maxTokensPerDay: number
  consultationDurationMinutes: number
  currentToken: string
  nextToken: string
  totalPatientsToday: number
  completedToday: number
}

interface TimeSlot {
  id: string
  time?: string
  available: boolean
  tokenNumber?: string
  approxWaitTime?: string
}

interface Clinic {
  id: string
  name: string
  specialty: string
  address: string
  phone: string
  distance: string
  image: string
  doctors: Doctor[]
  timeSlots: TimeSlot[]
  description: string
  latitude: number
  longitude: number
  bookingType: 'token_only' | 'time_token'
  isSetup: boolean
  handlers: Handler[]
}

interface Handler {
  id: string
  name: string
  phone: string
  clinicId: string
  canManageAllDoctors: boolean
}

interface ActivityLog {
  id: string
  timestamp: string
  handlerName: string
  handlerId: string
  action: 'patient_status_change' | 'doctor_status_change' | 'handler_login' | 'handler_logout'
  targetType: 'patient' | 'doctor' | 'system'
  targetName: string
  targetId: string
  details: string
  oldValue?: string
  newValue?: string
  clinicId: string
}

interface Appointment {
  id: string
  clinicName: string
  clinicId: string
  doctorName: string
  doctorId: string
  date: string
  time?: string
  tokenNumber: string
  status: 'upcoming' | 'completed' | 'cancelled'
  reason?: string
  currentToken: string
  patientName: string
  patientAge: number
  doctorStatus: 'not_arrived' | 'available' | 'with_patient'
  queuePosition: number
  patientPhone: string
}

interface RecentVisit {
  clinicId: string
  clinicName: string
  address: string
  lastVisit: string
  totalVisits: number
}

export type {
  User,
  Doctor,
  Patient,
  TimeSlot,
  Clinic,
  Appointment,
  RecentVisit,
  Handler,
  ActivityLog
}

// Main App Component
function AppContent() {
  const { user: supabaseUser, loading: authLoading, logout } = useSupabaseAuth()
  const [user, setUser] = useState<User | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [recentVisits, setRecentVisits] = useState<RecentVisit[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [clinics, setClinics] = useState<Clinic[]>([])
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [dataLoaded, setDataLoaded] = useState(false)
  
  // Memoize this to prevent re-calculation on every render
  const supabaseConfigured = useMemo(() => isSupabaseConfigured(), [])

  // Set page title
  useEffect(() => {
    document.title = 'Appointments - Book Medical Appointments'
  }, [])

  // Load dummy data as fallback - wrap in useCallback to prevent re-creation
  const loadDummyData = useCallback(() => {
    if (dataLoaded && !supabaseConfigured) return // Prevent duplicate loading
    
    const dummyClinics: Clinic[] = [
      {
        id: '1',
        name: 'City General Hospital',
        specialty: 'General Medicine',
        address: '123 Main Street, Downtown',
        phone: '98765 43210',
        distance: '0.5 km',
        image: 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=400',
        description: 'Leading multi-specialty hospital with state-of-the-art facilities and experienced medical professionals.',
        latitude: 40.7128,
        longitude: -74.0060,
        bookingType: 'time_token',
        isSetup: true,
        handlers: [
          { id: 'h1', name: 'Alice Smith', phone: '99900 00001', clinicId: '1', canManageAllDoctors: true }
        ],
        doctors: [
          { 
            id: '1', 
            name: 'Dr. Sarah Johnson', 
            specialty: 'General Physician', 
            experience: '10 years', 
            available: true, 
            clinicId: '1', 
            clinicName: 'City General Hospital', 
            clinicAddress: '123 Main Street, Downtown', 
            status: 'available',
            timings: {
              startTime: '09:00',
              endTime: '17:00',
              days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
            },
            maxTokensPerDay: 20,
            consultationDurationMinutes: 15,
            currentToken: 'S03',
            nextToken: 'S06',
            totalPatientsToday: 5,
            completedToday: 2
          }
        ],
        timeSlots: [
          { id: '1', time: '09:00 AM', available: true, tokenNumber: 'A12', approxWaitTime: '15 mins' },
          { id: '2', time: '10:30 AM', available: true, tokenNumber: 'A13', approxWaitTime: '25 mins' },
          { id: '3', time: '11:00 AM', available: false },
          { id: '4', time: '02:00 PM', available: true, tokenNumber: 'A14', approxWaitTime: '10 mins' }
        ]
      },
      {
        id: '2',
        name: 'Heart Care Center',
        specialty: 'Cardiology',
        address: '456 Oak Avenue, Medical District',
        phone: '98765 43211',
        distance: '1.2 km',
        image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400',
        description: 'Specialized cardiac care center with advanced diagnostic and treatment facilities.',
        latitude: 40.7589,
        longitude: -73.9851,
        bookingType: 'token_only',
        isSetup: true,
        handlers: [
          { id: 'h2', name: 'Bob Johnson', phone: '99900 00002', clinicId: '2', canManageAllDoctors: true }
        ],
        doctors: [
          { 
            id: '3', 
            name: 'Dr. Emily Davis', 
            specialty: 'Cardiologist', 
            experience: '12 years', 
            available: true, 
            clinicId: '2', 
            clinicName: 'Heart Care Center', 
            clinicAddress: '456 Oak Avenue, Medical District', 
            status: 'available',
            timings: {
              startTime: '10:00',
              endTime: '18:00',
              days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
            },
            maxTokensPerDay: 30,
            consultationDurationMinutes: 25,
            currentToken: 'H04',
            nextToken: 'H06',
            totalPatientsToday: 8,
            completedToday: 3
          }
        ],
        timeSlots: []
      }
    ]

    const dummyAppointments: Appointment[] = [
      {
        id: '1',
        clinicName: 'Heart Care Center',
        clinicId: '2',
        doctorName: 'Dr. Emily Davis',
        doctorId: '3',
        date: new Date().toISOString().split('T')[0],
        tokenNumber: 'H06',
        status: 'upcoming',
        reason: 'Regular checkup',
        currentToken: 'A001', // This would come from queue status
        patientName: 'John Doe',
        patientAge: 28,
        doctorStatus: 'not_arrived',
        queuePosition: 2,
        patientPhone: '98765 43210'
      }
    ]

    const dummyRecentVisits: RecentVisit[] = [
      {
        clinicId: '1',
        clinicName: 'City General Hospital',
        address: '123 Main Street, Downtown',
        lastVisit: '2024-01-15',
        totalVisits: 3
      }
    ]

    setClinics(dummyClinics)
    setAppointments(dummyAppointments)
    setRecentVisits(dummyRecentVisits)
    setDataLoaded(true)
  }, [dataLoaded, supabaseConfigured])

  // Convert Supabase user to app user format
  useEffect(() => {
    if (supabaseUser && supabaseConfigured) {
      const appUser: User = {
        id: supabaseUser.id,
        phone: supabaseUser.phone,
        name: supabaseUser.name,
        role: supabaseUser.is_clinic_staff ? 'clinic' : 'user',
        clinicId: supabaseUser.is_clinic_staff ? '1' : undefined, // This would come from staff mapping
        isHandler: supabaseUser.is_clinic_staff,
        handlerName: supabaseUser.is_clinic_staff ? supabaseUser.name : undefined,
        isAdmin: supabaseUser.is_clinic_staff
      }
      setUser(appUser)
    } else if (!supabaseUser) {
      setUser(null)
    }
  }, [supabaseUser, supabaseConfigured])

  // Load user data when authenticated with Supabase
  useEffect(() => {
    const loadUserData = async () => {
      if (!supabaseUser || !supabaseConfigured) {
        return
      }

      try {
        setLoading(true)

        // Load user appointments
        const appointmentsResult = await getUserAppointments(supabaseUser.id)
        if (appointmentsResult.success) {
          // Transform Supabase appointments to app format
          const transformedAppointments: Appointment[] = appointmentsResult.appointments.map(apt => ({
            id: apt.id,
            clinicName: apt.clinic?.name || 'Unknown Clinic',
            clinicId: apt.clinic_id,
            doctorName: apt.doctor?.name || 'Unknown Doctor',
            doctorId: apt.doctor_id || '',
            date: apt.appointment_date,
            time: apt.appointment_time,
            tokenNumber: apt.token_number,
            status: apt.status,
            currentToken: 'A001', // This would come from queue status
            patientName: apt.patient_name,
            patientAge: apt.patient_age || 0,
            doctorStatus: apt.doctor?.status || 'not_arrived',
            queuePosition: apt.queue_position,
            patientPhone: apt.patient_phone
          }))
          setAppointments(transformedAppointments)
        }

        // Load clinics
        const clinicsResult = await getClinics()
        if (clinicsResult.success) {
          // Transform Supabase clinics to app format
          const transformedClinics: Clinic[] = clinicsResult.clinics.map(clinic => ({
            id: clinic.id,
            name: clinic.name,
            specialty: clinic.specialties?.[0] || 'General Medicine',
            address: clinic.address,
            phone: clinic.phone || '',
            distance: '0.5 km', // This would be calculated
            image: 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=400',
            doctors: [], // Would be loaded separately
            timeSlots: [], // Would be generated based on booking type
            description: 'Healthcare facility',
            latitude: clinic.latitude || 40.7128,
            longitude: clinic.longitude || -74.0060,
            bookingType: clinic.booking_type === 'time_based' ? 'time_token' : 'token_only',
            isSetup: clinic.is_active,
            handlers: [] // Would be loaded separately
          }))
          setClinics(transformedClinics)
        }

        setDataLoaded(true)
      } catch (error) {
        console.error('Error loading user data:', error)
        // Fall back to dummy data if Supabase fails
        loadDummyData()
      } finally {
        setLoading(false)
      }
    }

    loadUserData()
  }, [supabaseUser, supabaseConfigured, loadDummyData])

  // Initialize with dummy data if Supabase is not configured
  useEffect(() => {
    if (!supabaseConfigured && !dataLoaded) {
      loadDummyData()
      setLoading(false)
    }
  }, [supabaseConfigured, dataLoaded, loadDummyData])

  // Memoize handler phones and clinic phones to prevent re-calculation
  const handlerPhones = useMemo(() => 
    clinics.flatMap(clinic => clinic.handlers.map(handler => handler.phone))
  , [clinics])
  
  const clinicMainPhones = useMemo(() => 
    clinics.map(clinic => clinic.phone)
  , [clinics])

  const handleLogin = useCallback((userData: User) => {
    setUser(userData)
  }, [])

  const handleLogout = useCallback(async () => {
    try {
      if (supabaseConfigured) {
        await logout()
      }
      setUser(null)
      setAppointments([])
      setRecentVisits([])
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }, [supabaseConfigured, logout])

  const updateAppointments = useCallback((newAppointments: Appointment[]) => {
    setAppointments(newAppointments)
  }, [])

  const updateRecentVisits = useCallback((newVisits: RecentVisit[]) => {
    setRecentVisits(newVisits)
  }, [])

  const updatePatients = useCallback((newPatients: Patient[]) => {
    setPatients(newPatients)
  }, [])

  const updateClinic = useCallback((updatedClinic: Clinic) => {
    setClinics(prev => prev.map(clinic => 
      clinic.id === updatedClinic.id ? updatedClinic : clinic
    ))
  }, [])

  const addHandler = useCallback((clinicId: string, handler: Handler) => {
    setClinics(prev => prev.map(clinic => 
      clinic.id === clinicId 
        ? { ...clinic, handlers: [...clinic.handlers, handler] }
        : clinic
    ))
  }, [])

  const addActivityLog = useCallback((log: ActivityLog) => {
    setActivityLogs(prev => [log, ...prev])
  }, [])

  // Show loading screen while authentication is loading
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">
            {supabaseConfigured ? 'Loading your appointments...' : 'Loading demo data...'}
          </p>
        </div>
      </div>
    )
  }

  // Show auth page if not authenticated
  if (!user) {
    return (
      <>
        <AuthPage 
          onLogin={handleLogin}
          handlerPhones={handlerPhones}
          clinicMainPhones={clinicMainPhones}
          clinics={clinics}
        />
        <SupabaseConnectionStatus />
        <TestCredentialsCard />
      </>
    )
  }

  // Show clinic dashboard for clinic users
  if (user.role === 'clinic') {
    const userClinic = clinics.find(c => c.id === user.clinicId)
    
    // Only show setup flow for admin users when clinic is not setup
    if (userClinic && !userClinic.isSetup && user.isAdmin) {
      return (
        <>
          <ClinicSetup
            user={user}
            clinic={userClinic}
            onSetupComplete={updateClinic}
            onLogout={handleLogout}
            onAddHandler={(handler) => addHandler(user.clinicId!, handler)}
          />
          <SupabaseConnectionStatus />
        </>
      )
    }

    return (
      <>
        <ClinicDashboard
          user={user}
          appointments={appointments}
          patients={patients}
          clinics={clinics}
          activityLogs={activityLogs}
          onLogout={handleLogout}
          onUpdateAppointments={updateAppointments}
          onUpdatePatients={updatePatients}
          onUpdateClinic={updateClinic}
          onAddHandler={(handler) => addHandler(user.clinicId!, handler)}
          onAddActivityLog={addActivityLog}
        />
        <SupabaseConnectionStatus />
      </>
    )
  }

  // Show user dashboard for regular users
  return (
    <>
      <UserDashboard
        user={user}
        appointments={appointments}
        recentVisits={recentVisits}
        dummyClinics={clinics}
        onLogout={handleLogout}
        onUpdateAppointments={updateAppointments}
        onUpdateRecentVisits={updateRecentVisits}
      />
      <SupabaseConnectionStatus />
      <SetupValidator />
    </>
  )
}

// Main App wrapper with Supabase provider
export default function App() {
  const { user: supabaseUser } = useSupabaseAuth()

  return (
    <SupabaseProvider user={supabaseUser}>
      <AppContent />
    </SupabaseProvider>
  )
}