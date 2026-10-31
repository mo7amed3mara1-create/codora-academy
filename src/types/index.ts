export type GradeType = 'الصف الأول الثانوي' | 'الصف الثاني الثانوي' | 'الصف الثالث الثانوي';

export type PackageType = 'شهر' | 'ترم' | 'سنة';

export type StatusType = 'جديد' | 'تم التواصل' | 'تم الدفع' | 'مؤكد' | 'ملغي';

export interface StudentRegistration {
  id: string;
  full_name: string;
  student_phone: string;
  parent_phone: string;
  grade: GradeType;
  governorate: string;
  school?: string;
  package: PackageType;
  notes?: string;
  consent_agreed: boolean;
  status: StatusType;
  admin_notes?: string;
  created_at: string;
  updated_at?: string;
  last_modified_by?: string;
}

export interface RegistrationFormData {
  full_name: string;
  student_phone: string;
  parent_phone: string;
  grade: GradeType;
  governorate: string;
  school: string;
  package: PackageType;
  notes: string;
  consent_agreed: boolean;
}

export interface AuditLog {
  id: string;
  registration_id: string;
  student_name: string;
  action: string;
  previous_status?: StatusType;
  new_status?: StatusType;
  notes_added?: string;
  performed_by: string;
  created_at: string;
}

export interface AdminUser {
  id: string;
  email: string;
  username?: string;
  name: string;
  role: 'super_admin' | 'admin';
}
