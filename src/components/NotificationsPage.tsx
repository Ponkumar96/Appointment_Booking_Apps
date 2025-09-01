import React from 'react'
import { ChevronLeft, Bell, Clock, Calendar, User, CheckCircle, AlertCircle } from 'lucide-react'
import type { User, Appointment } from '../App'
import AdBanner from './AdBanner'

interface Notification {
  id: string
  type: 'appointment' | 'reminder' | 'update' | 'general'
  title: string
  message: string
  time: string
  read: boolean
  urgent?: boolean
}

interface NotificationsPageProps {
  user: User
  appointments: Appointment[]
  onBack: () => void
}

export default function NotificationsPage({
  user,
  appointments,
  onBack
}: NotificationsPageProps) {
  // Mock notifications - in real app this would come from props or API
  const notifications: Notification[] = [
    {
      id: '1',
      type: 'reminder',
      title: 'Appointment Reminder',
      message: 'Your appointment with Dr. Emily Davis at Heart Care Center is tomorrow at 10:30 AM. Token: H06',
      time: '2 hours ago',
      read: false,
      urgent: true
    },
    {
      id: '2',
      type: 'update',
      title: 'Queue Update',
      message: 'Dr. Emily Davis is now serving token H04. You are next in line!',
      time: '5 hours ago',
      read: false
    },
    {
      id: '3',
      type: 'appointment',
      title: 'Booking Confirmed',
      message: 'Your appointment has been successfully booked with City General Hospital.',
      time: '1 day ago',
      read: true
    },
    {
      id: '4',
      type: 'general',
      title: 'Health Tips',
      message: 'Stay hydrated! Drink at least 8 glasses of water daily for better health.',
      time: '2 days ago',
      read: true
    },
    {
      id: '5',
      type: 'update',
      title: 'Doctor Availability',
      message: 'Dr. Sarah Johnson will be available 30 minutes earlier today. Updated time: 8:30 AM',
      time: '3 days ago',
      read: true
    }
  ]

  const unreadCount = notifications.filter(n => !n.read).length

  const getNotificationIcon = (type: string, urgent?: boolean) => {
    switch (type) {
      case 'appointment':
        return <Calendar className={`w-5 h-5 ${urgent ? 'text-red-500' : 'text-blue-500'}`} />
      case 'reminder':
        return <Clock className={`w-5 h-5 ${urgent ? 'text-red-500' : 'text-yellow-500'}`} />
      case 'update':
        return <AlertCircle className={`w-5 h-5 ${urgent ? 'text-red-500' : 'text-orange-500'}`} />
      case 'general':
        return <Bell className={`w-5 h-5 ${urgent ? 'text-red-500' : 'text-green-500'}`} />
      default:
        return <Bell className={`w-5 h-5 ${urgent ? 'text-red-500' : 'text-gray-500'}`} />
    }
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
              <ChevronLeft className="w-6 h-6 text-muted-foreground" />
            </button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-foreground">Notifications</h1>
              <p className="text-sm text-muted-foreground">
                {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
              </p>
            </div>
            {unreadCount > 0 && (
              <button className="text-primary hover:text-primary/80 transition-colors font-medium">
                Mark all as read
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="px-6 py-6 space-y-6">
        <AdBanner />

        <div className="bg-background rounded-3xl shadow-xl border border-border p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <Bell className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Your Notifications</h2>
              <p className="text-muted-foreground">Stay updated on your appointments and health</p>
            </div>
          </div>

          {notifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground text-lg">No notifications yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                We'll notify you about appointment updates and health reminders
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`border-2 rounded-2xl p-4 transition-colors ${
                    notification.read 
                      ? 'border-border bg-background hover:bg-muted/30' 
                      : 'border-primary/20 bg-primary/5 hover:bg-primary/10'
                  } ${notification.urgent ? 'ring-2 ring-red-200' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {getNotificationIcon(notification.type, notification.urgent)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`font-semibold ${notification.read ? 'text-foreground' : 'text-primary'}`}>
                          {notification.title}
                        </h3>
                        {notification.urgent && (
                          <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full font-medium">
                            Urgent
                          </span>
                        )}
                        {!notification.read && (
                          <div className="w-2 h-2 bg-primary rounded-full" />
                        )}
                      </div>
                      <p className={`text-sm ${notification.read ? 'text-muted-foreground' : 'text-foreground'} mb-2`}>
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">{notification.time}</p>
                        {!notification.read && (
                          <button className="text-xs text-primary hover:text-primary/80 transition-colors font-medium">
                            Mark as read
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <AdBanner />

        <div className="bg-background rounded-3xl shadow-xl border border-border p-6">
          <h3 className="text-lg font-bold text-foreground mb-4">Notification Settings</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-border">
              <div>
                <p className="font-medium text-foreground">Appointment Reminders</p>
                <p className="text-sm text-muted-foreground">Get notified before your appointments</p>
              </div>
              <div className="w-12 h-6 bg-primary rounded-full relative transition-colors">
                <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 right-0.5 transition-transform" />
              </div>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-border">
              <div>
                <p className="font-medium text-foreground">Queue Updates</p>
                <p className="text-sm text-muted-foreground">Real-time updates on your queue position</p>
              </div>
              <div className="w-12 h-6 bg-primary rounded-full relative transition-colors">
                <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 right-0.5 transition-transform" />
              </div>
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-foreground">Health Tips</p>
                <p className="text-sm text-muted-foreground">Weekly health and wellness tips</p>
              </div>
              <div className="w-12 h-6 bg-muted rounded-full relative transition-colors">
                <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 left-0.5 transition-transform" />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}