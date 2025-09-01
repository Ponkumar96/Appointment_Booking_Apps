import React, { useState, useEffect } from 'react'
import { Search, MapPin, Star, Clock, Phone, Calendar, ChevronLeft, ChevronRight, Menu, Bell, User, LogOut, Home, X, AlertTriangle, CheckCircle, Clock4 } from 'lucide-react'
import type { User, Appointment, RecentVisit, Clinic } from '../App'
import AdBanner from './AdBanner'
import SearchComponent from './SearchComponent'
import ClinicDetailsPage from './ClinicDetailsPage'
import NotificationsPage from './NotificationsPage'
import ProfilePage from './ProfilePage'

interface UserDashboardProps {
  user: User
  appointments: Appointment[]
  recentVisits: RecentVisit[]
  dummyClinics: Clinic[]
  onLogout: () => void
  onUpdateAppointments: (appointments: Appointment[]) => void
  onUpdateRecentVisits: (visits: RecentVisit[]) => void
}

export default function UserDashboard({
  user,
  appointments,
  recentVisits,
  dummyClinics,
  onLogout,
  onUpdateAppointments,
  onUpdateRecentVisits
}: UserDashboardProps) {
  const [currentView, setCurrentView] = useState<'dashboard' | 'search' | 'clinic-details' | 'notifications' | 'profile'>('dashboard')
  const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isFirstTime, setIsFirstTime] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [notificationCount] = useState(2) // Mock notification count
  const [notifications, setNotifications] = useState<{id: string, message: string, type: 'success' | 'warning' | 'info' | 'reminder' | 'urgent'}[]>([])
  const [previousAppointments, setPreviousAppointments] = useState<Appointment[]>([])

  // Function to add notification
  const addNotification = (message: string, type: 'success' | 'warning' | 'info' | 'reminder' | 'urgent' = 'info') => {
    const id = Date.now().toString()
    setNotifications(prev => [...prev, { id, message, type }])
    // Auto remove after different durations based on type
    const duration = type === 'urgent' ? 10000 : type === 'reminder' ? 8000 : 5000
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id))
    }, duration)
  }

  // Function to remove notification
  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  // Function to cancel appointment
  const handleCancelAppointment = (appointmentId: string) => {
    const appointment = appointments.find(apt => apt.id === appointmentId)
    if (!appointment || appointment.status === 'cancelled') return

    if (confirm(`Are you sure you want to cancel your appointment at ${appointment.clinicName}? This action cannot be undone.`)) {
      // Update the appointment status
      const updatedAppointments = appointments.map(apt => 
        apt.id === appointmentId 
          ? { ...apt, status: 'cancelled' as const }
          : apt
      )
      
      onUpdateAppointments(updatedAppointments)
      
      // Show success notification
      addNotification(`Appointment at ${appointment.clinicName} has been cancelled successfully.`, 'success')
      
      // Simulate notifying other users about queue position changes
      setTimeout(() => {
        addNotification(`Queue positions have been updated. Other patients have been notified.`, 'info')
      }, 1000)
    }
  }

  // Check for appointment status changes and trigger notifications
  useEffect(() => {
    const userAppointments = appointments.filter(apt => apt.patientPhone === user.phone && apt.status === 'upcoming')
    const previousUserAppointments = previousAppointments.filter(apt => apt.patientPhone === user.phone && apt.status === 'upcoming')

    userAppointments.forEach(appointment => {
      const previousAppointment = previousUserAppointments.find(prev => prev.id === appointment.id)
      
      // Check if user is next in queue
      if (appointment.queuePosition === 1 && appointment.currentToken !== appointment.tokenNumber) {
        const currentTokenNum = parseInt(appointment.currentToken.replace(/[A-Z]/g, ''))
        const userTokenNum = parseInt(appointment.tokenNumber.replace(/[A-Z]/g, ''))
        
        if (userTokenNum - currentTokenNum <= 1) {
          addNotification(`🏥 You're next! Please be ready for your appointment at ${appointment.clinicName}`, 'urgent')
        }
      }

      // Check if doctor has arrived (status changed from not_arrived to available)
      if (previousAppointment && 
          previousAppointment.doctorStatus === 'not_arrived' && 
          appointment.doctorStatus === 'available') {
        addNotification(`👩‍⚕️ Dr. ${appointment.doctorName} has arrived at ${appointment.clinicName}`, 'info')
      }

      // Check if appointment is today and send reminder (only once per day)
      const today = new Date().toISOString().split('T')[0]
      if (appointment.date === today) {
        const now = new Date()
        const currentHour = now.getHours()
        
        // Send morning reminder between 8-9 AM
        if (currentHour === 8 && now.getMinutes() < 5) {
          addNotification(`📅 Reminder: You have an appointment today at ${appointment.clinicName} with ${appointment.doctorName}`, 'reminder')
        }
        
        // Send pre-appointment reminder 30 minutes before (if time slot exists)
        if (appointment.time) {
          const appointmentTime = new Date(`${appointment.date}T${appointment.time}`)
          const thirtyMinsBefore = new Date(appointmentTime.getTime() - 30 * 60 * 1000)
          const timeDiff = Math.abs(now.getTime() - thirtyMinsBefore.getTime())
          
          if (timeDiff < 60000) { // Within 1 minute of 30 mins before
            addNotification(`⏰ Your appointment at ${appointment.clinicName} is in 30 minutes. Token: ${appointment.tokenNumber}`, 'reminder')
          }
        }
      }
    })

    setPreviousAppointments([...appointments])
  }, [appointments, user.phone, previousAppointments])

  // Check if user is first-time (no appointments or recent visits)
  useEffect(() => {
    const userAppointments = appointments.filter(apt => apt.patientPhone === user.phone)
    const userVisits = recentVisits.length > 0
    setIsFirstTime(userAppointments.length === 0 && !userVisits)
  }, [appointments, recentVisits, user.phone])

  // Simulate real-time updates for demo purposes
  useEffect(() => {
    const interval = setInterval(() => {
      const userUpcomingAppointments = appointments.filter(
        apt => apt.patientPhone === user.phone && apt.status === 'upcoming'
      )

      if (userUpcomingAppointments.length > 0) {
        // Randomly trigger "you're next" notification for demo
        if (Math.random() < 0.1) { // 10% chance every interval
          const appointment = userUpcomingAppointments[0]
          if (appointment.queuePosition <= 2) {
            addNotification(`🔔 Queue Update: Only ${appointment.queuePosition - 1} patients ahead of you at ${appointment.clinicName}`, 'info')
          }
        }

        // Randomly trigger doctor arrival notification for demo
        if (Math.random() < 0.05) { // 5% chance every interval
          const appointment = userUpcomingAppointments[0]
          if (appointment.doctorStatus === 'not_arrived') {
            addNotification(`👩‍⚕️ Dr. ${appointment.doctorName} has arrived at ${appointment.clinicName}. Current token: ${appointment.currentToken}`, 'info')
          }
        }
      }
    }, 15000) // Check every 15 seconds

    return () => clearInterval(interval)
  }, [appointments, user.phone])

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setCurrentView('search')
  }

  const handleClinicSelect = (clinic: Clinic) => {
    setSelectedClinic(clinic)
    setCurrentView('clinic-details')
  }

  const handleBackToDashboard = () => {
    setCurrentView('dashboard')
    setSelectedClinic(null)
    setSearchQuery('')
  }

  const handleMenuToggle = () => {
    setShowMenu(!showMenu)
  }

  const handleLogout = () => {
    setShowMenu(false)
    onLogout()
  }

  const userAppointments = appointments.filter(apt => apt.patientPhone === user.phone && apt.status !== 'completed')

  if (currentView === 'search') {
    return (
      <SearchComponent
        searchQuery={searchQuery}
        dummyClinics={dummyClinics}
        onClinicSelect={handleClinicSelect}
        onBack={handleBackToDashboard}
        showAds={isFirstTime}
      />
    )
  }

  if (currentView === 'clinic-details' && selectedClinic) {
    return (
      <ClinicDetailsPage
        clinic={selectedClinic}
        user={user}
        appointments={appointments}
        onBack={handleBackToDashboard}
        onUpdateAppointments={onUpdateAppointments}
        onUpdateRecentVisits={onUpdateRecentVisits}
      />
    )
  }

  if (currentView === 'notifications') {
    return (
      <NotificationsPage
        user={user}
        appointments={appointments}
        onBack={() => setCurrentView('dashboard')}
      />
    )
  }

  if (currentView === 'profile') {
    return (
      <ProfilePage
        user={user}
        appointments={appointments}
        recentVisits={recentVisits}
        onBack={() => setCurrentView('dashboard')}
        onLogout={onLogout}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 pb-20">
      {/* Push Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-3 max-w-sm w-full">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`p-4 rounded-xl shadow-lg border-2 bg-background transition-all transform animate-in slide-in-from-right ${
              notification.type === 'success' ? 'border-green-200 bg-green-50' :
              notification.type === 'warning' ? 'border-yellow-200 bg-yellow-50' :
              notification.type === 'urgent' ? 'border-red-200 bg-red-50' :
              notification.type === 'reminder' ? 'border-purple-200 bg-purple-50' :
              'border-blue-200 bg-blue-50'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`mt-0.5 ${
                notification.type === 'success' ? 'text-green-600' :
                notification.type === 'warning' ? 'text-yellow-600' :
                notification.type === 'urgent' ? 'text-red-600' :
                notification.type === 'reminder' ? 'text-purple-600' :
                'text-blue-600'
              }`}>
                {notification.type === 'success' ? <CheckCircle className="w-5 h-5" /> :
                 notification.type === 'warning' ? <AlertTriangle className="w-5 h-5" /> :
                 notification.type === 'urgent' ? <Bell className="w-5 h-5 animate-pulse" /> :
                 notification.type === 'reminder' ? <Clock4 className="w-5 h-5" /> :
                 <Bell className="w-5 h-5" />}
              </div>
              <div className="flex-1">
                <p className={`text-sm font-medium ${
                  notification.type === 'success' ? 'text-green-800' :
                  notification.type === 'warning' ? 'text-yellow-800' :
                  notification.type === 'urgent' ? 'text-red-800' :
                  notification.type === 'reminder' ? 'text-purple-800' :
                  'text-blue-800'
                }`}>
                  {notification.message}
                </p>
              </div>
              <button
                onClick={() => removeNotification(notification.id)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <header className="bg-background shadow-lg border-b border-border sticky top-0 z-50">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-primary">Good morning, {user.name}</h1>
              <p className="text-sm text-muted-foreground">
                {isFirstTime ? 'Welcome to Appointments!' : 'Your health dashboard'}
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mt-4 relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="w-6 h-6 text-muted-foreground" />
            </div>
            <input
              type="text"
              placeholder="Search for clinics, doctors, or specialties..."
              className="w-full pl-12 pr-4 py-4 text-lg border-2 border-input bg-input-background rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all"
              onFocus={() => setCurrentView('search')}
              onClick={() => setCurrentView('search')}
            />
          </div>
        </div>
      </header>

      <main className="px-6 py-6 space-y-6">
        <AdBanner />

        {/* First-time user experience */}
        {isFirstTime ? (
          <>
            <div className="bg-background rounded-3xl shadow-xl border border-border p-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-primary mb-2">Find Healthcare Near You</h2>
                <p className="text-muted-foreground text-lg">Book appointments with top-rated doctors and clinics</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-primary/5 rounded-2xl p-4 text-center">
                  <div className="text-3xl mb-2">🏥</div>
                  <p className="font-semibold text-primary">500+ Clinics</p>
                  <p className="text-sm text-muted-foreground">Verified partners</p>
                </div>
                <div className="bg-primary/5 rounded-2xl p-4 text-center">
                  <div className="text-3xl mb-2">⚡</div>
                  <p className="font-semibold text-primary">Instant Booking</p>
                  <p className="text-sm text-muted-foreground">Real-time slots</p>
                </div>
              </div>
            </div>

            <AdBanner />

            <div className="bg-background rounded-3xl shadow-xl border border-border p-6">
              <h3 className="text-xl font-bold text-foreground mb-4">Popular Specialties</h3>
              <div className="grid grid-cols-2 gap-3">
                {['General Medicine', 'Cardiology', 'Pediatrics', 'Orthopedics', 'Dermatology', 'Dentistry'].map((specialty) => (
                  <button
                    key={specialty}
                    onClick={() => handleSearch(specialty)}
                    className="bg-muted hover:bg-primary/10 text-foreground p-4 rounded-2xl text-left transition-colors"
                  >
                    <p className="font-semibold">{specialty}</p>
                    <p className="text-sm text-muted-foreground">Find doctors</p>
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Returning user experience */}
            <div className="bg-background rounded-3xl shadow-xl border border-border p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-primary">Your Appointments</h2>
                <Calendar className="w-8 h-8 text-primary" />
              </div>

              {userAppointments.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground text-lg">No upcoming appointments</p>
                  <button
                    onClick={() => setCurrentView('search')}
                    className="mt-4 bg-primary text-primary-foreground px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors font-semibold"
                  >
                    Book Appointment
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {userAppointments.map((appointment) => (
                    <div key={appointment.id} className={`border-2 rounded-2xl p-5 ${
                      appointment.status === 'cancelled' 
                        ? 'border-red-200 bg-red-50' 
                        : appointment.queuePosition === 1 
                        ? 'border-green-200 bg-green-50'
                        : 'border-border bg-background'
                    }`}>
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-semibold text-foreground">{appointment.clinicName}</h3>
                            {appointment.status === 'cancelled' && (
                              <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
                                Cancelled
                              </span>
                            )}
                            {appointment.queuePosition === 1 && appointment.status === 'upcoming' && (
                              <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full animate-pulse">
                                You're Next!
                              </span>
                            )}
                            {appointment.doctorStatus === 'available' && appointment.status === 'upcoming' && (
                              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                                Doctor Available
                              </span>
                            )}
                          </div>
                          <p className="text-lg text-muted-foreground">{appointment.doctorName}</p>
                          <p className="text-base text-muted-foreground">
                            {appointment.date} {appointment.time ? `at ${appointment.time}` : ''}
                          </p>
                          {appointment.patientName !== user.name && (
                            <div className="flex items-center gap-2 mt-2">
                              <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                                <User className="w-3 h-3 text-primary" />
                              </div>
                              <p className="text-sm font-medium text-primary">
                                For: {appointment.patientName} ({appointment.patientAge} years old)
                              </p>
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className={`text-2xl font-bold rounded-2xl px-4 py-2 ${
                            appointment.status === 'cancelled'
                              ? 'text-red-600 bg-red-100'
                              : appointment.queuePosition === 1
                              ? 'text-green-600 bg-green-100 animate-pulse'
                              : 'text-primary bg-primary/10'
                          }`}>
                            #{appointment.tokenNumber}
                          </div>
                          {appointment.status === 'upcoming' && (
                            <p className="text-sm text-muted-foreground mt-1">Queue: {appointment.queuePosition}</p>
                          )}
                        </div>
                      </div>
                      
                      {appointment.status === 'upcoming' && (
                        <div className="mb-4">
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">
                              Currently serving: #{appointment.currentToken}
                            </p>
                            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                              appointment.doctorStatus === 'available' 
                                ? 'bg-green-100 text-green-800'
                                : appointment.doctorStatus === 'with_patient'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              Doctor: {appointment.doctorStatus === 'available' ? 'Available' : 
                                      appointment.doctorStatus === 'with_patient' ? 'With Patient' : 'Not Arrived'}
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex gap-3">
                        {appointment.status === 'upcoming' ? (
                          <>
                            <button className="flex-1 bg-primary text-primary-foreground py-3 px-4 rounded-xl hover:bg-primary/90 transition-colors font-semibold flex items-center justify-center gap-2">
                              <Phone className="w-4 h-4" />
                              Call Clinic
                            </button>
                            <button className="flex-1 bg-muted text-muted-foreground py-3 px-4 rounded-xl hover:bg-muted/80 transition-colors font-semibold flex items-center justify-center gap-2">
                              <MapPin className="w-4 h-4" />
                              Directions
                            </button>
                            <button 
                              onClick={() => handleCancelAppointment(appointment.id)}
                              className="bg-red-500 text-white py-3 px-4 rounded-xl hover:bg-red-600 transition-colors font-semibold flex items-center justify-center gap-2"
                            >
                              <X className="w-4 h-4" />
                              Cancel
                            </button>
                          </>
                        ) : (
                          <div className="w-full text-center py-3 px-4 bg-red-100 text-red-600 rounded-xl font-medium">
                            This appointment has been cancelled
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <AdBanner />

            <div className="bg-background rounded-3xl shadow-xl border border-border p-6">
              <h3 className="text-xl font-bold text-foreground mb-4">Recently Visited</h3>
              
              {recentVisits.length === 0 ? (
                <div className="text-center py-8">
                  <MapPin className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground text-lg">No recent visits</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentVisits.map((visit) => {
                    const clinic = dummyClinics.find(c => c.id === visit.clinicId)
                    return (
                      <button
                        key={visit.clinicId}
                        onClick={() => clinic && handleClinicSelect(clinic)}
                        className="w-full text-left border-2 border-border rounded-2xl p-5 hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold text-lg text-foreground">{visit.clinicName}</h4>
                            <p className="text-muted-foreground">{visit.address}</p>
                            <p className="text-sm text-muted-foreground">
                              Last visit: {new Date(visit.lastVisit).toLocaleDateString()} 
                              • {visit.totalVisits} visits
                            </p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-muted-foreground" />
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </>
        )}

        <AdBanner />
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50">
        <div className="flex items-center justify-around py-2 px-4">
          <button
            onClick={() => setCurrentView('dashboard')}
            className={`flex flex-col items-center py-2 px-3 rounded-xl transition-colors ${
              currentView === 'dashboard' 
                ? 'text-primary bg-primary/10' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Home className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">Home</span>
          </button>

          <button
            onClick={() => setCurrentView('search')}
            className={`flex flex-col items-center py-2 px-3 rounded-xl transition-colors ${
              currentView === 'search' 
                ? 'text-primary bg-primary/10' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Search className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">Search</span>
          </button>

          <button
            onClick={() => setCurrentView('notifications')}
            className={`flex flex-col items-center py-2 px-3 rounded-xl transition-colors relative ${
              currentView === 'notifications' 
                ? 'text-primary bg-primary/10' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Bell className="w-6 h-6 mb-1" />
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                {notificationCount}
              </span>
            )}
            <span className="text-xs font-medium">Alerts</span>
          </button>

          <button
            onClick={() => setCurrentView('profile')}
            className={`flex flex-col items-center py-2 px-3 rounded-xl transition-colors ${
              currentView === 'profile' 
                ? 'text-primary bg-primary/10' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <User className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">Profile</span>
          </button>
        </div>
      </nav>
    </div>
  )
}