import { createClient } from 'npm:@supabase/supabase-js@2'
import { 
  SUPABASE_URL, 
  SUPABASE_SERVICE_ROLE_KEY,
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_PHONE_NUMBER,
  ENABLE_SMS_NOTIFICATIONS,
  validateEnvironment,
  DEBUG_MODE 
} from '../_shared/env.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

// Validate environment on startup
try {
  validateEnvironment()
} catch (error) {
  console.error('Environment validation failed:', error)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// SMS sending function (requires Twilio configuration)
const sendSMS = async (to: string, message: string) => {
  if (!ENABLE_SMS_NOTIFICATIONS || !TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
    if (DEBUG_MODE) {
      console.log('SMS not configured, skipping SMS send')
    }
    return { success: false, error: 'SMS not configured' }
  }

  try {
    const auth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)
    
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          From: TWILIO_PHONE_NUMBER,
          To: to,
          Body: message,
        }),
      }
    )

    if (!response.ok) {
      throw new Error(`Twilio API error: ${response.status}`)
    }

    return { success: true }
  } catch (error) {
    console.error('SMS send error:', error)
    return { success: false, error: error.message }
  }
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const path = url.pathname.replace('/functions/v1/notifications', '')
    
    if (DEBUG_MODE) {
      console.log(`[${req.method}] ${path}`)
    }

    switch (path) {
      case '/send-appointment-reminder':
        if (req.method === 'POST') {
          const { appointment_id } = await req.json()
          
          // Get appointment details
          const { data: appointment, error } = await supabase
            .from('appointments')
            .select(`
              *,
              clinic:clinics(*),
              doctor:doctors(*),
              user:users(*)
            `)
            .eq('id', appointment_id)
            .single()

          if (error || !appointment) {
            return new Response(
              JSON.stringify({ error: 'Appointment not found' }),
              { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }

          // Create notification in database
          const notificationMessage = `Reminder: You have an appointment today at ${appointment.clinic?.name} with ${appointment.doctor?.name || 'the doctor'} at ${appointment.appointment_time || 'your scheduled time'}.`
          
          const { data: notification, error: notifError } = await supabase
            .from('notifications')
            .insert({
              user_id: appointment.user_id,
              title: 'Appointment Reminder',
              message: notificationMessage,
              type: 'appointment_reminder',
              appointment_id: appointment_id
            })
            .select()
            .single()

          if (notifError) {
            return new Response(
              JSON.stringify({ error: notifError.message }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }

          // Send SMS if configured
          if (ENABLE_SMS_NOTIFICATIONS && appointment.user?.phone) {
            const smsResult = await sendSMS(appointment.user.phone, notificationMessage)
            if (DEBUG_MODE) {
              console.log('SMS send result:', smsResult)
            }
          }

          return new Response(
            JSON.stringify({ 
              notification,
              sms_sent: ENABLE_SMS_NOTIFICATIONS 
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        break

      case '/send-queue-update':
        if (req.method === 'POST') {
          const { user_id, message, appointment_id } = await req.json()
          
          // Create notification
          const { data: notification, error } = await supabase
            .from('notifications')
            .insert({
              user_id,
              title: 'Queue Update',
              message,
              type: 'queue_update',
              appointment_id
            })
            .select()
            .single()

          if (error) {
            return new Response(
              JSON.stringify({ error: error.message }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }

          // Get user phone for SMS
          const { data: user } = await supabase
            .from('users')
            .select('phone')
            .eq('id', user_id)
            .single()

          // Send SMS if configured
          if (ENABLE_SMS_NOTIFICATIONS && user?.phone) {
            await sendSMS(user.phone, message)
          }

          return new Response(
            JSON.stringify({ notification }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        break

      case '/health':
        return new Response(
          JSON.stringify({ 
            status: 'healthy',
            timestamp: new Date().toISOString(),
            environment: {
              sms_enabled: ENABLE_SMS_NOTIFICATIONS,
              twilio_configured: !!(TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN),
              debug_mode: DEBUG_MODE
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      default:
        return new Response(
          JSON.stringify({ error: 'Not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: DEBUG_MODE ? error.message : undefined
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})