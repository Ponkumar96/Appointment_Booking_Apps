# 🔧 Environment Variables Setup Guide

## Overview
This guide explains how to configure environment variables for your Supabase project to enable advanced features like SMS notifications, email alerts, and external API integrations.

## 🏗️ Built-in Supabase Environment Variables

These are **automatically available** in all Supabase Edge Functions:

```bash
SUPABASE_URL              # Your project URL
SUPABASE_ANON_KEY         # Public anon key  
SUPABASE_SERVICE_ROLE_KEY # Service role key (full access)
SUPABASE_DB_URL           # Direct database connection URL
```

**✅ No setup required** - these are managed by Supabase automatically.

## 🛠️ Custom Environment Variables

Add these in your **Supabase Dashboard > Edge Functions > Environment Variables**:

### Core Application Settings
```bash
APP_NAME=Appointments App
APP_VERSION=1.0.0
ENVIRONMENT=production
DEBUG_MODE=false
LOG_LEVEL=info
```

### SMS Notifications (Twilio)
```bash
ENABLE_SMS_NOTIFICATIONS=true
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

### Email Notifications (SMTP)
```bash
ENABLE_EMAIL_NOTIFICATIONS=true
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### External API Keys
```bash
GOOGLE_MAPS_API_KEY=your_google_maps_key
PUSH_NOTIFICATION_KEY=your_push_notification_key
```

### Security & Rate Limiting
```bash
MAX_REQUESTS_PER_MINUTE=60
JWT_SECRET=your-jwt-secret-key
```

### Feature Flags
```bash
ENABLE_PUSH_NOTIFICATIONS=true
ENABLE_REAL_TIME_UPDATES=true
```

## 📋 How to Add Environment Variables

### Step 1: Access Supabase Dashboard
1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Edge Functions** in the sidebar

### Step 2: Add Environment Variables
1. Click on **Environment Variables** tab
2. Click **Add Variable**
3. Enter **Name** and **Value**
4. Click **Save**

### Step 3: Restart Edge Functions
1. Go to **Edge Functions > Functions**
2. Click **Deploy** on any function to restart with new environment variables

## 🔧 Local Development Environment

For local development, create a `.env` file in your `supabase/functions` directory:

```bash
# supabase/functions/.env
APP_NAME=Appointments App (Local)
ENVIRONMENT=development
DEBUG_MODE=true
ENABLE_SMS_NOTIFICATIONS=false
ENABLE_EMAIL_NOTIFICATIONS=false
```

## 🧪 Testing Environment Variables

Use the health check endpoint to verify your configuration:

```bash
curl https://your-project.supabase.co/functions/v1/appointments-api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-20T10:30:00.000Z",
  "environment": {
    "supabase_configured": true,
    "debug_mode": false
  }
}
```

## 🚨 Security Best Practices

### ✅ DO:
- Use strong, unique values for JWT_SECRET
- Store sensitive keys (API keys, passwords) as environment variables
- Use different values for development/staging/production
- Regularly rotate API keys and secrets
- Enable DEBUG_MODE only in development

### ❌ DON'T:
- Commit sensitive values to version control
- Use the same secrets across environments
- Store API keys in your frontend code
- Leave DEBUG_MODE enabled in production

## 📱 SMS Configuration (Twilio)

### Step 1: Create Twilio Account
1. Go to [https://www.twilio.com](https://www.twilio.com)
2. Sign up for a free account
3. Verify your phone number

### Step 2: Get Credentials
1. Go to **Console Dashboard**
2. Copy your **Account SID**
3. Copy your **Auth Token**
4. Get a **Twilio Phone Number**

### Step 3: Add to Supabase
```bash
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
ENABLE_SMS_NOTIFICATIONS=true
```

## 📧 Email Configuration (Gmail SMTP)

### Step 1: Enable 2FA on Gmail
1. Go to **Google Account Settings**
2. Enable **2-Factor Authentication**

### Step 2: Generate App Password
1. Go to **Security > App passwords**
2. Generate password for "Mail"
3. Copy the 16-character password

### Step 3: Add to Supabase
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-app-password
ENABLE_EMAIL_NOTIFICATIONS=true
```

## 🗺️ Google Maps Integration

### Step 1: Get API Key
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Enable **Maps JavaScript API**
3. Create **API Key**
4. Restrict key to your domain

### Step 2: Add to Supabase
```bash
GOOGLE_MAPS_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## 🔄 Environment Variable Updates

When you update environment variables:

1. **Edge Functions**: Automatically pick up new values on next invocation
2. **Frontend**: Restart your development server (`npm run dev`)
3. **Database**: No restart needed for database functions

## 🐛 Troubleshooting

### Environment Variables Not Working?
1. Check spelling and case sensitivity
2. Ensure no extra spaces in values
3. Restart edge functions after adding variables
4. Check Supabase logs for error messages

### SMS Not Sending?
1. Verify Twilio credentials are correct
2. Check Twilio account balance
3. Ensure phone numbers are in E.164 format (+1234567890)
4. Check Twilio logs for delivery status

### Email Not Sending?
1. Verify Gmail app password (not regular password)
2. Check SMTP settings are correct
3. Ensure 2FA is enabled on Gmail account
4. Test with a simple email first

## 📊 Monitoring

Monitor your environment variables usage:

1. **Supabase Dashboard > Logs**: Check edge function logs
2. **Twilio Console**: Monitor SMS delivery and costs
3. **Google Cloud Console**: Monitor API usage and quotas

---

✅ **Your environment variables are now configured!** Your edge functions can access these values securely and your app can use advanced features like SMS notifications and external API integrations.