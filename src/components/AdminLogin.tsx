import React, { useState, useEffect } from 'react';
import { Shield, Eye, EyeOff, KeyRound, AlertTriangle, UserCheck } from 'lucide-react';
import { adminLogin, checkIsLockedOut } from '../services/api';
import { AdminUser } from '../types';

interface AdminLoginProps {
  onLoginSuccess: (user: AdminUser) => void;
  onBackToStudent: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({
  onLoginSuccess,
  onBackToStudent,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutMinutes, setLockoutMinutes] = useState(0);

  useEffect(() => {
    const status = checkIsLockedOut();
    if (status.locked) {
      setIsLocked(true);
      setLockoutMinutes(status.minutesLeft);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const res = await adminLogin(username, password);
      if (res.success && res.user) {
        setIsLocked(false);
        onLoginSuccess(res.user);
      } else {
        setErrorMessage(res.error || 'اسم المستخدم أو كلمة المرور غير صحيحة.');
        const checkStatus = checkIsLockedOut();
        if (checkStatus.locked) {
          setIsLocked(true);
          setLockoutMinutes(checkStatus.minutesLeft);
        }
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'حدث خطأ أثناء تسجيل الدخول.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto py-12 px-4 text-right">
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-6 text-slate-100">
        
        {/* Security Shield Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-slate-800/80 border border-slate-700 text-emerald-400 flex items-center justify-center mx-auto mb-3 shadow-inner">
            <Shield className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-white tracking-tight">
            بوابة الإدارة المشفرة
          </h2>
          <p className="text-[11px] text-slate-400 mt-1 font-mono">
            CODORA ACADEMY • RESTRICTED ACCESS
          </p>
        </div>

        {/* Lockout Banner */}
        {isLocked ? (
          <div className="mb-4 p-3 rounded-lg bg-rose-950/80 border border-rose-800/80 text-rose-200 text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="block text-rose-300">تم قفل اللوحة مؤقتًا</strong>
              تم تجاوز الحد المسموح به للمحاولات الخاطئة. انتظر <strong>{lockoutMinutes} دقيقة</strong> لإعادة المحاولة.
            </div>
          </div>
        ) : errorMessage && (
          <div className="mb-4 p-3 rounded-lg bg-rose-950/60 border border-rose-900 text-rose-300 text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <div className="leading-relaxed">{errorMessage}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Username */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              اسم المستخدم (Username)
            </label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="اسم المستخدم الخاص بك"
                dir="ltr"
                required
                className="w-full h-10 px-3.5 pl-9 text-xs sm:text-sm bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-right transition-colors"
              />
              <UserCheck className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              كلمة المرور القوية (Password)
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••••••••••"
                dir="ltr"
                required
                className="w-full h-10 px-3.5 pl-9 text-xs sm:text-sm bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-right transition-colors font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-3 text-slate-500 hover:text-slate-300 focus:outline-none"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full h-11 rounded-lg font-bold text-xs text-white transition-all flex items-center justify-center gap-2 mt-2 ${
              isLoading
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                : 'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 shadow-lg'
            }`}
          >
            {isLoading ? (
              <span>جاري التحقق من الصلاحيات...</span>
            ) : (
              <span className="flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5" />
                تسجيل الدخول المشفر
              </span>
            )}
          </button>

        </form>

        {/* Back Link */}
        <div className="mt-5 pt-4 border-t border-slate-800 text-center">
          <button
            type="button"
            onClick={onBackToStudent}
            className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            ← رجوع إلى صفحة الطلاب
          </button>
        </div>

      </div>
    </div>
  );
};
