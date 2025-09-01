// Test Supabase Connection
// Run this with: node lib/test-connection.js

import { createClient } from '@supabase/supabase-js'

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('🔍 Testing Supabase Connection...\n')

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Environment variables not found!')
  console.log('Make sure you have created .env.local with:')
  console.log('NEXT_PUBLIC_SUPABASE_URL=your_url')
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  try {
    // Test 1: Basic connection
    console.log('1. Testing basic connection...')
    const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true })
    
    if (error) {
      console.log('❌ Connection failed:', error.message)
      return false
    }
    console.log('✅ Connection successful!')

    // Test 2: Check if tables exist
    console.log('\n2. Checking database tables...')
    const tables = ['users', 'clinics', 'doctors', 'appointments', 'notifications']
    
    for (const table of tables) {
      const { error: tableError } = await supabase.from(table).select('*').limit(1)
      if (tableError) {
        console.log(`❌ Table '${table}' not found or accessible`)
        console.log('   Make sure you ran the schema SQL in Supabase dashboard')
        return false
      } else {
        console.log(`✅ Table '${table}' exists`)
      }
    }

    // Test 3: Check sample data
    console.log('\n3. Checking sample data...')
    const { data: clinics, error: clinicsError } = await supabase
      .from('clinics')
      .select('id, name')
      .limit(3)
    
    if (clinicsError) {
      console.log('❌ Error fetching clinics:', clinicsError.message)
    } else if (clinics.length === 0) {
      console.log('⚠️  No sample clinics found')
      console.log('   Consider running the sample-data.sql script')
    } else {
      console.log(`✅ Found ${clinics.length} sample clinics:`)
      clinics.forEach(clinic => console.log(`   - ${clinic.name}`))
    }

    // Test 4: Test real-time capabilities
    console.log('\n4. Testing real-time connection...')
    const channel = supabase.channel('test-channel')
    
    await new Promise((resolve) => {
      channel
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'users' }, 
          () => console.log('✅ Real-time subscription working!')
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('✅ Real-time connection established')
            resolve()
          }
        })
    })

    await channel.unsubscribe()

    // Test 5: Authentication setup
    console.log('\n5. Checking authentication setup...')
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    
    if (authError) {
      console.log('❌ Auth error:', authError.message)
    } else {
      console.log('✅ Authentication system accessible')
      console.log('   Session:', session ? 'Active' : 'None (expected)')
    }

    console.log('\n🎉 All tests passed! Your Supabase setup is ready!')
    console.log('\nNext steps:')
    console.log('1. Start your development server')
    console.log('2. Test login with phone: +1 (555) 123-4567 and OTP: 123456')
    console.log('3. Browse clinics and book appointments')
    
    return true

  } catch (error) {
    console.log('❌ Unexpected error:', error.message)
    return false
  }
}

// Run the test
testConnection().then((success) => {
  process.exit(success ? 0 : 1)
})