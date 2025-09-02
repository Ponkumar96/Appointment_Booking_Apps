// Shared environment configuration for Supabase Edge Functions
// These environment variables are automatically available in the Supabase runtime

export const getEnvVar = (name: string, required: boolean = true): string => {
  const value = Deno.env.get(name)
  
  if (required && !value) {
    throw new Error(`Required environment variable ${name} is not set`)
  }
  
  return value || ''
}

// Supabase environment variables (automatically available)
export const SUPABASE_URL = getEnvVar('SUPABASE_URL')
export const SUPABASE_ANON_KEY = getEnvVar('SUPABASE_ANON_KEY')
export const SUPABASE_SERVICE_ROLE_KEY = getEnvVar('SUPABASE_SERVICE_ROLE_KEY')
export const SUPABASE_DB_URL = getEnvVar('SUPABASE_DB_URL')

// Custom environment variables (you can add these in Supabase dashboard)
export const APP_NAME = getEnvVar('APP_NAME', false) || 'Appointments App'
export const APP_VERSION = getEnvVar('APP_VERSION', false) || '1.0.0'
export const ENVIRONMENT = getEnvVar('ENVIRONMENT', false) || 'development'

// SMS/Notification settings (optional)
export const TWILIO_ACCOUNT_SID = getEnvVar('TWILIO_ACCOUNT_SID', false)
export const TWILIO_AUTH_TOKEN = getEnvVar('TWILIO_AUTH_TOKEN', false)
export const TWILIO_PHONE_NUMBER = getEnvVar('TWILIO_PHONE_NUMBER', false)

// Email settings (optional)
export const SMTP_HOST = getEnvVar('SMTP_HOST', false)
export const SMTP_PORT = getEnvVar('SMTP_PORT', false)
export const SMTP_USER = getEnvVar('SMTP_USER', false)
export const SMTP_PASS = getEnvVar('SMTP_PASS', false)

// API keys for external services (optional)
export const GOOGLE_MAPS_API_KEY = getEnvVar('GOOGLE_MAPS_API_KEY', false)
export const PUSH_NOTIFICATION_KEY = getEnvVar('PUSH_NOTIFICATION_KEY', false)

// Rate limiting and security
export const MAX_REQUESTS_PER_MINUTE = parseInt(getEnvVar('MAX_REQUESTS_PER_MINUTE', false) || '60')
export const JWT_SECRET = getEnvVar('JWT_SECRET', false)

// Feature flags
export const ENABLE_SMS_NOTIFICATIONS = getEnvVar('ENABLE_SMS_NOTIFICATIONS', false) === 'true'
export const ENABLE_EMAIL_NOTIFICATIONS = getEnvVar('ENABLE_EMAIL_NOTIFICATIONS', false) === 'true'
export const ENABLE_PUSH_NOTIFICATIONS = getEnvVar('ENABLE_PUSH_NOTIFICATIONS', false) === 'true'
export const ENABLE_REAL_TIME_UPDATES = getEnvVar('ENABLE_REAL_TIME_UPDATES', false) !== 'false' // Default to true

// Debug and logging
export const DEBUG_MODE = getEnvVar('DEBUG_MODE', false) === 'true'
export const LOG_LEVEL = getEnvVar('LOG_LEVEL', false) || 'info'

// Validate critical environment variables
export const validateEnvironment = () => {
  const errors: string[] = []
  
  if (!SUPABASE_URL) errors.push('SUPABASE_URL is required')
  if (!SUPABASE_ANON_KEY) errors.push('SUPABASE_ANON_KEY is required')
  if (!SUPABASE_SERVICE_ROLE_KEY) errors.push('SUPABASE_SERVICE_ROLE_KEY is required')
  
  if (errors.length > 0) {
    throw new Error(`Environment validation failed: ${errors.join(', ')}`)
  }
  
  return true
}