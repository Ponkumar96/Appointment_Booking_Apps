# 🚀 Quick Supabase Setup for Appointments App

## Step 1: Get Supabase Credentials

1. **Create Supabase Project**
   - Go to [https://supabase.com](https://supabase.com)
   - Sign up/Sign in
   - Click "New Project"
   - Choose organization and enter project details
   - Wait for project to initialize (2-3 minutes)

2. **Get Your Credentials**
   - In your Supabase dashboard, go to **Settings > API**
   - Copy these two values:
     - **Project URL**: `https://your-project-id.supabase.co`
     - **anon/public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

## Step 2: Configure Environment

1. **Update .env.local**
   - Open `/.env.local` in your project
   - Replace `https://your-project-id.supabase.co` with your actual Project URL
   - Replace `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your_anon_key_here` with your actual anon key
   - Save the file

## Step 3: Create Database

1. **Run Schema**
   - In Supabase dashboard, go to **SQL Editor**
   - Open `/lib/supabase-schema.sql` from your project
   - Copy the entire content
   - Paste into Supabase SQL Editor
   - Click **Run** ▶️

2. **Add Sample Data (Optional)**
   - Open `/lib/sample-data.sql` from your project  
   - Copy the entire content
   - Paste into Supabase SQL Editor
   - Click **Run** ▶️

## Step 4: Enable Authentication

1. **Phone Authentication**
   - Go to **Authentication > Settings** in Supabase
   - Scroll to **Auth Providers**
   - Enable **Phone** provider
   - For testing, phone auth will work with test numbers

## Step 5: Test Your Setup

1. **Start Development Server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

2. **Check Connection Status**
   - Look for green "Connected" indicator in your app
   - If red "Demo Mode", check your .env.local file

3. **Test Login**
   - Use phone: `+91 98765 43210`
   - Use OTP: `123456`
   - Should successfully log you in

## Step 6: Verify Features

✅ **Authentication**: Phone OTP authentication  
✅ **Clinics**: Browse available clinics  
✅ **Booking**: Book appointments with real-time updates  
✅ **Notifications**: Receive appointment reminders  
✅ **Dashboard**: View appointments and clinic data  

## 🔧 Troubleshooting

**"Demo Mode" showing?**
- Check .env.local has correct Supabase URL and key
- Restart development server after changing .env.local
- Ensure no extra spaces in environment variables

**Database errors?**
- Verify schema SQL ran successfully in Supabase
- Check for any error messages in Supabase SQL Editor
- Make sure all tables were created

**Authentication not working?**
- Enable Phone provider in Supabase Auth settings
- For production, configure Twilio for real SMS
- Test with the demo credentials first

**Real-time features not working?**
- Check browser console for WebSocket errors
- Verify your Supabase project has real-time enabled
- Ensure Row Level Security policies are set up correctly

## 📱 Test Data

After running sample-data.sql, you'll have:
- **5 sample clinics** with different specialties
- **Test user account** (phone: +91 98765 43210)
- **Sample appointments** and notifications
- **Mock doctors** with different statuses

## 🎯 Next Steps

Once everything is working:
1. **Customize clinic data** to match your real clinics
2. **Set up real SMS** via Twilio for production
3. **Add clinic staff accounts** with appropriate permissions
4. **Set up push notifications** for mobile app features

---

🎉 **You're all set!** Your appointments app now has a complete Supabase backend with real-time features, authentication, and data persistence.