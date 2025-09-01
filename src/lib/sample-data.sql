-- Sample Data for Appointments App
-- Run this after creating the main schema

-- Insert sample clinics
INSERT INTO clinics (name, address, phone, specialties, booking_type, opens_at, closes_at, latitude, longitude, rating, total_reviews) VALUES 
('City General Hospital', '123 Main Street, Downtown', '+91 98765 43210', ARRAY['General Medicine', 'Emergency Care', 'Family Medicine'], 'time_based', '09:00', '17:00', 40.7128, -74.0060, 4.5, 150),
('Heart Care Center', '456 Oak Avenue, Medical District', '+91 98765 43211', ARRAY['Cardiology', 'Cardiac Surgery'], 'day_based', '10:00', '18:00', 40.7589, -73.9851, 4.8, 89),
('Pediatric Wellness Clinic', '789 Family Blvd, Suburbs', '+91 98765 43212', ARRAY['Pediatrics', 'Child Psychology'], 'time_based', '08:00', '16:00', 40.7282, -74.0776, 4.6, 201),
('Women''s Health Center', '321 Wellness Way, Uptown', '+91 98765 43213', ARRAY['Gynecology', 'Obstetrics'], 'time_based', '08:30', '17:30', 40.7505, -73.9934, 4.7, 127),
('Orthopedic Sports Clinic', '654 Athletic Ave, Sports Complex', '+91 98765 43214', ARRAY['Orthopedics', 'Sports Medicine'], 'day_based', '07:00', '19:00', 40.7614, -73.9776, 4.4, 92);

-- Insert sample doctors
WITH clinic_data AS (
  SELECT id, name FROM clinics
)
INSERT INTO doctors (clinic_id, name, specialization, status) 
SELECT 
    c.id,
    doctor_info.name,
    doctor_info.specialization,
    doctor_info.status
FROM clinic_data c
JOIN (
  VALUES 
    -- City General Hospital
    ('City General Hospital', 'Dr. Sarah Johnson', 'General Medicine', 'available'),
    ('City General Hospital', 'Dr. Michael Chen', 'Emergency Medicine', 'with_patient'),
    ('City General Hospital', 'Dr. Amanda Rodriguez', 'Family Medicine', 'available'),
    
    -- Heart Care Center  
    ('Heart Care Center', 'Dr. Emily Davis', 'Cardiology', 'available'),
    ('Heart Care Center', 'Dr. Robert Wilson', 'Cardiac Surgery', 'not_arrived'),
    
    -- Pediatric Wellness Clinic
    ('Pediatric Wellness Clinic', 'Dr. Lisa Martinez', 'Pediatrics', 'available'),
    ('Pediatric Wellness Clinic', 'Dr. David Brown', 'Child Psychology', 'break'),
    
    -- Women's Health Center
    ('Women''s Health Center', 'Dr. Jennifer Park', 'Gynecology', 'available'),
    ('Women''s Health Center', 'Dr. Maria Gonzalez', 'Obstetrics', 'with_patient'),
    
    -- Orthopedic Sports Clinic
    ('Orthopedic Sports Clinic', 'Dr. James Thompson', 'Orthopedics', 'available'),
    ('Orthopedic Sports Clinic', 'Dr. Rachel Kim', 'Sports Medicine', 'available')
) AS doctor_info(clinic_name, name, specialization, status) ON c.name = doctor_info.clinic_name;

-- Initialize queue status for each clinic
INSERT INTO queue_status (clinic_id, current_token, total_tokens)
SELECT 
    c.id,
    CASE 
        WHEN c.name = 'City General Hospital' THEN 'A03'
        WHEN c.name = 'Heart Care Center' THEN 'H05' 
        WHEN c.name = 'Pediatric Wellness Clinic' THEN 'P02'
        WHEN c.name = 'Women''s Health Center' THEN 'W01'
        WHEN c.name = 'Orthopedic Sports Clinic' THEN 'O07'
    END as current_token,
    CASE 
        WHEN c.name = 'City General Hospital' THEN 12
        WHEN c.name = 'Heart Care Center' THEN 8
        WHEN c.name = 'Pediatric Wellness Clinic' THEN 5  
        WHEN c.name = 'Women''s Health Center' THEN 3
        WHEN c.name = 'Orthopedic Sports Clinic' THEN 15
    END as total_tokens
FROM clinics c;

-- Create a test user for demonstration
-- Note: In production, users will be created through the auth flow
INSERT INTO users (id, phone, name, email, is_clinic_staff) VALUES 
('550e8400-e29b-41d4-a716-446655440000', '+91 98765 43210', 'John Doe', 'john@example.com', false);

-- Add some family members for the test user
INSERT INTO family_members (user_id, name, age, relationship) VALUES 
('550e8400-e29b-41d4-a716-446655440000', 'Jane Doe', 25, 'Spouse'),
('550e8400-e29b-41d4-a716-446655440000', 'Little Johnny', 8, 'Son'),
('550e8400-e29b-41d4-a716-446655440000', 'Emma Doe', 5, 'Daughter');

-- Add sample appointments for the test user
WITH clinic_and_doctor AS (
  SELECT c.id as clinic_id, c.name as clinic_name, d.id as doctor_id, d.name as doctor_name
  FROM clinics c
  JOIN doctors d ON c.id = d.clinic_id
  WHERE c.name IN ('Heart Care Center', 'Pediatric Wellness Clinic')
)
INSERT INTO appointments (
  user_id, 
  clinic_id, 
  doctor_id, 
  patient_name, 
  patient_phone, 
  patient_age, 
  appointment_date, 
  appointment_time, 
  token_number, 
  queue_position, 
  status
) 
SELECT 
  '550e8400-e29b-41d4-a716-446655440000',
  cd.clinic_id,
  cd.doctor_id,
  appt.patient_name,
  '+91 98765 43210',
  appt.age,
  appt.date,
  appt.time,
  appt.token,
  appt.position,
  appt.status
FROM clinic_and_doctor cd
JOIN (
  VALUES 
    ('Heart Care Center', 'Dr. Emily Davis', 'John Doe', 28, CURRENT_DATE, '14:30:00', 'H06', 2, 'upcoming'),
    ('Pediatric Wellness Clinic', 'Dr. Lisa Martinez', 'Little Johnny', 8, CURRENT_DATE + 1, '10:00:00', 'P03', 1, 'upcoming')
) AS appt(clinic_name, doctor_name, patient_name, age, date, time, token, position, status)
ON cd.clinic_name = appt.clinic_name AND cd.doctor_name = appt.doctor_name;

-- Add recent visits for the test user
INSERT INTO recent_visits (user_id, clinic_id, last_visit, total_visits)
SELECT 
  '550e8400-e29b-41d4-a716-446655440000',
  c.id,
  visit.last_visit,
  visit.total_visits
FROM clinics c
JOIN (
  VALUES 
    ('City General Hospital', CURRENT_DATE - 15, 3),
    ('Heart Care Center', CURRENT_DATE - 7, 2)
) AS visit(clinic_name, last_visit, total_visits) ON c.name = visit.clinic_name;

-- Add sample notifications for the test user
INSERT INTO notifications (
  user_id, 
  title, 
  message, 
  type, 
  is_read,
  appointment_id
) 
SELECT 
  '550e8400-e29b-41d4-a716-446655440000',
  notif.title,
  notif.message,
  notif.type,
  notif.is_read,
  a.id
FROM (
  VALUES 
    ('Appointment Reminder', 'You have an appointment today at Heart Care Center with Dr. Emily Davis at 2:30 PM', 'appointment_reminder', false),
    ('Doctor Arrived', 'Dr. Emily Davis has arrived at Heart Care Center. Current token: H04', 'doctor_arrival', true),
    ('Queue Update', 'You are now 2nd in queue. Estimated wait time: 15 minutes', 'queue_update', false)
) AS notif(title, message, type, is_read)
CROSS JOIN appointments a 
WHERE a.user_id = '550e8400-e29b-41d4-a716-446655440000' 
AND a.status = 'upcoming'
LIMIT 1;

-- Add some activity logs
INSERT INTO activity_logs (user_id, action, details) VALUES 
('550e8400-e29b-41d4-a716-446655440000', 'appointment_booked', '{"clinic": "Heart Care Center", "doctor": "Dr. Emily Davis", "date": "2024-01-20"}'),
('550e8400-e29b-41d4-a716-446655440000', 'profile_updated', '{"field": "phone", "old_value": "+91 98765 43211", "new_value": "+91 98765 43210"}'),
('550e8400-e29b-41d4-a716-446655440000', 'family_member_added', '{"name": "Jane Doe", "relationship": "Spouse"}');

-- Grant necessary permissions (if needed)
-- This ensures the test user can access their data
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Test the notification function
SELECT send_notification(
  '550e8400-e29b-41d4-a716-446655440000'::UUID,
  'Welcome!',
  'Welcome to the Appointments app! Your account has been set up successfully.',
  'general'
);

-- Display summary of created data
SELECT 
  'Clinics' as entity, COUNT(*) as count FROM clinics
UNION ALL
SELECT 'Doctors' as entity, COUNT(*) as count FROM doctors  
UNION ALL
SELECT 'Appointments' as entity, COUNT(*) as count FROM appointments
UNION ALL
SELECT 'Users' as entity, COUNT(*) as count FROM users
UNION ALL
SELECT 'Family Members' as entity, COUNT(*) as count FROM family_members
UNION ALL
SELECT 'Notifications' as entity, COUNT(*) as count FROM notifications
UNION ALL
SELECT 'Recent Visits' as entity, COUNT(*) as count FROM recent_visits
ORDER BY entity;