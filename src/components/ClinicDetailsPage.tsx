import React, { useState } from 'react'
import { ArrowLeft, Star, MapPin, Phone, Clock, Calendar, User, ChevronRight, ChevronDown, AlertCircle, CheckCircle, XCircle } from 'lucide-react'
import type { User as UserType, Clinic, Doctor, Appointment, RecentVisit } from '../App'
import AdBanner from './AdBanner'

interface ClinicDetailsPageProps {
  clinic: Clinic
  user: UserType
  appointments: Appointment[]
  onBack: () => void
  onUpdateAppointments: (appointments: Appointment[]) => void
  onUpdateRecentVisits: (visits: RecentVisit[]) => void
}

export default function ClinicDetailsPage({
  clinic,
  user,
  appointments,
  onBack,
  onUpdateAppointments,
  onUpdateRecentVisits
}: ClinicDetailsPageProps) {
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('')
  const [reason, setReason] = useState('')
  const [showBookingForm, setShowBookingForm] = useState(false)
  const [projectedToken, setProjectedToken] = useState<string>('')

  
  // Patient selection states
  const [bookingFor, setBookingFor] = useState<'self' | 'other'>('self')
  const [patientName, setPatientName] = useState('')
  const [patientAge, setPatientAge] = useState('')

  // Generate next 7 days for date selection
  const getNextDays = () => {
    const days = []
    for (let i = 0; i < 7; i++) {
      const date = new Date()
      date.setDate(date.getDate() + i)
      days.push({
        value: date.toISOString().split('T')[0],
        label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
      })
    }
    return days
  }

  const getBookingStatus = (doctor: Doctor) => {
    const currentHour = new Date().getHours()
    const startHour = parseInt(doctor.timings.startTime.split(':')[0])
    const endHour = parseInt(doctor.timings.endTime.split(':')[0])
    
    // More flexible booking hours for testing - extend the booking window
    // Allow booking 2 hours before start time and 1 hour after end time
    const bookingStartHour = Math.max(0, startHour - 2)
    const bookingEndHour = Math.min(23, endHour + 1)
    
    if (currentHour < bookingStartHour) {
      return { status: 'not_open', label: 'Booking Not Yet Open', color: 'text-yellow-600 bg-yellow-50 border-yellow-200' }
    } else if (currentHour > bookingEndHour) {
      return { status: 'closed', label: 'Booking Closed', color: 'text-red-600 bg-red-50 border-red-200' }
    } else {
      return { status: 'open', label: 'Booking Open', color: 'text-green-600 bg-green-50 border-green-200' }
    }
  }

  const generateProjectedToken = (doctor: Doctor, timeSlot: string) => {
    // Generate a projected token based on doctor and time
    const doctorInitial = doctor.name.split(' ')[1]?.charAt(0) || 'D'
    const slotIndex = clinic.timeSlots.findIndex(slot => slot.time === timeSlot) + 1
    return `${doctorInitial}${String(slotIndex + doctor.totalPatientsToday).padStart(2, '0')}`
  }

  const handleDoctorSelect = (doctor: Doctor) => {
    setSelectedDoctor(doctor)
    setShowBookingForm(true)
    setSelectedTimeSlot('')
    setProjectedToken('')
  }

  const handleTimeSlotSelect = (timeSlot: string) => {
    setSelectedTimeSlot(timeSlot)
    if (selectedDoctor) {
      const token = generateProjectedToken(selectedDoctor, timeSlot)
      setProjectedToken(token)
    }
  }

  const handleBookAppointment = () => {
    if (!selectedDoctor) return

    const finalToken = projectedToken || `${selectedDoctor.name.charAt(3).toUpperCase()}${Math.floor(Math.random() * 99) + 1}`

    const newAppointment: Appointment = {
      id: `apt_${Date.now()}`,
      clinicName: clinic.name,
      clinicId: clinic.id,
      doctorName: selectedDoctor.name,
      doctorId: selectedDoctor.id,
      date: selectedDate,
      time: clinic.bookingType === 'time_token' ? selectedTimeSlot : undefined,
      tokenNumber: finalToken,
      status: 'upcoming',
      reason: reason || undefined,
      currentToken: selectedDoctor.currentToken,
      patientName: bookingFor === 'self' ? user.name : patientName,
      patientAge: bookingFor === 'self' ? (user.age || 28) : parseInt(patientAge),
      doctorStatus: selectedDoctor.status,
      queuePosition: Math.floor(Math.random() * 5) + 1,
      patientPhone: user.phone
    }

    onUpdateAppointments([...appointments, newAppointment])

    // Update recent visits
    const newVisit: RecentVisit = {
      clinicId: clinic.id,
      clinicName: clinic.name,
      address: clinic.address,
      lastVisit: new Date().toISOString(),
      totalVisits: 1
    }

    onUpdateRecentVisits([newVisit])
    
    const patientDisplayName = bookingFor === 'self' ? 'your' : `${patientName}'s`
    alert(`Appointment booked successfully for ${patientDisplayName} appointment! Token number is ${finalToken}`)
    onBack()
  }

  // Check if booking form is valid
  const isBookingFormValid = () => {
    const timeSlotValid = clinic.bookingType === 'token_only' || selectedTimeSlot
    const patientDetailsValid = bookingFor === 'self' || (patientName.trim() && patientAge.trim() && parseInt(patientAge) > 0)
    return timeSlotValid && patientDetailsValid
  }

  const calculateWaitTime = (doctor: Doctor): string => {
    const avgWaitTime = Math.floor(Math.random() * 60) + 15 // 15-75 minutes
    return `${avgWaitTime} mins`
  }

  if (showBookingForm && selectedDoctor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <header className="bg-background shadow-lg border-b border-border sticky top-0 z-50">
          <div className="px-6 py-4">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setShowBookingForm(false)}
                className="p-2 hover:bg-muted rounded-xl transition-colors"
              >
                <ArrowLeft className="w-6 h-6 text-muted-foreground" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-primary">Book Appointment</h1>
                <p className="text-sm text-muted-foreground">{selectedDoctor.name}</p>
              </div>
            </div>
          </div>
        </header>

        <main className="px-6 py-6 space-y-6">
          <AdBanner />

          <div className="bg-background rounded-3xl shadow-xl border border-border p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-foreground mb-2">{selectedDoctor.name}</h2>
              <p className="text-muted-foreground text-lg">{selectedDoctor.specialty}</p>
              <p className="text-muted-foreground">{selectedDoctor.experience} experience</p>
            </div>

            <div className="space-y-6">
              {/* Patient Selection */}
              <div>
                <label className="block font-semibold text-foreground mb-3">Who is this appointment for?</label>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <button
                    onClick={() => {
                      setBookingFor('self')
                      setPatientName('')
                      setPatientAge('')
                    }}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      bookingFor === 'self'
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border bg-background text-muted-foreground hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <User className="w-5 h-5" />
                      <div className="text-left">
                        <p className="font-semibold">For Myself</p>
                        <p className="text-sm opacity-80">{user.name}</p>
                      </div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setBookingFor('other')}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      bookingFor === 'other'
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border bg-background text-muted-foreground hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <User className="w-5 h-5" />
                      <div className="text-left">
                        <p className="font-semibold">For Someone Else</p>
                        <p className="text-sm opacity-80">Family/Friend</p>
                      </div>
                    </div>
                  </button>
                </div>

                {/* Patient details for 'other' */}
                {bookingFor === 'other' && (
                  <div className="bg-muted/30 border border-border rounded-xl p-4 space-y-4">
                    <div>
                      <label className="block font-semibold text-foreground mb-2">Patient Name</label>
                      <input
                        type="text"
                        value={patientName}
                        onChange={(e) => setPatientName(e.target.value)}
                        placeholder="Enter patient's full name"
                        className="w-full px-4 py-3 border-2 border-input bg-input-background rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-foreground mb-2">Patient Age</label>
                      <input
                        type="number"
                        value={patientAge}
                        onChange={(e) => setPatientAge(e.target.value)}
                        placeholder="Enter patient's age"
                        min="1"
                        max="120"
                        className="w-full px-4 py-3 border-2 border-input bg-input-background rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Date Selection */}
              <div>
                <label className="block font-semibold text-foreground mb-3">Select Date</label>
                <div className="relative">
                  <select
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-4 py-4 text-base border-2 border-input bg-input-background rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary appearance-none cursor-pointer"
                  >
                    {getNextDays().map((day) => (
                      <option key={day.value} value={day.value}>
                        {day.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              {/* Booking Type Info (Read-only) */}
              <div>
                <label className="block font-semibold text-foreground mb-3">Booking System</label>
                <div className={`p-4 rounded-xl border-2 border-primary bg-primary/5 text-primary`}>
                  <div className="text-center">
                    {clinic.bookingType === 'time_token' ? (
                      <>
                        <Clock className="w-6 h-6 mx-auto mb-2" />
                        <p className="font-semibold">Time-Based Booking</p>
                        <p className="text-sm opacity-80">This clinic uses specific time slot appointments</p>
                      </>
                    ) : (
                      <>
                        <Calendar className="w-6 h-6 mx-auto mb-2" />
                        <p className="font-semibold">Day-Based Token Booking</p>
                        <p className="text-sm opacity-80">This clinic uses daily token system with estimated wait times</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Time Slot Selection for time_token */}
              {clinic.bookingType === 'time_token' && (
                <div>
                  <label className="block font-semibold text-foreground mb-3">Select Time Slot</label>
                  <div className="relative mb-4">
                    <select
                      value={selectedTimeSlot}
                      onChange={(e) => handleTimeSlotSelect(e.target.value)}
                      className="w-full px-4 py-4 text-base border-2 border-input bg-input-background rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary appearance-none cursor-pointer"
                    >
                      <option value="">Choose a time slot</option>
                      {clinic.timeSlots.filter(slot => slot.available).map((slot) => (
                        <option key={slot.id} value={slot.time}>
                          {slot.time} - Token: {slot.tokenNumber} (Wait: {slot.approxWaitTime})
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                  </div>

                  {/* Projected Token Display */}
                  {projectedToken && (
                    <div className="bg-primary/5 border-2 border-primary/20 rounded-xl p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                          <span className="text-primary-foreground font-bold text-lg">#{projectedToken}</span>
                        </div>
                        <div>
                          <p className="font-semibold text-primary">Your Projected Token Number</p>
                          <p className="text-sm text-muted-foreground">
                            Date: {new Date(selectedDate).toLocaleDateString()} at {selectedTimeSlot}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Token-only booking for token_only */}
              {clinic.bookingType === 'token_only' && (
                <div>
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-4">
                    <h3 className="font-semibold text-primary mb-2">Day-Based Token Booking</h3>
                    <p className="text-muted-foreground text-sm mb-3">
                      Select your preferred date and we'll assign you a token number with estimated time.
                    </p>
                  </div>
                  
                  {selectedDate && selectedDoctor && (
                    <div className="bg-background border-2 border-primary/30 rounded-xl p-4">
                      <div className="flex items-center gap-4 mb-3">
                        <div className="w-14 h-14 bg-primary rounded-xl flex items-center justify-center">
                          <span className="text-primary-foreground font-bold text-xl">#{generateProjectedToken(selectedDoctor, 'token')}</span>
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-primary text-lg">Your Projected Token</p>
                          <p className="text-muted-foreground text-sm">
                            For {new Date(selectedDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="bg-muted/50 rounded-lg p-3">
                        <p className="text-sm text-muted-foreground mb-1">Approximate Time:</p>
                        <p className="font-semibold text-foreground">{calculateWaitTime(selectedDoctor)} from clinic opening</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          *Times may vary based on consultation duration and patient flow
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block font-semibold text-foreground mb-3">
                  Reason for Visit (Optional)
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Brief description of your concern..."
                  className="w-full px-4 py-3 border-2 border-input bg-input-background rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary resize-none"
                  rows={3}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowBookingForm(false)}
                  className="flex-1 bg-muted text-muted-foreground py-4 px-6 rounded-xl hover:bg-muted/80 transition-colors font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBookAppointment}
                  disabled={!isBookingFormValid()}
                  className="flex-1 bg-primary text-primary-foreground py-4 px-6 rounded-xl hover:bg-primary/90 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirm Booking
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-background shadow-lg border-b border-border sticky top-0 z-50">
        <div className="px-6 py-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={onBack}
              className="p-2 hover:bg-muted rounded-xl transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-muted-foreground" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-primary">{clinic.name}</h1>
              <p className="text-sm text-muted-foreground">{clinic.specialty}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="px-6 py-6 space-y-6">
        <AdBanner />

        {/* Clinic Info */}
        <div className="bg-background rounded-3xl shadow-xl border border-border p-6">
          <div className="flex items-start gap-4 mb-6">
            <img 
              src={clinic.image} 
              alt={clinic.name}
              className="w-24 h-24 rounded-2xl object-cover"
            />
            
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-foreground mb-2">{clinic.name}</h2>
              <p className="text-muted-foreground text-lg mb-3">{clinic.specialty}</p>
              
              <div className="flex items-center gap-4 mb-3">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>{clinic.distance}</span>
                </div>
              </div>
              
              <p className="text-muted-foreground">{clinic.address}</p>
            </div>
          </div>

          <p className="text-muted-foreground mb-6">{clinic.description}</p>

          <div className="grid grid-cols-2 gap-3">
            <button className="flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 px-4 rounded-xl hover:bg-primary/90 transition-colors font-semibold">
              <Phone className="w-4 h-4" />
              Call Clinic
            </button>
            <button className="flex items-center justify-center gap-2 bg-muted text-muted-foreground py-3 px-4 rounded-xl hover:bg-muted/80 transition-colors font-semibold">
              <MapPin className="w-4 h-4" />
              Directions
            </button>
          </div>
        </div>

        <AdBanner />

        {/* Doctors */}
        <div className="bg-background rounded-3xl shadow-xl border border-border p-6">
          <h3 className="text-xl font-bold text-foreground mb-6">Available Doctors</h3>
          
          {clinic.doctors.length === 0 ? (
            <div className="text-center py-8">
              <User className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground text-lg">No doctors available</p>
              <p className="text-muted-foreground text-sm">Please contact the clinic directly</p>
            </div>
          ) : (
            <div className="space-y-6">
              {clinic.doctors.map((doctor) => {
                const bookingStatus = getBookingStatus(doctor)
                return (
                  <div key={doctor.id} className="border-2 border-border rounded-2xl p-6 bg-gradient-to-r from-background to-muted/20">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex-1">
                        <div className="mb-3">
                          <h4 className="text-xl font-bold text-foreground">{doctor.name}</h4>
                        </div>
                        
                        <p className="text-muted-foreground text-lg mb-2">{doctor.specialty}</p>
                        <p className="text-muted-foreground mb-3">{doctor.experience} experience</p>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{doctor.timings.startTime} - {doctor.timings.endTime}</span>
                          </div>
                        </div>

                        {/* Booking Status */}
                        <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium mb-3 ${bookingStatus.color}`}>
                          {bookingStatus.status === 'open' && <CheckCircle className="w-4 h-4" />}
                          {bookingStatus.status === 'not_open' && <AlertCircle className="w-4 h-4" />}
                          {bookingStatus.status === 'closed' && <XCircle className="w-4 h-4" />}
                          {bookingStatus.label}
                        </div>

                        {/* Estimated wait time */}
                        <div className="flex items-center gap-4">
                          <span className="text-muted-foreground text-sm">
                            Est. wait: {calculateWaitTime(doctor)}
                          </span>
                        </div>

                        {/* Current Queue Info */}
                        <div className="mt-3 text-sm text-muted-foreground">
                          <span>Currently serving: <span className="font-semibold text-primary">#{doctor.currentToken}</span></span>
                          <span className="mx-2">•</span>
                          <span>Next: <span className="font-semibold text-primary">#{doctor.nextToken}</span></span>
                        </div>
                      </div>

                      {/* Book Now Button */}
                      <button
                        onClick={() => handleDoctorSelect(doctor)}
                        disabled={bookingStatus.status === 'closed'}
                        className={`px-8 py-4 rounded-xl font-semibold flex items-center gap-2 min-w-[140px] justify-center transition-all ${
                          bookingStatus.status === 'closed'
                            ? 'bg-muted text-muted-foreground cursor-not-allowed opacity-50'
                            : 'bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 shadow-lg'
                        }`}
                      >
                        <Calendar className="w-5 h-5" />
                        {bookingStatus.status === 'closed' ? 'Closed' : 'Book Now'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Time Slots for token_only clinics */}
        {clinic.bookingType === 'token_only' && clinic.doctors.length > 0 && (
          <div className="bg-background rounded-3xl shadow-xl border border-border p-6">
            <h3 className="text-xl font-bold text-foreground mb-4">Token-Based Booking</h3>
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
              <p className="text-primary font-semibold mb-2">How it works:</p>
              <ul className="text-muted-foreground text-sm space-y-1">
                <li>• You'll receive a token number when booking</li>
                <li>• Arrive at the clinic and wait for your token to be called</li>
                <li>• Wait times vary based on consultation duration and queue</li>
                <li>• Track your position in the queue through the app</li>
              </ul>
            </div>
          </div>
        )}

        <AdBanner />
      </main>
    </div>
  )
}