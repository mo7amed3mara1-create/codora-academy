import React, { useState } from 'react';
import { Check, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { GradeType, PackageType, RegistrationFormData, StudentRegistration } from '../types';
import { GOVERNORATES, PACKAGES_INFO, isValidEgyptianPhone, cleanEgyptianPhone } from '../lib/constants';
import { submitRegistration } from '../services/api';

interface RegistrationFormProps {
  onSuccess: (student: StudentRegistration) => void;
}

const INITIAL_FORM_STATE: RegistrationFormData = {
  full_name: '',
  student_phone: '',
  parent_phone: '',
  grade: 'الصف الأول الثانوي',
  governorate: 'القاهرة',
  school: '',
  package: 'شهر',
  notes: '',
  consent_agreed: true,
};

export const RegistrationForm: React.FC<RegistrationFormProps> = ({ onSuccess }) => {
  const [formData, setFormData] = useState<RegistrationFormData>(INITIAL_FORM_STATE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const grades: { label: string; value: GradeType }[] = [
    { label: 'أولى ثانوي', value: 'الصف الأول الثانوي' },
    { label: 'تانية ثانوي', value: 'الصف الثاني الثانوي' },
    { label: 'تالتة ثانوي', value: 'الصف الثالث الثانوي' },
  ];

  const packages: { id: PackageType; name: string; price: string; note: string }[] = [
    { id: 'شهر', name: 'شهري', price: '100 ج', note: 'بدل 150 ج' },
    { id: 'ترم', name: 'ترم كامل', price: '400 ج', note: 'بدل 450 ج' },
    { id: 'سنة', name: 'سنة كاملة', price: '750 ج', note: 'بدل 900 ج' },
  ];

  const studentPhoneClean = cleanEgyptianPhone(formData.student_phone);
  const parentPhoneClean = cleanEgyptianPhone(formData.parent_phone);
  const isStudentValid = isValidEgyptianPhone(studentPhoneClean);
  const isParentValid = isValidEgyptianPhone(parentPhoneClean);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    if (errorMessage) setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!formData.full_name.trim() || formData.full_name.trim().length < 5) {
      setErrorMessage('يرجى كتابة الاسم ثلاثي بالكامل.');
      return;
    }

    if (!isStudentValid) {
      setErrorMessage('رقم موبايل الطالب غير صحيح (يجب أن يبدأ بـ 01 ويتكون من 11 رقم).');
      return;
    }

    if (!isParentValid) {
      setErrorMessage('رقم ولي الأمر غير صحيح (يجب أن يبدأ بـ 01 ويتكون من 11 رقم).');
      return;
    }

    if (studentPhoneClean === parentPhoneClean) {
      setErrorMessage('يرجى إدخال رقم مختلف لولي الأمر عن رقم الطالب.');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await submitRegistration(formData);
      if (result.success && result.data) {
        setFormData(INITIAL_FORM_STATE);
        onSuccess(result.data);
      } else {
        setErrorMessage(result.error || 'حدث خطأ أثناء التسجيل. يرجى المحاولة ثانية.');
      }
    } catch {
      setErrorMessage('تعذر الاتصال بالخادم. تأكد من اتصال الإنترنت.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-subtle p-5 sm:p-7 text-right">
      
      {/* Form Heading */}
      <div className="mb-5 pb-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            استمارة حجز الحصة المجانية
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            إشراف: م. محمد عمارة &amp; م. عمر خالد • املأ البيانات وسنتواصل معك لتأكيد الموعد
          </p>
        </div>
        <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200/70 shrink-0">
          مجانية 100%
        </span>
      </div>

      {errorMessage && (
        <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Full Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            اسم الطالب بالكامل
          </label>
          <input
            type="text"
            name="full_name"
            value={formData.full_name}
            onChange={handleChange}
            placeholder="مثال: أحمد محمد علي"
            required
            className="w-full h-10 px-3.5 text-xs sm:text-sm bg-slate-50/70 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition-colors"
          />
        </div>

        {/* Student & Parent Phones */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700">
                موبايل الطالب
              </label>
              {isStudentValid && (
                <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5">
                  <Check className="w-3 h-3" /> صحيح
                </span>
              )}
            </div>
            <input
              type="tel"
              name="student_phone"
              value={formData.student_phone}
              onChange={handleChange}
              placeholder="01xxxxxxxxx"
              maxLength={11}
              dir="ltr"
              required
              className="w-full h-10 px-3.5 text-xs sm:text-sm bg-slate-50/70 border border-slate-200 rounded-lg text-slate-900 text-right focus:bg-white focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition-colors"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700">
                موبايل ولي الأمر
              </label>
              {isParentValid && studentPhoneClean !== parentPhoneClean && (
                <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5">
                  <Check className="w-3 h-3" /> صحيح
                </span>
              )}
            </div>
            <input
              type="tel"
              name="parent_phone"
              value={formData.parent_phone}
              onChange={handleChange}
              placeholder="01xxxxxxxxx"
              maxLength={11}
              dir="ltr"
              required
              className="w-full h-10 px-3.5 text-xs sm:text-sm bg-slate-50/70 border border-slate-200 rounded-lg text-slate-900 text-right focus:bg-white focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition-colors"
            />
          </div>
        </div>

        {/* Grade Selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            الصف الدراسي
          </label>
          <div className="grid grid-cols-3 gap-2">
            {grades.map(g => {
              const active = formData.grade === g.value;
              return (
                <button
                  key={g.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, grade: g.value }))}
                  className={`h-9 rounded-lg text-xs font-semibold border transition-all ${
                    active
                      ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                      : 'bg-slate-50/70 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {g.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Governorate & School */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              المحافظة
            </label>
            <select
              name="governorate"
              value={formData.governorate}
              onChange={handleChange}
              className="w-full h-10 px-3 text-xs sm:text-sm bg-slate-50/70 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800"
            >
              {GOVERNORATES.map(gov => (
                <option key={gov} value={gov}>{gov}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              المدرسة <span className="text-slate-400 font-normal">(اختياري)</span>
            </label>
            <input
              type="text"
              name="school"
              value={formData.school}
              onChange={handleChange}
              placeholder="اسم مدرستك"
              className="w-full h-10 px-3.5 text-xs sm:text-sm bg-slate-50/70 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800"
            />
          </div>
        </div>

        {/* Package Selector */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-700">
              الباقة المرشحة للاستمرار
            </label>
            <span className="text-[11px] text-slate-400">
              (الدفع بعد الحصة المجانية)
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {packages.map(pkg => {
              const active = formData.package === pkg.id;
              return (
                <div
                  key={pkg.id}
                  onClick={() => setFormData(prev => ({ ...prev, package: pkg.id }))}
                  className={`p-2.5 rounded-lg border cursor-pointer text-center transition-all ${
                    active
                      ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <span className="block text-xs font-bold text-slate-900">{pkg.name}</span>
                  <span className="block text-sm font-extrabold text-slate-900 mt-0.5">{pkg.price}</span>
                  <span className="block text-[10px] text-slate-400 line-through mt-0.5">{pkg.note}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full h-12 rounded-lg font-bold text-sm text-white transition-all flex items-center justify-center gap-2 ${
              isSubmitting
                ? 'bg-slate-400 cursor-not-allowed'
                : 'bg-slate-900 hover:bg-slate-800 active:bg-slate-950 shadow-subtle'
            }`}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                جاري تأكيد حجزك...
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                حجز الحصة التجريبية مجاناً
                <ArrowLeft className="w-4 h-4 mr-0.5" />
              </span>
            )}
          </button>
          
          <p className="text-[11px] text-slate-400 text-center mt-2 font-medium">
            بدون أي مصاريف مسبقة • بنكلمك نحدد الميعاد المناسب معك
          </p>
        </div>

      </form>
    </div>
  );
};
