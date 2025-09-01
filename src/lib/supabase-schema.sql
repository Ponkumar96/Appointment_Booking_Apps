-- Users table for authentication and profile data
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone VARCHAR(15) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  google_id VARCHAR(255),
  is_clinic_staff BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Clinics table
CREATE TABLE clinics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  address TEXT NOT NULL,
  phone VARCHAR(15),
  specialties TEXT[],
  rating DECIMAL(2,1) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  booking_type VARCHAR(20) CHECK (booking_type IN ('time_based', 'day_based')) NOT NULL,
  opens_at TIME,
  closes_at TIME,
  is_active BOOLEAN DEFAULT true,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Doctors table
CREATE TABLE doctors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  specialization VARCHAR(100),
  status VARCHAR(20) CHECK (status IN ('available', 'with_patient', 'not_arrived', 'break')) DEFAULT 'not_arrived',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Family members table
CREATE TABLE family_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  age INTEGER NOT NULL,
  relationship VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Appointments table
CREATE TABLE appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL,
  patient_name VARCHAR(100) NOT NULL,
  patient_phone VARCHAR(15) NOT NULL,
  patient_age INTEGER,
  appointment_date DATE NOT NULL,
  appointment_time TIME,
  token_number VARCHAR(10) NOT NULL,
  queue_position INTEGER DEFAULT 1,
  status VARCHAR(20) CHECK (status IN ('upcoming', 'completed', 'cancelled', 'no_show')) DEFAULT 'upcoming',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Queue management table
CREATE TABLE queue_status (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  current_token VARCHAR(10) NOT NULL,
  total_tokens INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recent visits table
CREATE TABLE recent_visits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  last_visit TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  total_visits INTEGER DEFAULT 1
);

-- Notifications table
CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(20) CHECK (type IN ('appointment_reminder', 'queue_update', 'doctor_arrival', 'next_in_queue', 'general')) NOT NULL,
  is_read BOOLEAN DEFAULT false,
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activity logs table
CREATE TABLE activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE queue_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE recent_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid()::text = id::text);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid()::text = id::text);

-- RLS Policies for clinics (public read)
CREATE POLICY "Anyone can view clinics" ON clinics FOR SELECT USING (true);

-- RLS Policies for doctors (public read)
CREATE POLICY "Anyone can view doctors" ON doctors FOR SELECT USING (true);

-- RLS Policies for family members
CREATE POLICY "Users can manage own family members" ON family_members FOR ALL USING (auth.uid()::text = user_id::text);

-- RLS Policies for appointments
CREATE POLICY "Users can view own appointments" ON appointments FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can create appointments" ON appointments FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
CREATE POLICY "Users can update own appointments" ON appointments FOR UPDATE USING (auth.uid()::text = user_id::text);

-- RLS Policies for queue status (public read)
CREATE POLICY "Anyone can view queue status" ON queue_status FOR SELECT USING (true);

-- RLS Policies for recent visits
CREATE POLICY "Users can manage own visits" ON recent_visits FOR ALL USING (auth.uid()::text = user_id::text);

-- RLS Policies for notifications
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid()::text = user_id::text);

-- RLS Policies for activity logs
CREATE POLICY "Users can view own activity" ON activity_logs FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can create activity logs" ON activity_logs FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Create indexes for performance
CREATE INDEX idx_appointments_user_id ON appointments(user_id);
CREATE INDEX idx_appointments_clinic_id ON appointments(clinic_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_queue_status_clinic_id ON queue_status(clinic_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_recent_visits_user_id ON recent_visits(user_id);

-- Functions for real-time updates
CREATE OR REPLACE FUNCTION update_queue_positions()
RETURNS TRIGGER AS $$
BEGIN
  -- When an appointment is cancelled, update queue positions
  IF OLD.status = 'upcoming' AND NEW.status = 'cancelled' THEN
    UPDATE appointments 
    SET queue_position = queue_position - 1
    WHERE clinic_id = NEW.clinic_id 
      AND appointment_date = NEW.appointment_date
      AND queue_position > OLD.queue_position
      AND status = 'upcoming';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for queue position updates
CREATE TRIGGER update_queue_positions_trigger
  AFTER UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION update_queue_positions();

-- Function to send notifications
CREATE OR REPLACE FUNCTION send_notification(
  user_uuid UUID,
  notification_title VARCHAR(200),
  notification_message TEXT,
  notification_type VARCHAR(20),
  appointment_uuid UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO notifications (user_id, title, message, type, appointment_id)
  VALUES (user_uuid, notification_title, notification_message, notification_type, appointment_uuid)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql;