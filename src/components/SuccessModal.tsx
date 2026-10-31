import React, { useState } from 'react';
import { CheckCircle2, MessageCircle, Copy, Check } from 'lucide-react';
import { StudentRegistration } from '../types';
import { ACADEMY_PHONE, getWhatsAppUrl } from '../lib/constants';

interface SuccessModalProps {
  student: StudentRegistration | null;
  onClose: () => void;
}

export const SuccessModal: React.FC<SuccessModalProps> = ({ student, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!student) return null;

  const whatsappMessage = `السلام عليكم، سجلت في كودورا لحضور أول سيشن مجانية:
الاسم: ${student.full_name}
الصف: ${student.grade}
كود الحجز: #${student.id.slice(-6).toUpperCase()}`;

  const whatsappUrl = getWhatsAppUrl(ACADEMY_PHONE, whatsappMessage);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(student.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-white rounded-xl border border-slate-200 shadow-modal max-w-sm w-full p-6 text-right"
        role="dialog"
        aria-modal="true"
      >
        <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-3">
          <CheckCircle2 className="w-6 h-6" />
        </div>

        <h3 className="text-base font-bold text-slate-900 text-center mb-1">
          تم تأكيد طلبك بنجاح!
        </h3>
        
        <p className="text-xs text-slate-500 text-center mb-4 leading-relaxed">
          أهلاً بك يا <strong className="text-slate-800">{student.full_name}</strong> في كودورا. سيقوم فريق المتابعة بالتواصل لتحديد موعد الحصة المجانية.
        </p>

        {/* Short Code Badge */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-4 flex items-center justify-between text-xs">
          <span className="text-slate-500">كود الحجز الخاص بك:</span>
          <div className="flex items-center gap-1.5">
            <span className="font-mono font-bold text-slate-900">
              #{student.id.slice(-6).toUpperCase()}
            </span>
            <button
              onClick={handleCopyCode}
              className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-700"
              title="نسخ الكود"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Action */}
        <div className="space-y-2">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full h-11 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2"
          >
            <MessageCircle className="w-4 h-4" />
            <span>تأكيد الموعد فوراً عبر واتساب</span>
          </a>

          <button
            onClick={onClose}
            className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
};
