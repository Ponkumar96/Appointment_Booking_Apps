import React, { useState, useEffect } from 'react'
import { 
  LogOut, 
  Clock, 
  Users, 
  BarChart3, 
  Settings, 
  Plus, 
  ArrowLeft, 
  Phone, 
  MapPin,
  Calendar,
  Activity,
  X,
  ChevronRight,
  User,
  Stethoscope,
  Timer,
  UserCheck,
  UserX,
  Coffee,
  Home,
  MoreVertical,
  Bell,
  CheckCircle,
  Circle,
  Clock4,
  AlertCircle,
  Menu,
  FileText,
  History
} from 'lucide-react'
import type { User, Clinic, Appointment, Patient, Doctor, Handler, ActivityLog } from '../App'

interface ClinicDashboardProps {
  user: User
  appointments: Appointment[]
  patients: Patient[]
  clinics: Clinic[]
  activityLogs: ActivityLog[]
  onLogout: () => void
  onUpdateAppointments: (appointments: Appointment[]) => void
  onUpdatePatients: (patients: Patient[]) => void
  onUpdateClinic: (clinic: Clinic) => void
  onAddHandler: (handler: Handler) => void
  onAddActivityLog: (log: ActivityLog) => void
}

export default function ClinicDashboard({
  user,
  appointments,
  patients,
  clinics,
  activityLogs,
  onLogout,
  onUpdateAppointments,
  onUpdatePatients,
  onUpdateClinic,
  onAddHandler,
  onAddActivityLog
}: ClinicDashboardProps) {
  const [currentView, setCurrentView] = useState<'doctors' | 'patient-queue' | 'admin-dashboard' | 'handlers' | 'activity-logs'>('doctors')
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('')
  const [showAddHandler, setShowAddHandler] = useState(false)
  const [showAddDoctor, setShowAddDoctor] = useState(false)
  const [showStatusMenu, setShowStatusMenu] = useState<string | null>(null)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [handlerForm, setHandlerForm] = useState({ name: '', phone: '' })
  const [doctorForm, setDoctorForm] = useState({
    name: '',
    specialty: '',
    experience: '',
    startTime: '09:00',
    endTime: '17:00',
    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    maxTokensPerDay: 20,
    consultationDurationMinutes: 15
  })

  const clinic = clinics.find(c => c.id === user.clinicId)
  if (!clinic) return null

  const todayPatients = patients.filter(p => 
    p.clinicId === clinic.id && 
    p.date === new Date().toISOString().split('T')[0]
  )

  const selectedDoctor = clinic.doctors.find(d => d.id === selectedDoctorId)
  const doctorPatients = selectedDoctor 
    ? todayPatients.filter(p => p.doctorId === selectedDoctor.id)
    : []

  const handlePatientStatusUpdate = (patientId: string, newStatus: Patient['status']) => {
    const patient = patients.find(p => p.id === patientId)
    if (!patient) return

    const oldStatus = patient.status
    const updatedPatients = patients.map(p => 
      p.id === patientId ? { ...p, status: newStatus } : p
    )
    onUpdatePatients(updatedPatients)

    // Log the activity
    const activityLog: ActivityLog = {
      id: `activity_${Date.now()}`,
      timestamp: new Date().toISOString(),
      handlerName: user.handlerName || user.name,
      handlerId: user.id,
      action: 'patient_status_change',
      targetType: 'patient',
      targetName: `${patient.patientName} (${patient.tokenNumber})`,
      targetId: patient.id,
      details: `Updated patient status from ${oldStatus.replace('_', ' ')} to ${newStatus.replace('_', ' ')}`,
      oldValue: oldStatus,
      newValue: newStatus,
      clinicId: clinic.id
    }
    onAddActivityLog(activityLog)

    if (selectedDoctor) {
      let doctorStatus: Doctor['status'] = 'available'
      if (newStatus === 'with_doctor') {
        doctorStatus = 'with_patient'
      }

      const updatedClinic = {
        ...clinic,
        doctors: clinic.doctors.map(d => 
          d.id === selectedDoctor.id ? { ...d, status: doctorStatus } : d
        )
      }
      onUpdateClinic(updatedClinic)
    }
  }

  const handleAddHandler = () => {
    if (!handlerForm.name || !handlerForm.phone) {
      alert('Please fill in all fields')
      return
    }

    const newHandler: Handler = {
      id: `handler_${Date.now()}`,
      name: handlerForm.name,
      phone: handlerForm.phone,
      clinicId: clinic.id,
      canManageAllDoctors: true
    }

    onAddHandler(newHandler)
    setHandlerForm({ name: '', phone: '' })
    setShowAddHandler(false)
  }

  const handleAddDoctor = () => {
    if (!doctorForm.name || !doctorForm.specialty || !doctorForm.experience) {
      alert('Please fill in all required fields')
      return
    }

    const newDoctor: Doctor = {
      id: `doctor_${clinic.id}_${Date.now()}`,
      name: doctorForm.name,
      specialty: doctorForm.specialty,
      experience: doctorForm.experience,
      available: true,
      clinicId: clinic.id,
      clinicName: clinic.name,
      clinicAddress: clinic.address,
      status: 'not_arrived' as const,
      timings: {
        startTime: doctorForm.startTime,
        endTime: doctorForm.endTime,
        days: doctorForm.days
      },
      maxTokensPerDay: doctorForm.maxTokensPerDay,
      consultationDurationMinutes: doctorForm.consultationDurationMinutes,
      currentToken: `${doctorForm.name.charAt(3).toUpperCase()}01`,
      nextToken: `${doctorForm.name.charAt(3).toUpperCase()}01`,
      totalPatientsToday: 0,
      completedToday: 0
    }

    const updatedClinic = {
      ...clinic,
      doctors: [...clinic.doctors, newDoctor]
    }

    onUpdateClinic(updatedClinic)
    setDoctorForm({
      name: '',
      specialty: '',
      experience: '',
      startTime: '09:00',
      endTime: '17:00',
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      maxTokensPerDay: 20,
      consultationDurationMinutes: 15
    })
    setShowAddDoctor(false)
  }

  const toggleDay = (day: string) => {
    setDoctorForm(prev => ({
      ...prev,
      days: prev.days.includes(day) 
        ? prev.days.filter(d => d !== day)
        : [...prev.days, day]
    }))
  }

  const getStatusIcon = (status: Doctor['status']) => {
    switch (status) {
      case 'not_arrived': return <UserX className="w-4 h-4 text-red-500" />
      case 'available': return <UserCheck className="w-4 h-4 text-green-500" />
      case 'with_patient': return <Stethoscope className="w-4 h-4 text-blue-500" />
      case 'break': return <Coffee className="w-4 h-4 text-orange-500" />
      default: return <User className="w-4 h-4 text-muted-foreground" />
    }
  }

  const getStatusText = (status: Doctor['status']) => {
    switch (status) {
      case 'not_arrived': return 'Not Arrived'
      case 'available': return 'Available'
      case 'with_patient': return 'With Patient'
      case 'break': return 'On Break'
      default: return 'Unknown'
    }
  }

  const getPatientStatusColor = (status: Patient['status']) => {
    switch (status) {
      case 'waiting': return 'bg-orange-100 text-orange-700 border-orange-200'
      case 'arrived': return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'with_doctor': return 'bg-green-100 text-green-700 border-green-200'
      case 'completed': return 'bg-gray-100 text-gray-700 border-gray-200'
      case 'missed': return 'bg-red-100 text-red-700 border-red-200'
      case 'no_show': return 'bg-red-100 text-red-700 border-red-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const handleDoctorStatusChange = (doctorId: string, newStatus: Doctor['status']) => {
    const doctor = clinic.doctors.find(d => d.id === doctorId)
    if (!doctor) return

    const oldStatus = doctor.status

    // Send notifications to patients if doctor is not arriving
    if (newStatus === 'not_arrived') {
      const doctorPatients = todayPatients.filter(p => 
        p.doctorId === doctorId && ['waiting', 'arrived'].includes(p.status)
      )
      
      if (doctorPatients.length > 0) {
        // Simulate notification sending
        alert(`🔔 Notification sent to ${doctorPatients.length} patient(s): Dr. ${doctor.name} is delayed. You will be notified when they arrive.`)
      }
    }

    const updatedClinic = {
      ...clinic,
      doctors: clinic.doctors.map(d => 
        d.id === doctorId ? { ...d, status: newStatus } : d
      )
    }
    onUpdateClinic(updatedClinic)

    // Log the activity
    const activityLog: ActivityLog = {
      id: `activity_${Date.now()}`,
      timestamp: new Date().toISOString(),
      handlerName: user.handlerName || user.name,
      handlerId: user.id,
      action: 'doctor_status_change',
      targetType: 'doctor',
      targetName: doctor.name,
      targetId: doctor.id,
      details: `Updated doctor status from ${oldStatus.replace('_', ' ')} to ${newStatus.replace('_', ' ')}`,
      oldValue: oldStatus,
      newValue: newStatus,
      clinicId: clinic.id
    }
    onAddActivityLog(activityLog)

    setShowStatusMenu(null)
  }

  const getStatusOptions = () => [
    { value: 'not_arrived', label: 'Not Arrived', icon: UserX, color: 'text-red-500' },
    { value: 'available', label: 'Available', icon: UserCheck, color: 'text-green-500' },
    { value: 'with_patient', label: 'With Patient', icon: Stethoscope, color: 'text-blue-500' },
    { value: 'break', label: 'On Break', icon: Coffee, color: 'text-orange-500' }
  ]

  // Close status menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showStatusMenu) {
        setShowStatusMenu(null)
      }
    }

    if (showStatusMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showStatusMenu])

  return (
    <div className={`min-h-screen bg-background ${user.isAdmin ? 'pb-20' : 'pb-6'}`}>
      {/* Mobile Header */}
      <header className="bg-background border-b border-border sticky top-0 z-40 shadow-sm">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            {currentView === 'patient-queue' ? (
              <>
                <button
                  onClick={() => {
                    setCurrentView('doctors')
                    setSelectedDoctorId('')
                  }}
                  className="text-muted-foreground hover:text-foreground p-2"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                
                <div className="flex-1 text-center">
                  <h1 className="text-lg font-bold text-primary">
                    {selectedDoctor?.name}
                  </h1>
                  <p className="text-sm text-muted-foreground">{selectedDoctor?.specialty}</p>
                </div>
                
                <div className="w-10"></div> {/* Spacer for symmetry */}
              </>
            ) : (
              <>
                <div className="flex-1">
                  <h1 className="text-lg font-bold text-primary truncate">{clinic.name}</h1>
                  <p className="text-sm text-muted-foreground">
                    {user.isAdmin ? 'Admin Dashboard' : 'Handler Dashboard'}
                  </p>
                </div>
                
                {/* Profile Menu for Handlers */}
                {!user.isAdmin && (
                  <div className="relative">
                    <button
                      onClick={() => setShowProfileMenu(!showProfileMenu)}
                      className="text-muted-foreground hover:text-foreground p-2"
                    >
                      <Menu className="w-5 h-5" />
                    </button>
                    
                    {showProfileMenu && (
                      <div className="absolute right-0 top-full mt-1 bg-background border border-border rounded-xl shadow-lg p-2 min-w-48 z-50">
                        <div className="p-3 border-b border-border">
                          <p className="font-semibold text-foreground">{user.handlerName || user.name}</p>
                          <p className="text-sm text-muted-foreground">{user.phone}</p>
                          <p className="text-xs text-primary">Handler</p>
                        </div>
                        <button
                          onClick={onLogout}
                          className="w-full flex items-center gap-3 p-3 rounded-lg text-left hover:bg-muted transition-colors text-red-600"
                        >
                          <LogOut className="w-4 h-4" />
                          <span className="font-medium">Logout</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </header>

      <main className="px-4 py-6 space-y-6 pb-24">
        {/* Doctors List View (Default Home) */}
        {currentView === 'doctors' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-primary">Select Doctor</h2>
              {user.isAdmin && (
                <button
                  onClick={() => setShowAddDoctor(true)}
                  className="bg-primary text-primary-foreground p-3 rounded-xl hover:bg-primary/90 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              )}
            </div>

            <div className="space-y-3">
              {clinic.doctors.map(doctor => {
                const doctorTodayPatients = todayPatients.filter(p => p.doctorId === doctor.id)
                const completedToday = doctorTodayPatients.filter(p => p.status === 'completed').length
                const waitingCount = doctorTodayPatients.filter(p => ['waiting', 'arrived'].includes(p.status)).length
                const totalPatients = doctorTodayPatients.length
                
                return (
                  <div key={doctor.id} className="bg-background rounded-2xl shadow-sm border border-border overflow-hidden">
                    {/* Main Doctor Card - Clickable */}
                    <button
                      onClick={() => {
                        setSelectedDoctorId(doctor.id)
                        setCurrentView('patient-queue')
                      }}
                      className="w-full p-4 hover:bg-muted/30 transition-all text-left"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                              <Stethoscope className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-foreground text-lg">{doctor.name}</h3>
                              <p className="text-muted-foreground text-sm">{doctor.specialty}</p>
                              <p className="text-muted-foreground text-xs">{doctor.experience} experience</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <ChevronRight className="w-5 h-5 text-muted-foreground" />
                        </div>
                      </div>
                      
                      {/* Statistics Grid */}
                      <div className="grid grid-cols-4 gap-3 mb-4">
                        <div className="bg-blue-50 rounded-xl p-3 text-center">
                          <p className="text-xl font-bold text-blue-600">{totalPatients}</p>
                          <p className="text-xs text-blue-600 font-medium">Total</p>
                        </div>
                        <div className="bg-orange-50 rounded-xl p-3 text-center">
                          <p className="text-xl font-bold text-orange-600">{waitingCount}</p>
                          <p className="text-xs text-orange-600 font-medium">Waiting</p>
                        </div>
                        <div className="bg-green-50 rounded-xl p-3 text-center">
                          <p className="text-xl font-bold text-green-600">{completedToday}</p>
                          <p className="text-xs text-green-600 font-medium">Completed</p>
                        </div>
                        <div className="bg-purple-50 rounded-xl p-3 text-center">
                          <p className="text-xl font-bold text-purple-600">{doctor.currentToken}</p>
                          <p className="text-xs text-purple-600 font-medium">Current</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{doctor.timings.startTime} - {doctor.timings.endTime}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Timer className="w-4 h-4" />
                            <span>{doctor.consultationDurationMinutes} min</span>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                            Available for booking
                          </span>
                        </div>
                      </div>
                    </button>
                  </div>
                )
              })}
              
              {clinic.doctors.length === 0 && (
                <div className="bg-background rounded-2xl shadow-sm border border-border p-8 text-center">
                  <Stethoscope className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground mb-1">No doctors added yet</p>
                  {user.isAdmin && (
                    <p className="text-muted-foreground text-sm">Add doctors to start managing appointments</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Patient Queue Management */}
        {currentView === 'patient-queue' && selectedDoctor && (
          <div className="space-y-4">
            <div className="bg-background rounded-2xl shadow-sm border border-border p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-foreground">{selectedDoctor.name}</h3>
                  <p className="text-muted-foreground text-sm">{selectedDoctor.specialty}</p>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(selectedDoctor.status)}
                  <span className="text-sm font-medium">{getStatusText(selectedDoctor.status)}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                  <p className="text-lg font-bold text-primary">{doctorPatients.length}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-orange-600">{doctorPatients.filter(p => ['waiting', 'arrived'].includes(p.status)).length}</p>
                  <p className="text-xs text-muted-foreground">Waiting</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-green-600">{doctorPatients.filter(p => p.status === 'completed').length}</p>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-muted-foreground">{selectedDoctor.currentToken}</p>
                  <p className="text-xs text-muted-foreground">Current</p>
                </div>
              </div>

              {/* Doctor Status Controls */}
              <div className="flex items-center justify-between pt-3 border-t border-border">
                <div className="flex items-center gap-2">
                  {getStatusIcon(selectedDoctor.status)}
                  <span className="text-sm font-medium text-foreground">
                    Status: {getStatusText(selectedDoctor.status)}
                  </span>
                </div>
                
                <div className="relative">
                  <button
                    onClick={() => setShowStatusMenu(showStatusMenu === selectedDoctor.id ? null : selectedDoctor.id)}
                    className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                  >
                    Change Status
                  </button>
                  
                  {/* Status Menu */}
                  {showStatusMenu === selectedDoctor.id && (
                    <div className="absolute right-0 bottom-full mb-2 bg-background border border-border rounded-xl shadow-lg p-2 min-w-48 z-50">
                      {getStatusOptions().map(option => {
                        const IconComponent = option.icon
                        return (
                          <button
                            key={option.value}
                            onClick={() => handleDoctorStatusChange(selectedDoctor.id, option.value as Doctor['status'])}
                            className={`w-full flex items-center gap-3 p-3 rounded-lg text-left hover:bg-muted transition-colors ${
                              selectedDoctor.status === option.value ? 'bg-primary/10 border border-primary/20' : ''
                            }`}
                          >
                            <IconComponent className={`w-4 h-4 ${option.color}`} />
                            <span className="font-medium">{option.label}</span>
                            {selectedDoctor.status === option.value && (
                              <CheckCircle className="w-4 h-4 text-primary ml-auto" />
                            )}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Status indicators for notifications */}
              {selectedDoctor.status === 'not_arrived' && doctorPatients.filter(p => ['waiting', 'arrived'].includes(p.status)).length > 0 && (
                <div className="mt-3 flex items-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <Bell className="w-4 h-4 text-orange-600" />
                  <span className="text-sm text-orange-700">
                    {doctorPatients.filter(p => ['waiting', 'arrived'].includes(p.status)).length} patient{doctorPatients.filter(p => ['waiting', 'arrived'].includes(p.status)).length > 1 ? 's' : ''} will be notified of delay
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-3">
              {doctorPatients.length === 0 ? (
                <div className="bg-background rounded-2xl shadow-sm border border-border p-8 text-center">
                  <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No patients today</p>
                </div>
              ) : (
                doctorPatients
                  .sort((a, b) => a.queuePosition - b.queuePosition)
                  .map(patient => (
                    <div key={patient.id} className="bg-background rounded-2xl shadow-sm border border-border p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-primary">{patient.tokenNumber}</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPatientStatusColor(patient.status)}`}>
                              {patient.status.replace('_', ' ').toUpperCase()}
                            </span>
                          </div>
                          <h4 className="font-semibold text-foreground">{patient.patientName}</h4>
                          <p className="text-muted-foreground text-sm">Age: {patient.patientAge}</p>
                          {patient.reason && (
                            <p className="text-muted-foreground text-sm mt-1">Reason: {patient.reason}</p>
                          )}
                        </div>
                        
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Booked: {patient.bookingTime}</p>
                          {patient.arrivalTime && (
                            <p className="text-sm text-muted-foreground">Arrived: {patient.arrivalTime}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {patient.status === 'waiting' && (
                          <>
                            <button
                              onClick={() => handlePatientStatusUpdate(patient.id, 'arrived')}
                              className="flex-1 bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition-colors font-medium"
                            >
                              Mark Arrived
                            </button>
                            <button
                              onClick={() => handlePatientStatusUpdate(patient.id, 'no_show')}
                              className="bg-red-600 text-white px-4 py-3 rounded-xl hover:bg-red-700 transition-colors font-medium"
                            >
                              No Show
                            </button>
                          </>
                        )}
                        
                        {patient.status === 'arrived' && (
                          <>
                            <button
                              onClick={() => handlePatientStatusUpdate(patient.id, 'with_doctor')}
                              className="flex-1 bg-green-600 text-white py-3 rounded-xl hover:bg-green-700 transition-colors font-medium"
                            >
                              Start Consultation
                            </button>
                            <button
                              onClick={() => handlePatientStatusUpdate(patient.id, 'no_show')}
                              className="bg-red-600 text-white px-4 py-3 rounded-xl hover:bg-red-700 transition-colors font-medium"
                            >
                              No Show
                            </button>
                          </>
                        )}
                        
                        {patient.status === 'with_doctor' && (
                          <button
                            onClick={() => handlePatientStatusUpdate(patient.id, 'completed')}
                            className="flex-1 bg-gray-600 text-white py-3 rounded-xl hover:bg-gray-700 transition-colors font-medium"
                          >
                            Complete
                          </button>
                        )}
                        
                        {['waiting', 'arrived'].includes(patient.status) && (
                          <button className="bg-muted text-muted-foreground px-4 py-3 rounded-xl hover:bg-muted/80 transition-colors">
                            <Phone className="w-4 h-4" />
                          </button>
                        )}
                        
                        {!['waiting', 'arrived'].includes(patient.status) && (
                          <button className="bg-muted text-muted-foreground px-4 py-3 rounded-xl hover:bg-muted/80 transition-colors">
                            <Phone className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        )}

        {/* Admin Dashboard */}
        {currentView === 'admin-dashboard' && user.isAdmin && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-primary">Analytics Dashboard</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-background rounded-2xl shadow-sm border border-border p-4 text-center">
                <Activity className="w-8 h-8 text-primary mx-auto mb-2" />
                <p className="text-2xl font-bold text-foreground">{clinic.doctors.length}</p>
                <p className="text-sm text-muted-foreground">Total Doctors</p>
              </div>
              
              <div className="bg-background rounded-2xl shadow-sm border border-border p-4 text-center">
                <Users className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-foreground">{todayPatients.length}</p>
                <p className="text-sm text-muted-foreground">Patients Today</p>
              </div>
              
              <div className="bg-background rounded-2xl shadow-sm border border-border p-4 text-center">
                <Clock className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-foreground">{todayPatients.filter(p => ['waiting', 'arrived'].includes(p.status)).length}</p>
                <p className="text-sm text-muted-foreground">Waiting</p>
              </div>
              
              <div className="bg-background rounded-2xl shadow-sm border border-border p-4 text-center">
                <UserCheck className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-foreground">{todayPatients.filter(p => p.status === 'completed').length}</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </div>

            <div className="bg-background rounded-2xl shadow-sm border border-border p-4">
              <h3 className="font-semibold text-foreground mb-3">Doctor Performance</h3>
              <div className="space-y-3">
                {clinic.doctors.map(doctor => {
                  const doctorTodayPatients = todayPatients.filter(p => p.doctorId === doctor.id)
                  const completed = doctorTodayPatients.filter(p => p.status === 'completed').length
                  
                  return (
                    <div key={doctor.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">{doctor.name}</p>
                        <p className="text-sm text-muted-foreground">{doctor.specialty}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-primary">{completed}/{doctorTodayPatients.length}</p>
                        <p className="text-xs text-muted-foreground">Completed</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Handlers Management */}
        {currentView === 'handlers' && user.isAdmin && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-primary">Handler Management</h2>
              <button
                onClick={() => setShowAddHandler(true)}
                className="bg-primary text-primary-foreground p-3 rounded-xl hover:bg-primary/90 transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
              <p className="text-primary font-semibold mb-2 text-sm">Handler Permissions:</p>
              <ul className="text-muted-foreground text-sm space-y-1">
                <li>• Login using phone number with OTP</li>
                <li>• Manage patient queues for all doctors</li>
                <li>• Track arrivals and consultations</li>
                <li>• Cannot add other handlers (admin only)</li>
              </ul>
            </div>

            <div className="space-y-3">
              {clinic.handlers.length === 0 ? (
                <div className="bg-background rounded-2xl shadow-sm border border-border p-8 text-center">
                  <Phone className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground mb-1">No handlers added yet</p>
                  <p className="text-muted-foreground text-sm">Add handlers to help manage queues</p>
                </div>
              ) : (
                clinic.handlers.map(handler => (
                  <div key={handler.id} className="bg-background rounded-2xl shadow-sm border border-border p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-foreground">{handler.name}</h4>
                        <p className="text-muted-foreground text-sm">{handler.phone}</p>
                        <span className="text-xs text-primary">Can manage all doctors</span>
                      </div>
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                        Active
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Activity Logs Management */}
        {currentView === 'activity-logs' && user.isAdmin && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-primary">Activity Logs</h2>
            
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
              <p className="text-primary font-semibold mb-2 text-sm">Handler Activity Tracking:</p>
              <ul className="text-muted-foreground text-sm space-y-1">
                <li>• All handler actions are logged with timestamps</li>
                <li>• Track patient status changes and doctor updates</li>
                <li>• Monitor handler login/logout activities</li>
                <li>• Maintain accountability and transparency</li>
              </ul>
            </div>

            <div className="bg-background rounded-2xl shadow-sm border border-border p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">Recent Activity</h3>
                <div className="text-sm text-muted-foreground">
                  Total: {activityLogs.filter(log => log.clinicId === clinic.id).length} logs
                </div>
              </div>
              
              <div className="space-y-3">
                {activityLogs
                  .filter(log => log.clinicId === clinic.id)
                  .slice(0, 20)
                  .map(log => {
                    const getActionIcon = (action: ActivityLog['action']) => {
                      switch (action) {
                        case 'patient_status_change':
                          return <User className="w-4 h-4 text-blue-600" />
                        case 'doctor_status_change':
                          return <Stethoscope className="w-4 h-4 text-green-600" />
                        case 'handler_login':
                          return <UserCheck className="w-4 h-4 text-green-600" />
                        case 'handler_logout':
                          return <UserX className="w-4 h-4 text-red-600" />
                        default:
                          return <Activity className="w-4 h-4 text-muted-foreground" />
                      }
                    }

                    const getActionColor = (action: ActivityLog['action']) => {
                      switch (action) {
                        case 'patient_status_change':
                          return 'bg-blue-50 text-blue-700 border-blue-200'
                        case 'doctor_status_change':
                          return 'bg-green-50 text-green-700 border-green-200'
                        case 'handler_login':
                          return 'bg-green-50 text-green-700 border-green-200'
                        case 'handler_logout':
                          return 'bg-red-50 text-red-700 border-red-200'
                        default:
                          return 'bg-gray-50 text-gray-700 border-gray-200'
                      }
                    }

                    const formatTimestamp = (timestamp: string) => {
                      const date = new Date(timestamp)
                      const now = new Date()
                      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
                      
                      if (diffInMinutes < 1) return 'Just now'
                      if (diffInMinutes < 60) return `${diffInMinutes}m ago`
                      if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
                      return date.toLocaleDateString()
                    }

                    return (
                      <div key={log.id} className="bg-muted/30 rounded-xl p-4 border border-border">
                        <div className="flex items-start gap-3">
                          <div className="mt-1">
                            {getActionIcon(log.action)}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-foreground">{log.handlerName}</span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getActionColor(log.action)}`}>
                                {log.action.replace('_', ' ').toUpperCase()}
                              </span>
                            </div>
                            
                            <p className="text-sm text-muted-foreground mb-2">{log.details}</p>
                            
                            <div className="flex items-center justify-between">
                              <div className="text-xs text-muted-foreground">
                                Target: {log.targetName}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {formatTimestamp(log.timestamp)}
                              </div>
                            </div>
                            
                            {log.oldValue && log.newValue && (
                              <div className="mt-2 pt-2 border-t border-border text-xs">
                                <span className="text-red-600 line-through">{log.oldValue.replace('_', ' ')}</span>
                                <span className="mx-2 text-muted-foreground">→</span>
                                <span className="text-green-600">{log.newValue.replace('_', ' ')}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                
                {activityLogs.filter(log => log.clinicId === clinic.id).length === 0 && (
                  <div className="bg-background rounded-2xl shadow-sm border border-border p-8 text-center">
                    <History className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground mb-1">No activity logs yet</p>
                    <p className="text-muted-foreground text-sm">Handler activities will appear here</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Add Handler Modal */}
      {showAddHandler && user.isAdmin && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center p-0 z-50">
          <div className="bg-background rounded-t-3xl w-full max-h-[70vh] overflow-y-auto">
            <div className="sticky top-0 bg-background rounded-t-3xl border-b border-border p-4 z-10">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-bold text-foreground">Add Handler</h4>
                <button
                  onClick={() => setShowAddHandler(false)}
                  className="text-muted-foreground hover:text-foreground p-2"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-4 space-y-4 pb-24">
              <div>
                <label className="block font-semibold text-foreground mb-2">Handler Name *</label>
                <input
                  type="text"
                  value={handlerForm.name}
                  onChange={(e) => setHandlerForm({...handlerForm, name: e.target.value})}
                  className="w-full px-4 py-4 border-2 border-input bg-input-background rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary"
                  placeholder="Alice Johnson"
                />
              </div>

              <div>
                <label className="block font-semibold text-foreground mb-2">Phone Number *</label>
                <input
                  type="tel"
                  value={handlerForm.phone}
                  onChange={(e) => setHandlerForm({...handlerForm, phone: e.target.value})}
                  className="w-full px-4 py-4 border-2 border-input bg-input-background rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>

            <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4">
              <div className="flex gap-3">
                <button
                  onClick={() => setShowAddHandler(false)}
                  className="bg-muted text-muted-foreground py-4 px-6 rounded-xl hover:bg-muted/80 transition-colors font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddHandler}
                  className="flex-1 bg-primary text-primary-foreground py-4 px-4 rounded-xl hover:bg-primary/90 transition-colors font-semibold"
                >
                  Add Handler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Doctor Modal */}
      {showAddDoctor && user.isAdmin && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center p-0 z-50">
          <div className="bg-background rounded-t-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-background rounded-t-3xl border-b border-border p-4 z-10">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-bold text-foreground">Add New Doctor</h4>
                <button
                  onClick={() => setShowAddDoctor(false)}
                  className="text-muted-foreground hover:text-foreground p-2"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-4 space-y-4 pb-24">
              <div>
                <label className="block font-semibold text-foreground mb-2">Doctor Name *</label>
                <input
                  type="text"
                  value={doctorForm.name}
                  onChange={(e) => setDoctorForm({...doctorForm, name: e.target.value})}
                  className="w-full px-4 py-4 border-2 border-input bg-input-background rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary"
                  placeholder="Dr. John Smith"
                />
              </div>
              
              <div>
                <label className="block font-semibold text-foreground mb-2">Specialty *</label>
                <input
                  type="text"
                  value={doctorForm.specialty}
                  onChange={(e) => setDoctorForm({...doctorForm, specialty: e.target.value})}
                  className="w-full px-4 py-4 border-2 border-input bg-input-background rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary"
                  placeholder="Cardiology"
                />
              </div>

              <div>
                <label className="block font-semibold text-foreground mb-2">Experience *</label>
                <input
                  type="text"
                  value={doctorForm.experience}
                  onChange={(e) => setDoctorForm({...doctorForm, experience: e.target.value})}
                  className="w-full px-4 py-4 border-2 border-input bg-input-background rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary"
                  placeholder="10 years"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-foreground mb-2">Start Time</label>
                  <input
                    type="time"
                    value={doctorForm.startTime}
                    onChange={(e) => setDoctorForm({...doctorForm, startTime: e.target.value})}
                    className="w-full px-4 py-4 border-2 border-input bg-input-background rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-foreground mb-2">End Time</label>
                  <input
                    type="time"
                    value={doctorForm.endTime}
                    onChange={(e) => setDoctorForm({...doctorForm, endTime: e.target.value})}
                    className="w-full px-4 py-4 border-2 border-input bg-input-background rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-foreground mb-2">Working Days</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`py-3 px-3 rounded-lg text-sm font-medium transition-colors ${
                        doctorForm.days.includes(day)
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                    >
                      {day.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-foreground mb-2">Max Tokens/Day</label>
                  <input
                    type="number"
                    value={doctorForm.maxTokensPerDay}
                    onChange={(e) => setDoctorForm({...doctorForm, maxTokensPerDay: parseInt(e.target.value)})}
                    className="w-full px-4 py-4 border-2 border-input bg-input-background rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary"
                    min="1"
                    max="50"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-foreground mb-2">Consultation Duration</label>
                  <select
                    value={doctorForm.consultationDurationMinutes}
                    onChange={(e) => setDoctorForm({...doctorForm, consultationDurationMinutes: parseInt(e.target.value)})}
                    className="w-full px-4 py-4 border-2 border-input bg-input-background rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary"
                  >
                    <option value={10}>10 mins</option>
                    <option value={15}>15 mins</option>
                    <option value={20}>20 mins</option>
                    <option value={30}>30 mins</option>
                    <option value={45}>45 mins</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4">
              <div className="flex gap-3">
                <button
                  onClick={() => setShowAddDoctor(false)}
                  className="bg-muted text-muted-foreground py-4 px-6 rounded-xl hover:bg-muted/80 transition-colors font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddDoctor}
                  className="flex-1 bg-primary text-primary-foreground py-4 px-4 rounded-xl hover:bg-primary/90 transition-colors font-semibold"
                >
                  Add Doctor
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation - Only for Admins */}
      {user.isAdmin && (
        <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50">
          <div className="flex items-center justify-around py-2 px-4">
            <button
              onClick={() => setCurrentView('doctors')}
              className={`flex flex-col items-center py-2 px-3 rounded-xl transition-colors ${
                currentView === 'doctors' 
                  ? 'text-primary bg-primary/10' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Stethoscope className="w-6 h-6 mb-1" />
              <span className="text-xs font-medium">Doctors</span>
            </button>

            <button
              onClick={() => setCurrentView('admin-dashboard')}
              className={`flex flex-col items-center py-2 px-3 rounded-xl transition-colors ${
                currentView === 'admin-dashboard' 
                  ? 'text-primary bg-primary/10' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <BarChart3 className="w-6 h-6 mb-1" />
              <span className="text-xs font-medium">Analytics</span>
            </button>

            <button
              onClick={() => setCurrentView('handlers')}
              className={`flex flex-col items-center py-2 px-3 rounded-xl transition-colors ${
                currentView === 'handlers' 
                  ? 'text-primary bg-primary/10' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Settings className="w-6 h-6 mb-1" />
              <span className="text-xs font-medium">Handlers</span>
            </button>

            <button
              onClick={() => setCurrentView('activity-logs')}
              className={`flex flex-col items-center py-2 px-3 rounded-xl transition-colors ${
                currentView === 'activity-logs' 
                  ? 'text-primary bg-primary/10' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <History className="w-6 h-6 mb-1" />
              <span className="text-xs font-medium">Activity Logs</span>
            </button>

            <button
              onClick={onLogout}
              className="flex flex-col items-center py-2 px-3 rounded-xl transition-colors text-red-600 hover:bg-red-50"
            >
              <LogOut className="w-6 h-6 mb-1" />
              <span className="text-xs font-medium">Logout</span>
            </button>
          </div>
        </nav>
      )}
    </div>
  )
}