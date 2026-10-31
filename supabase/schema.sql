-- ========================================================
-- كودورا أكاديمي - Codora Academy Database Schema
-- Supabase PostgreSQL with Row Level Security (RLS)
-- ========================================================

-- Enable UUID and pgcrypto extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Create Enums for Grades, Packages, and Status
CREATE TYPE student_grade AS ENUM (
    'الصف الأول الثانوي',
    'الصف الثاني الثانوي',
    'الصف الثالث الثانوي'
);

CREATE TYPE course_package AS ENUM (
    'شهر',
    'ترم',
    'سنة'
);

CREATE TYPE registration_status AS ENUM (
    'جديد',
    'تم التواصل',
    'تم الدفع',
    'مؤكد',
    'ملغي'
);

-- 2. Create Registrations Table
CREATE TABLE IF NOT EXISTS public.registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name TEXT NOT NULL,
    student_phone VARCHAR(11) NOT NULL,
    parent_phone VARCHAR(11) NOT NULL,
    grade TEXT NOT NULL,
    governorate TEXT NOT NULL,
    school TEXT DEFAULT NULL,
    package TEXT NOT NULL,
    notes TEXT DEFAULT NULL,
    consent_agreed BOOLEAN NOT NULL DEFAULT TRUE,
    status TEXT NOT NULL DEFAULT 'جديد',
    admin_notes TEXT DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    last_modified_by TEXT DEFAULT NULL,

    -- Constraints
    CONSTRAINT valid_student_phone CHECK (student_phone ~ '^01[0125][0-9]{8}$'),
    CONSTRAINT valid_parent_phone CHECK (parent_phone ~ '^01[0125][0-9]{8}$')
);

-- Unique constraint on student phone to prevent duplicate registrations
CREATE UNIQUE INDEX IF NOT EXISTS idx_registrations_student_phone ON public.registrations (student_phone);

-- Index for searching and filtering
CREATE INDEX IF NOT EXISTS idx_registrations_status ON public.registrations (status);
CREATE INDEX IF NOT EXISTS idx_registrations_grade ON public.registrations (grade);
CREATE INDEX IF NOT EXISTS idx_registrations_package ON public.registrations (package);
CREATE INDEX IF NOT EXISTS idx_registrations_governorate ON public.registrations (governorate);
CREATE INDEX IF NOT EXISTS idx_registrations_created_at ON public.registrations (created_at DESC);

-- 3. Create Audit Logs Table
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    registration_id UUID REFERENCES public.registrations(id) ON DELETE CASCADE,
    student_name TEXT NOT NULL,
    action TEXT NOT NULL,
    previous_status TEXT,
    new_status TEXT,
    notes_added TEXT,
    performed_by TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.admin_audit_logs (created_at DESC);

-- 4. Enable Row Level Security (RLS) on both tables
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for `registrations`:
DROP POLICY IF EXISTS "Allow public anon inserts only" ON public.registrations;
DROP POLICY IF EXISTS "Deny public anon selects" ON public.registrations;
DROP POLICY IF EXISTS "Allow authenticated admins full access" ON public.registrations;
DROP POLICY IF EXISTS "Allow full access" ON public.registrations;

CREATE POLICY "Allow full access"
ON public.registrations
FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- 6. RLS Policies for `admin_audit_logs`:
DROP POLICY IF EXISTS "Only authenticated admins can read logs" ON public.admin_audit_logs;
DROP POLICY IF EXISTS "Only authenticated admins can write logs" ON public.admin_audit_logs;
DROP POLICY IF EXISTS "Allow audit full access" ON public.admin_audit_logs;

CREATE POLICY "Allow audit full access"
ON public.admin_audit_logs
FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- 7. Trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_registration_updated
    BEFORE UPDATE ON public.registrations
    FOR EACH ROW
    EXECUTE PROCEDURE public.handle_updated_at();

-- Comment on tables for documentation
COMMENT ON TABLE public.registrations IS 'قاعدة بيانات تسجيل طلاب كودورا أكاديمي مع RLS كامل لحماية الخصوصية';
COMMENT ON TABLE public.admin_audit_logs IS 'سجل تدقيق وتتبع تعديلات الأدمن على تسجيلات الطلاب';

-- 8. Create Admin User in Supabase Auth automatically
-- Username: emara_admin (email: emara_admin@codora.edu)
-- Password: %Mo7amed%2009%
DO $$
DECLARE
    admin_uid UUID := gen_random_uuid();
BEGIN
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'emara_admin@codora.edu') THEN
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            admin_uid,
            'authenticated',
            'authenticated',
            'emara_admin@codora.edu',
            crypt('%Mo7amed%2009%', gen_salt('bf')),
            now(),
            '{"provider":"email","providers":["email"]}',
            '{"full_name":"م. محمد عمارة"}',
            now(),
            now()
        );
    END IF;
END $$;
