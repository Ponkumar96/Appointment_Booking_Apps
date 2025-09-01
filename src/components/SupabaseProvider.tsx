import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { subscribeToNotifications } from '../lib/supabase-notifications'
import { subscribeToQueueUpdates } from '../lib/supabase-appointments'
import type { User, Notification } from '../lib/supabase'

interface SupabaseContextType {
  user: User | null
  notifications: Notification[]
  unreadCount: number
  refreshNotifications: () => void
  markAsRead: (notificationId: string) => void
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined)

export const useSupabase = () => {
  const context = useContext(SupabaseContext)
  if (!context) {
    throw new Error('useSupabase must be used within a SupabaseProvider')
  }
  return context
}

interface SupabaseProviderProps {
  children: React.ReactNode
  user: User | null
}

export const SupabaseProvider: React.FC<SupabaseProviderProps> = ({
  children,
  user
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  const refreshNotifications = useCallback(async () => {
    if (!user) return

    try {
      const { getUserNotifications } = await import('../lib/supabase-notifications')
      const result = await getUserNotifications(user.id)
      if (result.success) {
        setNotifications(result.notifications)
        setUnreadCount(result.notifications.filter(n => !n.is_read).length)
      }
    } catch (error) {
      console.error('Error refreshing notifications:', error)
    }
  }, [user])

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const { markNotificationAsRead } = await import('../lib/supabase-notifications')
      const result = await markNotificationAsRead(notificationId)
      if (result.success) {
        setNotifications(prev =>
          prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }, [])

  useEffect(() => {
    if (!user) return

    // Subscribe to real-time notifications
    const notificationSubscription = subscribeToNotifications(
      user.id,
      (payload) => {
        if (payload.eventType === 'INSERT') {
          setNotifications(prev => [payload.new, ...prev])
          if (!payload.new.is_read) {
            setUnreadCount(prev => prev + 1)
          }
        }
      }
    )

    return () => {
      notificationSubscription.unsubscribe()
    }
  }, [user])

  // Initial load of notifications
  useEffect(() => {
    if (user) {
      refreshNotifications()
    }
  }, [user, refreshNotifications])

  const value = useCallback(() => ({
    user,
    notifications,
    unreadCount,
    refreshNotifications,
    markAsRead
  }), [user, notifications, unreadCount, refreshNotifications, markAsRead])

  return (
    <SupabaseContext.Provider value={value()}>
      {children}
    </SupabaseContext.Provider>
  )
}