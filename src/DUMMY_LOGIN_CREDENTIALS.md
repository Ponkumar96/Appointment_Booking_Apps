# 🔑 Dummy Login Credentials Guide

## Overview
Use these test credentials to login and explore different user experiences in the Appointments app. All logins use the same OTP: **`123456`**

## 👤 Patient/User Accounts

### Regular Patient User
**Phone:** `+91 98765 43210`  
**OTP:** `123456`  
**Access Level:** Patient Dashboard  
**Features Available:**
- Browse and search clinics
- Book appointments (both time-based and token-based)
- View appointment history
- Manage family members
- Receive notifications
- View recent clinic visits

### New Patient User
**Phone:** `+91 98765 43211`  
**OTP:** `123456`  
**Access Level:** First-time user experience  
**Features Available:**
- Complete new user registration
- Search clinics with live suggestions
- See ad banners and promotions
- Book first appointment

### Patient with History
**Phone:** `+91 98765 43212`  
**OTP:** `123456`  
**Access Level:** Returning user experience  
**Features Available:**
- View ongoing appointments
- Access recently visited clinics
- Quick rebooking options
- Notification history

## 🏥 Clinic Staff Accounts

### City General Hospital - Admin Staff
**Phone:** `+91 99900 00001`  
**OTP:** `123456`  
**Access Level:** Full Admin Access  
**Clinic:** City General Hospital  
**Features Available:**
- Complete clinic dashboard access
- Manage all doctors and patients
- Update doctor statuses
- Manage appointment queue
- Add/remove staff members
- View activity logs
- Clinic setup and configuration

### Heart Care Center - Admin Staff  
**Phone:** `+91 99900 00002`  
**OTP:** `123456`  
**Access Level:** Full Admin Access  
**Clinic:** Heart Care Center  
**Features Available:**
- Complete clinic dashboard access
- Manage cardiology appointments
- Token-based queue management
- Staff management
- Real-time patient tracking

### City General Hospital - Main Reception
**Phone:** `+91 98765 43210`  
**OTP:** `123456`  
**Access Level:** Clinic Staff (if configured as clinic phone)  
**Features Available:**
- Limited clinic dashboard
- Patient check-in/check-out
- Basic appointment management
- Queue status updates

### Heart Care Center - Main Reception
**Phone:** `+91 98765 43211`  
**OTP:** `123456`  
**Access Level:** Clinic Staff (if configured as clinic phone)  
**Features Available:**
- Limited clinic dashboard  
- Token-based patient management
- Queue progression
- Basic reporting

## 🎭 Test Scenarios by User Type

### Scenario 1: New Patient Booking
1. **Login as:** `+91 98765 43211`
2. **Experience:** First-time user flow
3. **Test:** Complete registration → Search clinics → Book appointment
4. **Expected:** See ad banners, live search, guided booking flow

### Scenario 2: Returning Patient
1. **Login as:** `+91 98765 43210`  
2. **Experience:** Existing user with history
3. **Test:** View appointments → Rebook at recent clinic → Check notifications
4. **Expected:** Quick access to history, personalized recommendations

### Scenario 3: Clinic Admin Management
1. **Login as:** `+91 99900 00001` (City General Admin)
2. **Experience:** Full clinic management
3. **Test:** Update doctor status → Manage patient queue → Add staff member
4. **Expected:** Complete administrative control

### Scenario 4: Specialist Clinic Operations
1. **Login as:** `+91 99900 00002` (Heart Care Admin)  
2. **Experience:** Specialty clinic with token system
3. **Test:** Manage token queue → Update patient status → Monitor wait times
4. **Expected:** Token-based appointment system

## 🏢 Clinic Information for Testing

### City General Hospital
- **Booking Type:** Time-based + Token
- **Specialty:** General Medicine
- **Features:** Scheduled time slots with token numbers
- **Address:** 123 Main Street, Downtown
- **Test Doctor:** Dr. Sarah Johnson (General Physician)

### Heart Care Center  
- **Booking Type:** Token-only
- **Specialty:** Cardiology
- **Features:** Day-based booking with queue tokens
- **Address:** 456 Oak Avenue, Medical District
- **Test Doctor:** Dr. Emily Davis (Cardiologist)

## 🧪 Testing Workflows

### Complete Patient Journey
1. **Register:** Use `+91 98765 43211` for new user
2. **Browse:** Search for "cardiology" or "general"
3. **Book:** Try both time-based and token-based booking
4. **Track:** Monitor appointment status and queue position
5. **Return:** Login again to see appointment history

### Complete Clinic Management
1. **Admin Login:** Use `+91 99900 00001`
2. **Patient Management:** Check in waiting patients
3. **Doctor Status:** Update doctor availability
4. **Queue Control:** Progress queue and update token status
5. **Staff Management:** Add additional handlers

### Real-time Testing
1. **Open Multiple Tabs:** Login as patient in one, clinic staff in another
2. **Book Appointment:** Create appointment as patient
3. **Manage Queue:** Update status as clinic staff
4. **Observe Updates:** See real-time changes across tabs

## 🔧 Authentication Details

### Universal OTP
- **Code:** `123456`
- **Works for:** All test phone numbers
- **Expires:** Never (for testing)

### Phone Number Format
- **Required Format:** `+91 XXXXX XXXXX`
- **Alternative Format:** `+919876543210` also works
- **International:** Use country code format

### Role Detection Logic
```javascript
// How the app determines user roles:
if (phone in handlerPhones) {
  role = 'clinic' (with admin privileges)
} else if (phone in clinicMainPhones) {
  role = 'clinic' (with limited privileges)  
} else {
  role = 'user' (patient)
}
```

## 📱 Mobile vs Desktop Testing

### Mobile Experience
- Optimized touch targets (48px minimum)
- Swipe gestures for navigation
- Mobile-first responsive design
- Touch-friendly form inputs

### Desktop Experience  
- Hover states and interactions
- Keyboard navigation support
- Larger information density
- Multi-column layouts

## 🚨 Important Notes

1. **Demo vs Real Data:** If you see "Demo Mode" indicator, data is temporary
2. **Real Database:** If you see "Connected" indicator, data persists in Supabase
3. **Role Switching:** Logout and login with different numbers to test different roles
4. **Queue Updates:** Real-time features work best with multiple tabs/devices
5. **Notifications:** Will appear in the notifications panel for all user types

## 🎯 Quick Start Testing

**Want to test everything quickly?**

1. **Patient Experience:** Login with `+91 98765 43210`
2. **Clinic Management:** Login with `+91 99900 00001`  
3. **Book & Manage:** Create appointment as patient, manage as clinic staff
4. **Real-time:** Keep both sessions open to see live updates

---

💡 **Tip:** Use the Setup Validator tool to ensure your Supabase connection is working before testing with real data persistence!