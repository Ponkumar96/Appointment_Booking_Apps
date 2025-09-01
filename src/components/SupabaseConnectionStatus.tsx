import React, { useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react'

export default function SupabaseConnectionStatus() {
  const [status, setStatus] = useState<'checking' | 'connected' | 'error' | 'missing-config'>('checking')
  const [error, setError] = useState<string>('')

  useEffect(() => {
    checkConnection()
  }, [])

  const checkConnection = async () => {
    try {
      // Check if environment variables are set
      if (!isSupabaseConfigured()) {
        setStatus('missing-config')
        setError('Supabase environment variables are not configured')
        return
      }

      // Test the connection
      const { data, error } = await supabase
        .from('users')
        .select('count', { count: 'exact', head: true })

      if (error) {
        setStatus('error')
        setError(error.message)
      } else {
        setStatus('connected')
      }
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'checking':
        return <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
      case 'connected':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />
      case 'missing-config':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />
    }
  }

  const getStatusMessage = () => {
    switch (status) {
      case 'checking':
        return 'Checking Supabase connection...'
      case 'connected':
        return 'Supabase is connected and ready!'
      case 'error':
        return `Supabase connection error: ${error}`
      case 'missing-config':
        return 'Running in demo mode. Supabase not configured.'
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case 'checking':
        return 'border-blue-200 bg-blue-50'
      case 'connected':
        return 'border-green-200 bg-green-50'
      case 'error':
        return 'border-red-200 bg-red-50'
      case 'missing-config':
        return 'border-yellow-200 bg-yellow-50'
    }
  }

  // Only show in development or when there are issues
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    // Always show in development
  } else if (status === 'connected') {
    // Don't show when everything is working in production
    return null
  }

  return (
    <div className={`fixed bottom-4 right-4 p-3 rounded-lg border-2 ${getStatusColor()} z-50 max-w-sm shadow-lg`}>
      <div className="flex items-center gap-2">
        {getStatusIcon()}
        <p className="text-sm font-medium">{getStatusMessage()}</p>
      </div>
      {status === 'missing-config' && (
        <div className="mt-2 text-xs text-gray-600">
          <p>App is running with dummy data.</p>
          <p className="mt-1">To enable Supabase, add environment variables:</p>
          <code className="block mt-1 p-2 bg-gray-100 rounded text-xs">
            NEXT_PUBLIC_SUPABASE_URL=your_url<br/>
            NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
          </code>
        </div>
      )}
      {status === 'connected' && (
        <button
          onClick={() => setStatus('checking')}
          className="mt-2 text-xs text-green-700 hover:text-green-800 underline"
        >
          Test again
        </button>
      )}
    </div>
  )
}