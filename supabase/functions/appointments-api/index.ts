import { createClient } from 'npm:@supabase/supabase-js@2'
import { 
  SUPABASE_URL, 
  SUPABASE_SERVICE_ROLE_KEY,
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

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const path = url.pathname.replace('/functions/v1/appointments-api', '')
    
    if (DEBUG_MODE) {
      console.log(`[${req.method}] ${path}`)
    }

    // Route handling
    switch (path) {
      case '/health':
        return new Response(
          JSON.stringify({ 
            status: 'healthy', 
            timestamp: new Date().toISOString(),
            environment: {
              supabase_configured: !!SUPABASE_URL,
              debug_mode: DEBUG_MODE
            }
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )

      case '/appointments':
        if (req.method === 'GET') {
          // Get user appointments
          const authHeader = req.headers.get('Authorization')
          if (!authHeader) {
            return new Response(
              JSON.stringify({ error: 'Authorization header required' }),
              { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }

          const { data: { user }, error: authError } = await supabase.auth.getUser(
            authHeader.replace('Bearer ', '')
          )

          if (authError || !user) {
            return new Response(
              JSON.stringify({ error: 'Invalid authorization' }),
              { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }

          const { data: appointments, error } = await supabase
            .from('appointments')
            .select(`
              *,
              clinic:clinics(*),
              doctor:doctors(*)
            `)
            .eq('user_id', user.id)
            .order('appointment_date', { ascending: true })

          if (error) {
            return new Response(
              JSON.stringify({ error: error.message }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }

          return new Response(
            JSON.stringify({ appointments }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        if (req.method === 'POST') {
          // Create new appointment
          const body = await req.json()
          const authHeader = req.headers.get('Authorization')
          
          if (!authHeader) {
            return new Response(
              JSON.stringify({ error: 'Authorization header required' }),
              { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }

          const { data: { user }, error: authError } = await supabase.auth.getUser(
            authHeader.replace('Bearer ', '')
          )

          if (authError || !user) {
            return new Response(
              JSON.stringify({ error: 'Invalid authorization' }),
              { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }

          // Generate token number
          const tokenNumber = `A${Math.floor(Math.random() * 999) + 1}`.padStart(4, '0')
          
          const { data: appointment, error } = await supabase
            .from('appointments')
            .insert({
              user_id: user.id,
              clinic_id: body.clinic_id,
              doctor_id: body.doctor_id,
              patient_name: body.patient_name,
              patient_phone: body.patient_phone,
              patient_age: body.patient_age,
              appointment_date: body.appointment_date,
              appointment_time: body.appointment_time,
              token_number: tokenNumber,
              queue_position: 1 // This would be calculated properly
            })
            .select(`
              *,
              clinic:clinics(*),
              doctor:doctors(*)
            `)
            .single()

          if (error) {
            return new Response(
              JSON.stringify({ error: error.message }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }

          return new Response(
            JSON.stringify({ appointment }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        break

      case '/clinics':
        if (req.method === 'GET') {
          const searchQuery = url.searchParams.get('search')
          
          let query = supabase
            .from('clinics')
            .select('*')
            .eq('is_active', true)

          if (searchQuery) {
            query = query.or(`name.ilike.%${searchQuery}%,address.ilike.%${searchQuery}%`)
          }

          const { data: clinics, error } = await query.order('rating', { ascending: false })

          if (error) {
            return new Response(
              JSON.stringify({ error: error.message }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }

          return new Response(
            JSON.stringify({ clinics }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        break

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