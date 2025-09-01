import { Hono } from 'npm:hono'
import { cors } from 'npm:hono/cors'
import { logger } from 'npm:hono/logger'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import * as kv from './kv_store.tsx'

const app = new Hono()

app.use('*', cors({
  origin: '*',
  allowHeaders: ['*'],
  allowMethods: ['*'],
}))

app.use('*', logger(console.log))

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

// Pre-defined clinic numbers for demo
const CLINIC_NUMBERS = [
  '+1234567890',
  '+9876543210',
  '+1111111111'
]

// Fixed OTP for testing
const FIXED_OTP = '123456'

// Default clinics with doctors
const DEFAULT_CLINICS = [
  {
    id: 'clinic-1',
    name: 'City Medical Center',
    address: '123 Main St, Downtown',
    phone: '+1234567890',
    specialties: ['General Medicine', 'Cardiology', 'Pediatrics'],
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=400&h=300&fit=crop',
    createdAt: new Date().toISOString()
  },
  {
    id: 'clinic-2',
    name: 'HealthFirst Clinic',
    address: '456 Oak Ave, Midtown',
    phone: '+9876543210',
    specialties: ['Orthopedics', 'Dermatology', 'General Medicine'],
    rating: 4.6,
    image: 'https://images.unsplash.com/photo-1551190822-a9333d879b1f?w=400&h=300&fit=crop',
    createdAt: new Date().toISOString()
  },
  {
    id: 'clinic-3',
    name: 'Wellness Medical Hub',
    address: '789 Pine St, Uptown',
    phone: '+1111111111',
    specialties: ['Neurology', 'Psychiatry', 'General Medicine'],
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1594736797933-d0c41da5d5c8?w=400&h=300&fit=crop',
    createdAt: new Date().toISOString()
  },
  {
    id: 'clinic-4',
    name: 'Premier Care Center',
    address: '321 Elm St, Riverside',
    phone: '+5555551234',
    specialties: ['Emergency Medicine', 'Internal Medicine'],
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1504813184591-01572f98c85f?w=400&h=300&fit=crop',
    createdAt: new Date().toISOString()
  }
]

// Default doctors associated with clinics
const DEFAULT_DOCTORS = [
  // City Medical Center
  {
    id: 'default-doc-1',
    name: 'Dr. Sarah Johnson',
    specialization: 'General Medicine',
    clinicId: 'clinic-1',
    availability: ['09:00-12:00', '14:00-17:00'],
    rating: 4.9,
    experience: '8 years',
    image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=200&h=200&fit=crop&crop=face',
    createdAt: new Date().toISOString()
  },
  {
    id: 'default-doc-2',
    name: 'Dr. Michael Chen',
    specialization: 'Cardiology',
    clinicId: 'clinic-1',
    availability: ['10:00-13:00', '15:00-18:00'],
    rating: 4.8,
    experience: '12 years',
    image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200&h=200&fit=crop&crop=face',
    createdAt: new Date().toISOString()
  },
  // HealthFirst Clinic
  {
    id: 'default-doc-3',
    name: 'Dr. Emily Rodriguez',
    specialization: 'Pediatrics',
    clinicId: 'clinic-2',
    availability: ['08:00-12:00', '14:00-16:00'],
    rating: 4.9,
    experience: '10 years',
    image: 'https://images.unsplash.com/photo-1594824488242-9f6c6c41cacc?w=200&h=200&fit=crop&crop=face',
    createdAt: new Date().toISOString()
  },
  {
    id: 'default-doc-4',
    name: 'Dr. James Wilson',
    specialization: 'Orthopedics',
    clinicId: 'clinic-2',
    availability: ['09:00-12:00', '13:00-17:00'],
    rating: 4.7,
    experience: '15 years',
    image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200&h=200&fit=crop&crop=face',
    createdAt: new Date().toISOString()
  },
  // Wellness Medical Hub
  {
    id: 'default-doc-5',
    name: 'Dr. Lisa Thompson',
    specialization: 'Neurology',
    clinicId: 'clinic-3',
    availability: ['10:00-14:00', '15:00-18:00'],
    rating: 4.9,
    experience: '14 years',
    image: 'https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=200&h=200&fit=crop&crop=face',
    createdAt: new Date().toISOString()
  },
  {
    id: 'default-doc-6',
    name: 'Dr. Robert Kim',
    specialization: 'Psychiatry',
    clinicId: 'clinic-3',
    availability: ['09:00-13:00', '14:00-17:00'],
    rating: 4.8,
    experience: '11 years',
    image: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=200&h=200&fit=crop&crop=face',
    createdAt: new Date().toISOString()
  }
]

// Initialize clinic and default doctor data
const initializeData = async () => {
  // Initialize clinic data
  for (const clinicNumber of CLINIC_NUMBERS) {
    const existingClinic = await kv.get(`clinic:phone:${clinicNumber}`)
    if (!existingClinic) {
      const clinicData = {
        id: crypto.randomUUID(),
        phone: clinicNumber,
        role: 'clinic',
        name: `Clinic ${clinicNumber.slice(-4)}`,
        createdAt: new Date().toISOString()
      }
      await kv.set(`clinic:${clinicData.id}`, clinicData)
      await kv.set(`clinic:phone:${clinicNumber}`, clinicData)
    }
  }

  // Initialize default clinics
  for (const clinic of DEFAULT_CLINICS) {
    const existingClinic = await kv.get(`public_clinic:${clinic.id}`)
    if (!existingClinic) {
      await kv.set(`public_clinic:${clinic.id}`, clinic)
    }
  }

  // Initialize default doctors
  for (const doctor of DEFAULT_DOCTORS) {
    const existingDoctor = await kv.get(`doctor:${doctor.id}`)
    if (!existingDoctor) {
      await kv.set(`doctor:${doctor.id}`, doctor)
    }
  }
}

// Initialize data on startup
initializeData()

app.post('/make-server-be80a339/send-otp', async (c) => {
  try {
    const { phone } = await c.req.json()
    
    if (!phone || !phone.trim()) {
      return c.json({ error: 'Phone number is required' }, 400)
    }
    
    // Store the fixed OTP (expires in 5 minutes)
    await kv.set(`otp:${phone}`, FIXED_OTP, { ttl: 300 })
    
    return c.json({ message: 'OTP sent successfully' })
  } catch (error) {
    console.log('Send OTP error:', error)
    return c.json({ error: 'Failed to send OTP' }, 500)
  }
})

app.post('/make-server-be80a339/verify-otp', async (c) => {
  try {
    const { phone, otp } = await c.req.json()
    
    if (!phone || !otp) {
      return c.json({ error: 'Phone number and OTP are required' }, 400)
    }
    
    const storedOtp = await kv.get(`otp:${phone}`)
    
    if (!storedOtp || storedOtp !== otp) {
      return c.json({ error: 'Invalid OTP' }, 400)
    }
    
    // Delete used OTP
    await kv.del(`otp:${phone}`)
    
    // Check if this is a clinic number
    const isClinicNumber = CLINIC_NUMBERS.includes(phone)
    
    if (isClinicNumber) {
      // Get or create clinic user
      let clinicData = await kv.get(`clinic:phone:${phone}`)
      if (!clinicData) {
        clinicData = {
          id: crypto.randomUUID(),
          phone,
          role: 'clinic',
          name: `Clinic ${phone.slice(-4)}`,
          createdAt: new Date().toISOString()
        }
        await kv.set(`clinic:${clinicData.id}`, clinicData)
        await kv.set(`clinic:phone:${phone}`, clinicData)
      }
      
      return c.json({ user: clinicData })
    } else {
      // Regular user
      let userData = await kv.get(`user:phone:${phone}`)
      if (!userData) {
        userData = {
          id: crypto.randomUUID(),
          phone,
          role: 'user',
          createdAt: new Date().toISOString()
        }
        await kv.set(`user:${userData.id}`, userData)
        await kv.set(`user:phone:${phone}`, userData)
      }
      
      return c.json({ user: userData })
    }
  } catch (error) {
    console.log('Verify OTP error:', error)
    return c.json({ error: 'OTP verification failed' }, 500)
  }
})

// Search routes
app.get('/make-server-be80a339/search', async (c) => {
  try {
    const query = c.req.query('q')?.toLowerCase() || ''
    
    if (!query || query.length < 2) {
      return c.json({ clinics: [], doctors: [] })
    }
    
    // Search clinics
    const allClinics = await kv.getByPrefix('public_clinic:')
    const filteredClinics = allClinics.filter(clinic => 
      clinic && (
        clinic.name?.toLowerCase().includes(query) ||
        clinic.specialties?.some((s: string) => s.toLowerCase().includes(query)) ||
        clinic.address?.toLowerCase().includes(query)
      )
    ).slice(0, 5) // Limit to 5 results
    
    // Search doctors
    const allDoctors = await kv.getByPrefix('doctor:')
    const filteredDoctors = allDoctors.filter(doctor => 
      doctor && doctor.clinicId && (
        doctor.name?.toLowerCase().includes(query) ||
        doctor.specialization?.toLowerCase().includes(query)
      )
    ).slice(0, 5) // Limit to 5 results
    
    return c.json({ 
      clinics: filteredClinics,
      doctors: filteredDoctors
    })
  } catch (error) {
    console.log('Search error:', error)
    return c.json({ error: 'Search failed' }, 500)
  }
})

// Get clinic details
app.get('/make-server-be80a339/clinic/:id', async (c) => {
  try {
    const clinicId = c.req.param('id')
    const clinic = await kv.get(`public_clinic:${clinicId}`)
    
    if (!clinic) {
      return c.json({ error: 'Clinic not found' }, 404)
    }
    
    // Get doctors for this clinic
    const allDoctors = await kv.getByPrefix('doctor:')
    const clinicDoctors = allDoctors.filter(doctor => 
      doctor && doctor.clinicId === clinicId
    )
    
    return c.json({ 
      clinic,
      doctors: clinicDoctors
    })
  } catch (error) {
    console.log('Get clinic error:', error)
    return c.json({ error: 'Failed to get clinic details' }, 500)
  }
})

// Appointment routes
app.post('/make-server-be80a339/book-appointment', async (c) => {
  try {
    const { userId, doctorId, clinicId, date, time, reason } = await c.req.json()
    
    const appointmentId = crypto.randomUUID()
    const tokenNumber = Math.floor(1000 + Math.random() * 9000)
    
    const appointment = {
      id: appointmentId,
      userId,
      doctorId,
      clinicId,
      date,
      time,
      reason,
      tokenNumber,
      status: 'scheduled',
      createdAt: new Date().toISOString()
    }
    
    await kv.set(`appointment:${appointmentId}`, appointment)
    await kv.set(`user:${userId}:appointments:${appointmentId}`, appointment)
    await kv.set(`doctor:${doctorId}:appointments:${appointmentId}`, appointment)
    
    // Track clinic booking history for user
    await kv.set(`user:${userId}:clinic_history:${clinicId}`, {
      clinicId,
      lastBooking: new Date().toISOString(),
      appointmentCount: 1 // In real app, increment this
    })
    
    return c.json({ appointment })
  } catch (error) {
    console.log('Book appointment error:', error)
    return c.json({ error: 'Failed to book appointment' }, 500)
  }
})

app.get('/make-server-be80a339/appointments/:userId', async (c) => {
  try {
    const userId = c.req.param('userId')
    const appointments = await kv.getByPrefix(`user:${userId}:appointments:`)
    
    return c.json({ appointments })
  } catch (error) {
    console.log('Get appointments error:', error)
    return c.json({ error: 'Failed to get appointments' }, 500)
  }
})

// Get user's clinic booking history
app.get('/make-server-be80a339/user/:userId/clinic-history', async (c) => {
  try {
    const userId = c.req.param('userId')
    const historyEntries = await kv.getByPrefix(`user:${userId}:clinic_history:`)
    
    // Get clinic details for each history entry
    const clinicHistory = []
    for (const entry of historyEntries) {
      if (entry && entry.clinicId) {
        const clinic = await kv.get(`public_clinic:${entry.clinicId}`)
        if (clinic) {
          clinicHistory.push({
            ...entry,
            clinic
          })
        }
      }
    }
    
    return c.json({ clinicHistory })
  } catch (error) {
    console.log('Get clinic history error:', error)
    return c.json({ error: 'Failed to get clinic history' }, 500)
  }
})

// Clinic management routes
app.post('/make-server-be80a339/add-doctor', async (c) => {
  try {
    const { name, specialization, availability } = await c.req.json()
    
    const doctorId = crypto.randomUUID()
    const doctor = {
      id: doctorId,
      name,
      specialization,
      availability,
      createdAt: new Date().toISOString()
    }
    
    await kv.set(`doctor:${doctorId}`, doctor)
    
    return c.json({ doctor })
  } catch (error) {
    console.log('Add doctor error:', error)
    return c.json({ error: 'Failed to add doctor' }, 500)
  }
})

app.get('/make-server-be80a339/doctors', async (c) => {
  try {
    const doctors = await kv.getByPrefix('doctor:')
    const filteredDoctors = doctors.filter(doctor => doctor && doctor.id && doctor.name)
    
    return c.json({ doctors: filteredDoctors })
  } catch (error) {
    console.log('Get doctors error:', error)
    return c.json({ error: 'Failed to get doctors' }, 500)
  }
})

app.get('/make-server-be80a339/clinic/appointments', async (c) => {
  try {
    const appointments = await kv.getByPrefix('appointment:')
    const filteredAppointments = appointments.filter(apt => apt && apt.id && apt.status)
    
    return c.json({ appointments: filteredAppointments })
  } catch (error) {
    console.log('Get clinic appointments error:', error)
    return c.json({ error: 'Failed to get clinic appointments' }, 500)
  }
})

app.put('/make-server-be80a339/appointment/:id/status', async (c) => {
  try {
    const appointmentId = c.req.param('id')
    const { status } = await c.req.json()
    
    const appointment = await kv.get(`appointment:${appointmentId}`)
    if (!appointment) {
      return c.json({ error: 'Appointment not found' }, 404)
    }
    
    appointment.status = status
    appointment.updatedAt = new Date().toISOString()
    
    await kv.set(`appointment:${appointmentId}`, appointment)
    await kv.set(`user:${appointment.userId}:appointments:${appointmentId}`, appointment)
    await kv.set(`doctor:${appointment.doctorId}:appointments:${appointmentId}`, appointment)
    
    return c.json({ appointment })
  } catch (error) {
    console.log('Update appointment status error:', error)
    return c.json({ error: 'Failed to update appointment status' }, 500)
  }
})

Deno.serve(app.fetch)