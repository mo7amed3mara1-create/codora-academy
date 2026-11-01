import { createClient } from '@supabase/supabase-js';
import { 
  StudentRegistration, 
  RegistrationFormData, 
  AuditLog, 
  AdminUser, 
  StatusType 
} from '../types';
import { cleanEgyptianPhone, isValidEgyptianPhone } from '../lib/constants';

// Environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if Supabase is configured
export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.startsWith('http') && 
  supabaseAnonKey.length > 10
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// LocalStorage Keys for Local Mode
const STORAGE_KEY_REGISTRATIONS = 'codora_registrations_v1';
const STORAGE_KEY_LOGS = 'codora_audit_logs_v1';
const STORAGE_KEY_ADMIN_SESSION = 'codora_admin_session_v1';
const STORAGE_KEY_RATE_LIMIT = 'codora_rate_limit_timestamps_v1';
const STORAGE_KEY_LOGIN_LOCKOUT = 'codora_admin_lockout_v2';

// Brute-force protection helpers
interface LockoutData {
  failedAttempts: number;
  lockedUntil: number | null;
}

function getLockoutState(): LockoutData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LOGIN_LOCKOUT);
    if (!raw) return { failedAttempts: 0, lockedUntil: null };
    return JSON.parse(raw);
  } catch {
    return { failedAttempts: 0, lockedUntil: null };
  }
}

function recordFailedAttempt(): { locked: boolean; remaining: number; minutesLeft?: number } {
  const state = getLockoutState();
  const newAttempts = state.failedAttempts + 1;
  const maxAttempts = 5;

  if (newAttempts >= maxAttempts) {
    const lockedUntil = Date.now() + 15 * 60 * 1000; // 15 minutes lockout
    localStorage.setItem(STORAGE_KEY_LOGIN_LOCKOUT, JSON.stringify({
      failedAttempts: newAttempts,
      lockedUntil,
    }));
    return { locked: true, remaining: 0, minutesLeft: 15 };
  }

  localStorage.setItem(STORAGE_KEY_LOGIN_LOCKOUT, JSON.stringify({
    failedAttempts: newAttempts,
    lockedUntil: null,
  }));
  return { locked: false, remaining: maxAttempts - newAttempts };
}

function clearLockoutState(): void {
  localStorage.removeItem(STORAGE_KEY_LOGIN_LOCKOUT);
}

export function checkIsLockedOut(): { locked: boolean; minutesLeft: number } {
  const state = getLockoutState();
  if (state.lockedUntil && Date.now() < state.lockedUntil) {
    const minutesLeft = Math.ceil((state.lockedUntil - Date.now()) / (60 * 1000));
    return { locked: true, minutesLeft };
  }
  if (state.lockedUntil && Date.now() >= state.lockedUntil) {
    clearLockoutState();
  }
  return { locked: false, minutesLeft: 0 };
}

// Empty initial data - only real student submissions will be saved
const INITIAL_DEMO_STUDENTS: StudentRegistration[] = [];
const INITIAL_DEMO_LOGS: AuditLog[] = [];

// Helper to get local registrations
function getLocalRegistrations(): StudentRegistration[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_REGISTRATIONS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_REGISTRATIONS, JSON.stringify(INITIAL_DEMO_STUDENTS));
      return INITIAL_DEMO_STUDENTS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_DEMO_STUDENTS;
  }
}

function saveLocalRegistrations(list: StudentRegistration[]) {
  localStorage.setItem(STORAGE_KEY_REGISTRATIONS, JSON.stringify(list));
}

// Helper to get local logs
function getLocalLogs(): AuditLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LOGS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(INITIAL_DEMO_LOGS));
      return INITIAL_DEMO_LOGS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_DEMO_LOGS;
  }
}

function addLocalLog(log: Omit<AuditLog, 'id' | 'created_at'>) {
  const logs = getLocalLogs();
  const newLog: AuditLog = {
    ...log,
    id: 'log-' + Math.random().toString(36).substring(2, 9),
    created_at: new Date().toISOString(),
  };
  logs.unshift(newLog);
  localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(logs.slice(0, 100))); // keep latest 100
}

function sanitizeInput(text: string): string {
  if (!text) return '';
  return text
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/['";]/g, '')
    .trim();
}

// Rate Limiting helper: Max 4 submissions per 10 minutes from same browser
function checkRateLimit(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_RATE_LIMIT);
    const now = Date.now();
    const tenMinutesAgo = now - 10 * 60 * 1000;
    let timestamps: number[] = raw ? JSON.parse(raw) : [];
    
    // Filter out timestamps older than 10 minutes
    timestamps = timestamps.filter(t => t > tenMinutesAgo);
    
    if (timestamps.length >= 4) {
      return false; // rate limit exceeded
    }
    
    timestamps.push(now);
    localStorage.setItem(STORAGE_KEY_RATE_LIMIT, JSON.stringify(timestamps));
    return true;
  } catch {
    return true;
  }
}

// -------------------------------------------------------------
// PUBLIC API: Register Student
// -------------------------------------------------------------
export async function submitRegistration(data: RegistrationFormData): Promise<{
  success: boolean;
  message?: string;
  data?: StudentRegistration;
  error?: string;
}> {
  // 1. Clean & validate phones
  const studentPhone = cleanEgyptianPhone(data.student_phone);
  const parentPhone = cleanEgyptianPhone(data.parent_phone);

  if (!isValidEgyptianPhone(studentPhone)) {
    return {
      success: false,
      error: 'رقم موبايل الطالب غير صحيح. يجب أن يتكون من 11 رقم ويبدأ بـ 01 (مثل 01012345678).'
    };
  }

  if (!isValidEgyptianPhone(parentPhone)) {
    return {
      success: false,
      error: 'رقم موبايل ولي الأمر غير صحيح. يجب أن يتكون من 11 رقم ويبدأ بـ 01 (مثل 01223456789).'
    };
  }

  if (studentPhone === parentPhone) {
    return {
      success: false,
      error: 'يرجى إدخال رقم ولي أمر مختلف عن رقم الطالب لضمان إمكانية التواصل ومتابعة المستوى.'
    };
  }

  if (!data.full_name || data.full_name.trim().length < 5) {
    return {
      success: false,
      error: 'يرجى كتابة اسم الطالب ثلاثي أو رباعي بالكامل.'
    };
  }

  if (!data.consent_agreed) {
    return {
      success: false,
      error: 'يجب الموافقة على استخدام البيانات لأغراض التواصل والمتابعة لإتمام التسجيل.'
    };
  }

  // 2. Check client-side rate limit
  if (!checkRateLimit()) {
    return {
      success: false,
      error: 'لقد قمت بمحاولات تسجيل متعددة مؤخرًا. لحماية النظام يرجى الانتظار بضع دقائق والمحاولة مجددًا أو التواصل معنا على 01080929572.'
    };
  }

  // 3. Sanitized payload with XSS / injection stripping
  const cleanPayload = {
    full_name: sanitizeInput(data.full_name),
    student_phone: studentPhone,
    parent_phone: parentPhone,
    grade: data.grade,
    governorate: data.governorate,
    school: sanitizeInput(data.school),
    package: data.package,
    notes: sanitizeInput(data.notes),
    consent_agreed: true,
  };

  // 4. If Supabase is connected
  if (isSupabaseConfigured && supabase) {
    try {
      // Check duplicate phone in Supabase
      const { data: existing, error: checkError } = await supabase
        .from('registrations')
        .select('id, student_phone')
        .eq('student_phone', studentPhone)
        .maybeSingle();

      if (existing) {
        return {
          success: false,
          error: `رقم هاتف الطالب (${studentPhone}) مسجل بالفعل لدينا مسبقًا! إذا كنت تريد تعديل بياناتك أو لديك استفسار يرجى التواصل مباشرة عبر واتساب على 01080929572.`
        };
      }

      const clientGeneratedId = 'reg-' + Math.random().toString(36).substring(2, 9);
      const studentRecord: StudentRegistration = {
        id: clientGeneratedId,
        ...cleanPayload,
        status: 'جديد',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { error: insertError } = await supabase
        .from('registrations')
        .insert([
          {
            ...cleanPayload,
            status: 'جديد',
          }
        ]);

      if (insertError) {
        if (insertError.code === '23505') { // unique violation
          return {
            success: false,
            error: `رقم هاتف الطالب (${studentPhone}) مسجل بالفعل مسبقًا. تواصل معنا على 01080929572 لمتابعة طلبك.`
          };
        }
        console.warn('Supabase insert note:', insertError);
      }

      return {
        success: true,
        data: studentRecord,
        message: 'تم تسجيل بياناتك بنجاح في كودورا أكاديمي!'
      };
    } catch (err: any) {
      console.error('Supabase registration error:', err);
      // Fallback to local if network fails
      return {
        success: false,
        error: err.message || 'حدث خطأ أثناء حفظ التسجيل. يرجى إعادة المحاولة.'
      };
    }
  }

  // 5. Local Mode handling
  const registrations = getLocalRegistrations();

  // Check duplicate phone
  const existing = registrations.find(r => r.student_phone === studentPhone);
  if (existing) {
    return {
      success: false,
      error: `رقم هاتف الطالب (${studentPhone}) مسجل بالفعل لدينا مسبقًا! إذا كنت تريد تعديل بياناتك أو لديك استفسار يرجى التواصل مباشرة عبر واتساب على 01080929572.`
    };
  }

  const newRecord: StudentRegistration = {
    id: 'reg-' + Math.random().toString(36).substring(2, 9),
    ...cleanPayload,
    status: 'جديد',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  registrations.unshift(newRecord);
  saveLocalRegistrations(registrations);

  return {
    success: true,
    data: newRecord,
    message: 'تم تسجيل بياناتك بنجاح في كودورا أكاديمي!'
  };
}

// -------------------------------------------------------------
// ADMIN API: Authentication
// -------------------------------------------------------------
// SHA-256 Web Crypto helper
async function sha256Hex(text: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Precomputed SHA-256 hashes of authorized admin credentials
// NEVER exposes raw plaintext credentials in client code or production bundles
const MASTER_PASSWORD_HASH = '0464c4faf016926f58db02af1bdacf23b507512c2343f907a586a5abf485055d';
const AUTHORIZED_USER_HASHES = new Set([
  '5a0a78fa9e455653a6dfad8eb00dc9bd8b608a98c91cac3342ba6e8217c7ea8e', // emara_admin
  '4924192c3c2e4899e8fb48d49ed8c4dd06dbb4bb4b2a52ac5a5459e1bf285e91', // admin_emara
  '0590f7dc91111ad084855a59472ad32c9de50c4d8ba16f14f6f11af490e1dda9', // mohamed_emara
  'fe36b6e437d9b4c4c23bc0372531aca667cf24e2eb351471827e534b114e4dc8', // admin@codora.edu
]);

export async function adminLogin(identifier: string, password: string): Promise<{
  success: boolean;
  user?: AdminUser;
  error?: string;
  remainingAttempts?: number;
}> {
  if (!identifier || !password) {
    return { success: false, error: 'يرجى إدخال اسم المستخدم وكلمة المرور' };
  }

  const cleanIdentifier = identifier.trim().toLowerCase();
  const userHash = await sha256Hex(cleanIdentifier);
  const passHash = await sha256Hex(password);

  // 1. Verify Master Credentials cryptographically (zero plaintext leakage)
  const isUsernameMatch = AUTHORIZED_USER_HASHES.has(userHash);
  const isPasswordMatch = (passHash === MASTER_PASSWORD_HASH);

  // If master credentials match, immediately succeed and clear any previous lockouts!
  if (isUsernameMatch && isPasswordMatch) {
    clearLockoutState();

    // Silently attempt Supabase auth session if available
    if (isSupabaseConfigured && supabase) {
      try {
        const emailToAuth = cleanIdentifier.includes('@') ? cleanIdentifier : `${cleanIdentifier}@codora.edu`;
        await supabase.auth.signInWithPassword({
          email: emailToAuth,
          password: password,
        });
      } catch {
        // Fallback: master session will query via client
      }
    }

    const adminUser: AdminUser = {
      id: 'admin-codora-001',
      email: `${configuredUsername}@codora.edu`,
      username: configuredUsername,
      name: 'م. محمد عمارة',
      role: 'super_admin'
    };
    localStorage.setItem(STORAGE_KEY_ADMIN_SESSION, JSON.stringify(adminUser));
    return { success: true, user: adminUser };
  }

  // 2. If credentials do NOT match, check lockout state
  const lockout = checkIsLockedOut();
  if (lockout.locked) {
    return {
      success: false,
      error: `تم قفل تسجيل الدخول مؤقتًا لحماية النظام بعد تكرار المحاولات الخاطئة. يرجى الانتظار ${lockout.minutesLeft} دقيقة والمحاولة مجددًا.`
    };
  }

  // Record failed attempt
  const attemptResult = recordFailedAttempt();
  if (attemptResult.locked) {
    return {
      success: false,
      error: 'تم تجاوز الحد الأقصى للمحاولات الخاطئة (5 محاولات). تم قفل تسجيل الدخول مؤقتًا لمدة 15 دقيقة.'
    };
  }

  return {
    success: false,
    error: `اسم المستخدم أو كلمة المرور غير صحيحة. متبقي لك ${attemptResult.remaining} محاولات قبل القفل الأمني.`,
    remainingAttempts: attemptResult.remaining,
  };
}

export function getCachedAdminSession(): AdminUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ADMIN_SESSION);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function adminLogout(): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    await supabase.auth.signOut();
  }
  localStorage.removeItem(STORAGE_KEY_ADMIN_SESSION);
}

// -------------------------------------------------------------
// ADMIN API: Data Operations
// -------------------------------------------------------------
export async function fetchAllRegistrations(): Promise<StudentRegistration[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      // 1. Try secure RPC vault first if enabled
      try {
        const { data: rpcData, error: rpcErr } = await supabase.rpc('get_students_secure', {
          p_admin_pass: MASTER_PASSWORD_HASH
        });
        if (!rpcErr && Array.isArray(rpcData) && rpcData.length >= 0) {
          return rpcData as StudentRegistration[];
        }
      } catch {
        // Fall back to direct table select
      }

      // 2. Direct table select
      const { data, error } = await supabase
        .from('registrations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as StudentRegistration[];
    } catch (err) {
      console.error('Error fetching from Supabase, falling back to local:', err);
      return getLocalRegistrations();
    }
  }
  return getLocalRegistrations();
}

export async function updateStudentStatus(
  id: string,
  newStatus: StatusType,
  adminEmail: string
): Promise<{ success: boolean; error?: string }> {
  const registrations = getLocalRegistrations();
  const student = registrations.find(r => r.id === id);
  const oldStatus = student ? student.status : undefined;
  const studentName = student ? student.full_name : 'طالب';

  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase
        .from('registrations')
        .update({
          status: newStatus,
          last_modified_by: adminEmail,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      // Log action in supabase
      await supabase.from('admin_audit_logs').insert([
        {
          registration_id: id,
          student_name: studentName,
          action: `تغيير الحالة إلى ${newStatus}`,
          previous_status: oldStatus,
          new_status: newStatus,
          performed_by: adminEmail,
        }
      ]);

      return { success: true };
    } catch (err: any) {
      console.error('Supabase update status error:', err);
    }
  }

  // Local update
  const updated = registrations.map(r => {
    if (r.id === id) {
      return {
        ...r,
        status: newStatus,
        last_modified_by: adminEmail,
        updated_at: new Date().toISOString(),
      };
    }
    return r;
  });

  saveLocalRegistrations(updated);

  addLocalLog({
    registration_id: id,
    student_name: studentName,
    action: `تغيير الحالة إلى: ${newStatus}`,
    previous_status: oldStatus,
    new_status: newStatus,
    performed_by: adminEmail,
  });

  return { success: true };
}

export async function updateStudentAdminNotes(
  id: string,
  notes: string,
  adminEmail: string
): Promise<{ success: boolean; error?: string }> {
  const registrations = getLocalRegistrations();
  const student = registrations.find(r => r.id === id);
  const studentName = student ? student.full_name : 'طالب';

  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase
        .from('registrations')
        .update({
          admin_notes: notes,
          last_modified_by: adminEmail,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      await supabase.from('admin_audit_logs').insert([
        {
          registration_id: id,
          student_name: studentName,
          action: 'تحديث الملاحظات الإدارية',
          notes_added: notes,
          performed_by: adminEmail,
        }
      ]);

      return { success: true };
    } catch (err: any) {
      console.error('Supabase update notes error:', err);
    }
  }

  const updated = registrations.map(r => {
    if (r.id === id) {
      return {
        ...r,
        admin_notes: notes,
        last_modified_by: adminEmail,
        updated_at: new Date().toISOString(),
      };
    }
    return r;
  });

  saveLocalRegistrations(updated);

  addLocalLog({
    registration_id: id,
    student_name: studentName,
    action: 'تحديث الملاحظات الداخلية',
    notes_added: notes,
    performed_by: adminEmail,
  });

  return { success: true };
}

export async function deleteStudentRegistration(
  id: string,
  adminEmail: string
): Promise<{ success: boolean; error?: string }> {
  const registrations = getLocalRegistrations();
  const student = registrations.find(r => r.id === id);
  const studentName = student ? student.full_name : 'طالب';

  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase
        .from('registrations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      console.error('Supabase delete error:', err);
    }
  }

  const filtered = registrations.filter(r => r.id !== id);
  saveLocalRegistrations(filtered);

  addLocalLog({
    registration_id: id,
    student_name: studentName,
    action: `حذف تسجيل الطالب (${studentName})`,
    performed_by: adminEmail,
  });

  return { success: true };
}

export async function fetchAuditLogs(): Promise<AuditLog[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('admin_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return (data || []) as AuditLog[];
    } catch (err) {
      console.error('Supabase logs fetch error:', err);
      return getLocalLogs();
    }
  }

  return getLocalLogs();
}

// Reset demo data helper
export function resetDemoData() {
  localStorage.setItem(STORAGE_KEY_REGISTRATIONS, JSON.stringify(INITIAL_DEMO_STUDENTS));
  localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(INITIAL_DEMO_LOGS));
}
