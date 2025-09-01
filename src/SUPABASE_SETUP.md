# Supabase Setup Guide for Appointments App

This guide will help you set up Supabase for your appointments booking application.

## Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign in
2. Click "New Project" 
3. Choose your organization
4. Enter project name: "appointments-app"
5. Enter database password (save this!)
6. Select region closest to you
7. Click "Create new project"

## Step 2: Get Your Credentials

1. Wait for project to finish setting up
2. Go to **Settings > API** in your Supabase dashboard
3. Copy the following:
   - **Project URL**: `https://your-project-id.supabase.co`
   - **anon/public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

## Step 3: Configure Environment Variables

1. In your project, rename `.env.example` to `.env.local`
2. Replace the placeholder values:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   ```

## Step 4: Create Database Schema

1. Go to **SQL Editor** in your Supabase dashboard
2. Copy the entire contents of `/lib/supabase-schema.sql`
3. Paste it into the SQL editor
4. Click **Run** to create all tables and functions

## Step 5: Enable Authentication

1. Go to **Authentication > Settings** in Supabase dashboard
2. Under **Auth Providers**, enable:
   - **Phone** (for OTP login)
   - **Google** (optional, for Google sign-in)

### Phone Authentication Setup:
1. In **Authentication > Settings > Phone**
2. Enable phone authentication
3. For testing, you can use the test phone number feature
4. For production, configure Twilio credentials

### Google Authentication Setup (Optional):
1. Create a Google Cloud Console project
2. Enable Google+ API
3. Create OAuth 2.0 credentials
4. Add your domain to authorized origins
5. Copy Client ID and Secret to Supabase

## Step 6: Add Sample Data (Optional)

Run this SQL to add sample clinics and doctors:

```sql
-- Insert sample clinics
INSERT INTO clinics (name, address, phone, specialties, booking_type, opens_at, closes_at, latitude, longitude) VALUES 
('City General Hospital', '123 Main Street, Downtown', '+1 (555) 123-4567', ARRAY['General Medicine', 'Emergency'], 'time_based', '09:00', '17:00', 40.7128, -74.0060),
('Heart Care Center', '456 Oak Avenue, Medical District', '+1 (555) 234-5678', ARRAY['Cardiology'], 'day_based', '10:00', '18:00', 40.7589, -73.9851),
('Pediatric Wellness Clinic', '789 Family Blvd, Suburbs', '+1 (555) 345-6789', ARRAY['Pediatrics'], 'time_based', '08:00', '16:00', 40.7282, -74.0776);

-- Insert sample doctors
INSERT INTO doctors (clinic_id, name, specialization) 
SELECT 
    c.id,
    doctor_name,
    specialization
FROM clinics c,
(VALUES 
    ('City General Hospital', 'Dr. Sarah Johnson', 'General Medicine'),
    ('City General Hospital', 'Dr. Michael Chen', 'Emergency Medicine'),
    ('Heart Care Center', 'Dr. Emily Davis', 'Cardiology'),
    ('Heart Care Center', 'Dr. Robert Wilson', 'Cardiac Surgery'),
    ('Pediatric Wellness Clinic', 'Dr. Lisa Martinez', 'Pediatrics'),
    ('Pediatric Wellness Clinic', 'Dr. David Brown', 'Child Psychology')
) AS doctors(clinic_name, doctor_name, specialization)
WHERE c.name = doctors.clinic_name;
```

## Step 7: Test Your Connection

1. Start your application
2. The connection status indicator should show "Connected" 
3. Try logging in with phone number: `+1 (555) 123-4567` and OTP: `123456`
4. Browse available clinics and try booking an appointment

## Step 8: Row Level Security (RLS)

Your database is already configured with Row Level Security policies that:

- ✅ Users can only see their own data
- ✅ Clinics and doctors are publicly viewable
- ✅ Appointments are private to users
- ✅ Notifications are private to users

## Step 9: Real-time Features

Your app includes real-time features:

- **Live Queue Updates**: Patients see real-time queue position changes
- **Instant Notifications**: Push notifications for appointment reminders
- **Doctor Status**: Live updates when doctors arrive or change status

## Troubleshooting

### Connection Issues:
- Check that environment variables are correct
- Ensure `.env.local` file is in project root
- Restart your development server after adding env variables

### Authentication Issues:
- Verify phone auth is enabled in Supabase dashboard
- Check that test phone numbers are configured
- For production, ensure Twilio credentials are set up

### Database Issues:
- Make sure all SQL from schema file ran successfully
- Check for any error messages in Supabase logs
- Verify RLS policies are enabled

### Real-time Issues:
- Ensure your Supabase project has real-time enabled
- Check browser console for WebSocket connection errors
- Verify your API key has the correct permissions

## Production Considerations

1. **Environment Variables**: Use proper production URLs
2. **Phone Authentication**: Set up Twilio for SMS
3. **Email**: Configure SMTP for email notifications
4. **Backups**: Enable automatic backups
5. **Monitoring**: Set up logging and monitoring
6. **Scaling**: Consider connection pooling for high traffic

## Security Notes

- Never commit `.env.local` to version control
- Use environment-specific credentials
- Regularly rotate API keys
- Monitor authentication logs
- Keep Supabase and dependencies updated

---

Your appointments app is now fully connected to Supabase with real-time capabilities, authentication, and a complete backend! 🎉