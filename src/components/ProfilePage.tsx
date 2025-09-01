import React, { useState } from 'react'
import { ChevronLeft, User, Phone, Calendar, Clock, MapPin, Edit, Save, X, Bell, Shield, Heart, Activity, LogOut } from 'lucide-react'
import type { User as UserType, Appointment, RecentVisit } from '../App'
import AdBanner from './AdBanner'

interface ProfilePageProps {
  user: UserType
  appointments: Appointment[]
  recentVisits: RecentVisit[]
  onBack: () => void
  onUpdateUser?: (user: UserType) => void
  onLogout?: () => void
}

export default function ProfilePage({
  user,
  appointments,
  recentVisits,
  onBack,
  onUpdateUser,
  onLogout
}: ProfilePageProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedUser, setEditedUser] = useState(user)

  const userAppointments = appointments.filter(apt => apt.patientPhone === user.phone)
  const completedAppointments = userAppointments.filter(apt => apt.status === 'completed')
  const upcomingAppointments = userAppointments.filter(apt => apt.status === 'upcoming')

  const handleSave = () => {
    if (onUpdateUser) {
      onUpdateUser(editedUser)
    }
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditedUser(user)
    setIsEditing(false)
  }

  const stats = [
    {
      icon: <Calendar className="w-6 h-6 text-blue-500" />,
      label: 'Total Appointments',
      value: userAppointments.length.toString(),
      subtext: `${completedAppointments.length} completed`
    },
    {
      icon: <Clock className="w-6 h-6 text-green-500" />,
      label: 'Upcoming',
      value: upcomingAppointments.length.toString(),
      subtext: 'scheduled'
    },
    {
      icon: <MapPin className="w-6 h-6 text-purple-500" />,
      label: 'Clinics Visited',
      value: recentVisits.length.toString(),
      subtext: 'different locations'
    },
    {
      icon: <Heart className="w-6 h-6 text-red-500" />,
      label: 'Health Score',
      value: '85',
      subtext: 'Good'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-background shadow-lg border-b border-border sticky top-0 z-50">
        <div className="px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-muted rounded-xl transition-colors"
            >
              <ChevronLeft className="w-6 h-6 text-muted-foreground" />
            </button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-foreground">My Profile</h1>
              <p className="text-sm text-muted-foreground">Manage your account and preferences</p>
            </div>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors font-medium"
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleCancel}
                  className="flex items-center gap-2 px-4 py-2 bg-muted text-muted-foreground rounded-xl hover:bg-muted/80 transition-colors font-medium"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors font-medium"
                >
                  <Save className="w-4 h-4" />
                  Save
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="px-6 py-6 space-y-6">
        <AdBanner />

        {/* Profile Card */}
        <div className="bg-background rounded-3xl shadow-xl border border-border p-6">
          <div className="flex items-center gap-6 mb-6">
            <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center">
              <User className="w-10 h-10 text-primary-foreground" />
            </div>
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={editedUser.name}
                    onChange={(e) => setEditedUser({ ...editedUser, name: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-input bg-input-background rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all"
                    placeholder="Full Name"
                  />
                  <input
                    type="number"
                    value={editedUser.age || ''}
                    onChange={(e) => setEditedUser({ ...editedUser, age: parseInt(e.target.value) || undefined })}
                    className="w-full px-4 py-3 border-2 border-input bg-input-background rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all"
                    placeholder="Age"
                  />
                </div>
              ) : (
                <>
                  <h2 className="text-2xl font-bold text-foreground">{user.name}</h2>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="w-4 h-4" />
                      <span>{user.phone}</span>
                    </div>
                    {user.age && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <User className="w-4 h-4" />
                        <span>{user.age} years old</span>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            {stats.map((stat, index) => (
              <div key={index} className="bg-muted/30 rounded-2xl p-4 text-center">
                <div className="flex justify-center mb-2">
                  {stat.icon}
                </div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="font-medium text-foreground">{stat.label}</p>
                <p className="text-sm text-muted-foreground">{stat.subtext}</p>
              </div>
            ))}
          </div>
        </div>

        <AdBanner />

        {/* Account Settings */}
        <div className="bg-background rounded-3xl shadow-xl border border-border p-6">
          <h3 className="text-xl font-bold text-foreground mb-6">Account Settings</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-4 border-b border-border">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-foreground">Notifications</p>
                  <p className="text-sm text-muted-foreground">Manage your notification preferences</p>
                </div>
              </div>
              <div className="w-12 h-6 bg-primary rounded-full relative transition-colors">
                <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 right-0.5 transition-transform" />
              </div>
            </div>
            
            <div className="flex items-center justify-between py-4 border-b border-border">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-foreground">Privacy</p>
                  <p className="text-sm text-muted-foreground">Control your data and privacy settings</p>
                </div>
              </div>
              <button className="text-primary hover:text-primary/80 transition-colors font-medium">
                Manage
              </button>
            </div>
            
            <div className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                <Activity className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-foreground">Health Data</p>
                  <p className="text-sm text-muted-foreground">Export your health and appointment data</p>
                </div>
              </div>
              <button className="text-primary hover:text-primary/80 transition-colors font-medium">
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-background rounded-3xl shadow-xl border border-border p-6">
          <h3 className="text-xl font-bold text-foreground mb-6">Recent Activity</h3>
          
          {userAppointments.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground text-lg">No appointments yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Book your first appointment to get started
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {userAppointments.slice(0, 3).map((appointment) => (
                <div key={appointment.id} className="flex items-center gap-4 p-4 border border-border rounded-2xl">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">{appointment.clinicName}</p>
                    <p className="text-sm text-muted-foreground">{appointment.doctorName}</p>
                    <p className="text-sm text-muted-foreground">{appointment.date}</p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                    appointment.status === 'completed' 
                      ? 'bg-green-100 text-green-700' 
                      : appointment.status === 'upcoming'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                  </div>
                </div>
              ))}
              
              {userAppointments.length > 3 && (
                <button className="w-full py-3 text-primary hover:text-primary/80 transition-colors font-medium">
                  View all appointments
                </button>
              )}
            </div>
          )}
        </div>

        <AdBanner />

        {/* Logout Section */}
        {onLogout && (
          <div className="bg-background rounded-3xl shadow-xl border border-border p-6">
            <h3 className="text-xl font-bold text-foreground mb-6">Account Actions</h3>
            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-colors font-semibold border border-red-200"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
            <p className="text-sm text-muted-foreground mt-3 text-center">
              You can always sign back in with your phone number
            </p>
          </div>
        )}

        {/* Emergency Contact */}
        <div className="bg-background rounded-3xl shadow-xl border border-border p-6">
          <h3 className="text-xl font-bold text-foreground mb-6">Emergency Contact</h3>
          
          {isEditing ? (
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Emergency contact name"
                className="w-full px-4 py-3 border-2 border-input bg-input-background rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all"
              />
              <input
                type="tel"
                placeholder="Emergency contact phone"
                className="w-full px-4 py-3 border-2 border-input bg-input-background rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all"
              />
              <input
                type="text"
                placeholder="Relationship"
                className="w-full px-4 py-3 border-2 border-input bg-input-background rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
          ) : (
            <div className="text-center py-8">
              <Phone className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground text-lg">No emergency contact added</p>
              <p className="text-sm text-muted-foreground mt-2">
                Add an emergency contact for safety
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}