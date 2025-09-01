import React, { useState, useEffect } from 'react'
import { CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { isSupabaseConfigured, supabase } from '../lib/supabase'

interface ValidationResult {
  name: string
  status: 'success' | 'error' | 'warning' | 'loading'
  message: string
  details?: string
}

export default function SetupValidator() {
  const [isValidating, setIsValidating] = useState(false)
  const [results, setResults] = useState<ValidationResult[]>([])
  const [showValidator, setShowValidator] = useState(false)

  const validationTests = [
    {
      name: 'Environment Variables',
      test: async (): Promise<ValidationResult> => {
        if (!isSupabaseConfigured()) {
          return {
            name: 'Environment Variables',
            status: 'error',
            message: 'Supabase environment variables not configured',
            details: 'Update .env.local with your Supabase URL and anon key'
          }
        }
        return {
          name: 'Environment Variables',
          status: 'success',
          message: 'Environment variables configured correctly'
        }
      }
    },
    {
      name: 'Supabase Connection',
      test: async (): Promise<ValidationResult> => {
        if (!isSupabaseConfigured()) {
          return {
            name: 'Supabase Connection',
            status: 'error',
            message: 'Cannot test connection - environment not configured'
          }
        }

        try {
          const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true })
          if (error) {
            return {
              name: 'Supabase Connection',
              status: 'error',
              message: 'Failed to connect to Supabase',
              details: error.message
            }
          }
          return {
            name: 'Supabase Connection',
            status: 'success',
            message: 'Successfully connected to Supabase'
          }
        } catch (error) {
          return {
            name: 'Supabase Connection',
            status: 'error',
            message: 'Connection failed',
            details: error instanceof Error ? error.message : 'Unknown error'
          }
        }
      }
    },
    {
      name: 'Database Schema',
      test: async (): Promise<ValidationResult> => {
        if (!isSupabaseConfigured()) {
          return {
            name: 'Database Schema',
            status: 'error',
            message: 'Cannot test schema - environment not configured'
          }
        }

        const requiredTables = ['users', 'clinics', 'doctors', 'appointments', 'notifications']
        const missingTables: string[] = []

        for (const table of requiredTables) {
          try {
            const { error } = await supabase.from(table).select('*').limit(1)
            if (error) {
              missingTables.push(table)
            }
          } catch (error) {
            missingTables.push(table)
          }
        }

        if (missingTables.length > 0) {
          return {
            name: 'Database Schema',
            status: 'error',
            message: `Missing tables: ${missingTables.join(', ')}`,
            details: 'Run the SQL schema from /lib/supabase-schema.sql in Supabase SQL Editor'
          }
        }

        return {
          name: 'Database Schema',
          status: 'success',
          message: 'All required tables found'
        }
      }
    },
    {
      name: 'Authentication Setup',
      test: async (): Promise<ValidationResult> => {
        if (!isSupabaseConfigured()) {
          return {
            name: 'Authentication Setup',
            status: 'error',
            message: 'Cannot test auth - environment not configured'
          }
        }

        try {
          const { data: { session }, error } = await supabase.auth.getSession()
          if (error) {
            return {
              name: 'Authentication Setup',
              status: 'warning',
              message: 'Authentication system accessible but may need configuration',
              details: 'Enable Phone and/or Google auth in Supabase dashboard'
            }
          }
          return {
            name: 'Authentication Setup',
            status: 'success',
            message: 'Authentication system working'
          }
        } catch (error) {
          return {
            name: 'Authentication Setup',
            status: 'error',
            message: 'Authentication test failed',
            details: error instanceof Error ? error.message : 'Unknown error'
          }
        }
      }
    },
    {
      name: 'Sample Data',
      test: async (): Promise<ValidationResult> => {
        if (!isSupabaseConfigured()) {
          return {
            name: 'Sample Data',
            status: 'error',
            message: 'Cannot check sample data - environment not configured'
          }
        }

        try {
          const { data: clinics, error } = await supabase.from('clinics').select('id').limit(1)
          if (error) {
            return {
              name: 'Sample Data',
              status: 'error',
              message: 'Cannot check sample data',
              details: error.message
            }
          }

          if (!clinics || clinics.length === 0) {
            return {
              name: 'Sample Data',
              status: 'warning',
              message: 'No sample data found',
              details: 'Run /lib/sample-data.sql in Supabase SQL Editor for test data'
            }
          }

          return {
            name: 'Sample Data',
            status: 'success',
            message: 'Sample data available'
          }
        } catch (error) {
          return {
            name: 'Sample Data',
            status: 'error',
            message: 'Sample data check failed',
            details: error instanceof Error ? error.message : 'Unknown error'
          }
        }
      }
    }
  ]

  const runValidation = async () => {
    setIsValidating(true)
    setResults([])

    for (const test of validationTests) {
      // Set loading state
      setResults(prev => [...prev, {
        name: test.name,
        status: 'loading',
        message: 'Testing...'
      }])

      try {
        const result = await test.test()
        
        // Update with actual result
        setResults(prev => prev.map(r => 
          r.name === test.name ? result : r
        ))
      } catch (error) {
        setResults(prev => prev.map(r => 
          r.name === test.name ? {
            name: test.name,
            status: 'error' as const,
            message: 'Test failed',
            details: error instanceof Error ? error.message : 'Unknown error'
          } : r
        ))
      }

      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    setIsValidating(false)
  }

  const getStatusIcon = (status: ValidationResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />
      case 'loading':
        return <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
    }
  }

  const getStatusBadge = (status: ValidationResult['status']) => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-100 text-green-800">Pass</Badge>
      case 'error':
        return <Badge variant="destructive">Fail</Badge>
      case 'warning':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Warning</Badge>
      case 'loading':
        return <Badge variant="outline">Testing...</Badge>
    }
  }

  const overallStatus = results.length > 0 ? 
    results.some(r => r.status === 'error') ? 'error' :
    results.some(r => r.status === 'warning') ? 'warning' : 
    results.every(r => r.status === 'success') ? 'success' : 'loading'
    : 'loading'

  if (!showValidator) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button 
          onClick={() => setShowValidator(true)}
          variant="outline"
          size="sm"
          className="shadow-lg"
        >
          <AlertCircle className="w-4 h-4 mr-2" />
          Setup Validator
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Supabase Setup Validator</CardTitle>
              <CardDescription>
                Check if your Supabase configuration is working correctly
              </CardDescription>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowValidator(false)}
            >
              ✕
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Button 
                onClick={runValidation}
                disabled={isValidating}
                className="flex items-center gap-2"
              >
                {isValidating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Running Tests...
                  </>
                ) : (
                  'Run Validation'
                )}
              </Button>
              
              {results.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Overall:</span>
                  {getStatusBadge(overallStatus)}
                </div>
              )}
            </div>

            {results.length > 0 && (
              <div className="space-y-3">
                {results.map((result, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                    {getStatusIcon(result.status)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{result.name}</span>
                        {getStatusBadge(result.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">{result.message}</p>
                      {result.details && (
                        <p className="text-xs text-muted-foreground mt-1 p-2 bg-muted rounded">
                          {result.details}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {results.length > 0 && overallStatus === 'success' && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-800">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">All tests passed!</span>
                </div>
                <p className="text-sm text-green-700 mt-1">
                  Your Supabase setup is working correctly. You can now use all features of the appointments app.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}