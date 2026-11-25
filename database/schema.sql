
-- CareConnect database schema
-- Fresh database: careconnect_db

BEGIN;

-- =========================================
-- 1. HOSPITAL DEPARTMENTS
-- =========================================

CREATE TABLE departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX unique_department_name
ON departments (LOWER(name));


-- =========================================
-- 2. USERS: PATIENT, DOCTOR, ADMIN
-- =========================================

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) NOT NULL
        CHECK (role IN ('patient', 'doctor', 'admin')),
    phone VARCHAR(20),
    profile_image_key TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_name ON users(name);


-- =========================================
-- 3. DOCTOR PROFILES
-- =========================================

CREATE TABLE doctors (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE
        REFERENCES users(id) ON DELETE CASCADE,
    department_id INTEGER
        REFERENCES departments(id) ON DELETE SET NULL,
    specialization VARCHAR(100) NOT NULL,
    qualification VARCHAR(150),
    experience_years INTEGER NOT NULL DEFAULT 0
        CHECK (experience_years >= 0),
    consultation_fee NUMERIC(10,2) NOT NULL DEFAULT 0
        CHECK (consultation_fee >= 0),
    bio TEXT,
    available BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_doctors_department
ON doctors(department_id);

CREATE INDEX idx_doctors_specialization
ON doctors(specialization);


-- =========================================
-- 4. DOCTOR AVAILABILITY SLOTS
-- =========================================

CREATE TABLE doctor_slots (
    id SERIAL PRIMARY KEY,
    doctor_id INTEGER NOT NULL
        REFERENCES doctors(id) ON DELETE CASCADE,
    slot_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_booked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CHECK (end_time > start_time),

    UNIQUE (doctor_id, slot_date, start_time)
);

CREATE INDEX idx_slots_doctor_date
ON doctor_slots(doctor_id, slot_date);

CREATE INDEX idx_slots_available
ON doctor_slots(doctor_id, slot_date)
WHERE is_booked = FALSE;


-- =========================================
-- 5. APPOINTMENTS
-- =========================================

CREATE TABLE appointments (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL
        REFERENCES users(id),
    doctor_id INTEGER NOT NULL
        REFERENCES doctors(id),
    slot_id INTEGER NOT NULL
        REFERENCES doctor_slots(id),
    appointment_status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (
            appointment_status IN (
                'pending',
                'confirmed',
                'rejected',
                'cancelled',
                'completed'
            )
        ),
    reason TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Only one active appointment per slot.
-- Cancelled and rejected appointments remain in history.

CREATE UNIQUE INDEX unique_active_appointment_per_slot
ON appointments(slot_id)
WHERE appointment_status IN ('pending', 'confirmed');

CREATE INDEX idx_appointments_patient
ON appointments(patient_id);

CREATE INDEX idx_appointments_doctor
ON appointments(doctor_id);

CREATE INDEX idx_appointments_status
ON appointments(appointment_status);

CREATE INDEX idx_appointments_created
ON appointments(created_at);


-- =========================================
-- 6. IN-APP NOTIFICATIONS
-- =========================================

CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL
        REFERENCES users(id) ON DELETE CASCADE,
    appointment_id INTEGER
        REFERENCES appointments(id) ON DELETE SET NULL,
    notification_type VARCHAR(50) NOT NULL,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user_date
ON notifications(user_id, created_at DESC);

CREATE INDEX idx_notifications_unread
ON notifications(user_id, is_read);


-- =========================================
-- 7. INITIAL DEPARTMENTS
-- =========================================

INSERT INTO departments (name, description) VALUES
('Cardiology', 'Heart and cardiovascular care'),
('Neurology', 'Brain and nervous system care'),
('Orthopedics', 'Bone, joint and muscle care'),
('Dermatology', 'Skin, hair and nail care'),
('Pediatrics', 'Medical care for children'),
('General Medicine', 'General medical consultation'),
('Gynecology', 'Women''s reproductive health');

COMMIT;
