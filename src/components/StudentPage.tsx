import React, { useState } from 'react';
import { RegistrationForm } from './RegistrationForm';
import { InfoCard } from './InfoCard';
import { SuccessModal } from './SuccessModal';
import { StudentRegistration } from '../types';
import confetti from 'canvas-confetti';

export const StudentPage: React.FC = () => {
  const [successStudent, setSuccessStudent] = useState<StudentRegistration | null>(null);

  const handleRegistrationSuccess = (student: StudentRegistration) => {
    setSuccessStudent(student);
    try {
      confetti({
        particleCount: 35,
        spread: 50,
        origin: { y: 0.65 },
        colors: ['#0f172a', '#059669', '#3b82f6'],
        disableForReducedMotion: true,
      });
    } catch {
      // Ignore
    }
  };

  return (
    <main className="max-w-4xl mx-auto px-4 py-6 sm:py-8 text-right">
      
      {/* Editorial Headline */}
      <div className="mb-6 text-center sm:text-right">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold mb-2.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          <span>الحجز متاح الآن للعام الدراسي الجديد</span>
        </div>
        <h1 className="text-xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug">
          دروس البرمجة للثانوية العامة
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1.5 font-medium">
          مادة الحاسب وتكنولوجيا المعلومات • إشراف: م. محمد عمارة &amp; م. عمر خالد • <span className="text-emerald-700 font-bold">أول سيشن مجانية بالكامل</span>
        </p>
      </div>

      {/* Main Grid: Form & Info */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* Form Column */}
        <div className="lg:col-span-7 order-1">
          <RegistrationForm onSuccess={handleRegistrationSuccess} />
        </div>

        {/* Info Column */}
        <div className="lg:col-span-5 order-2">
          <InfoCard />
        </div>

      </div>

      {/* Success Modal */}
      {successStudent && (
        <SuccessModal
          student={successStudent}
          onClose={() => setSuccessStudent(null)}
        />
      )}

    </main>
  );
};
