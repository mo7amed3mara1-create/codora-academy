import React from 'react';
import { MessageCircle, Check, Code, Award, Users, BookOpen } from 'lucide-react';
import { ACADEMY_PHONE, getWhatsAppUrl } from '../lib/constants';

export const InfoCard: React.FC = () => {
  const askWhatsappUrl = getWhatsAppUrl(
    ACADEMY_PHONE,
    'السلام عليكم، حابب أستفسر عن تفاصيل دروس البرمجة للثانوية العامة في كودورا أكاديمي.'
  );

  const pillars = [
    {
      title: 'أول سيشن مجانية 100%',
      desc: 'حضور الحصة الأولى بدون أي التزام أو دفع لتجربة الشرح والتطبيق بنفسك.',
      icon: Award,
    },
    {
      title: 'تطبيق عملي وكتابة كود',
      desc: 'بناء مشاريع برمجية وفهم عميق لمنطق البرمجة والتفكير الحسابي.',
      icon: Code,
    },
    {
      title: 'تدريب على الامتحانات',
      desc: 'حل نماذج وتدريبات مطابقة لمواصفات امتحانات الثانوية العامة.',
      icon: BookOpen,
    },
    {
      title: 'متابعة فردية مستمرة',
      desc: 'تقارير دورية لولي الأمر وتطوير مهارات التفكير وحل المشكلات.',
      icon: Users,
    },
  ];

  return (
    <div className="space-y-4 text-right">
      
      {/* Instructor Profile Card */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-subtle">
        <div className="flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-full overflow-hidden border border-slate-200 shrink-0 bg-slate-100">
            <img 
              src="/assets/mohamed-emara.jpg" 
              alt="م. محمد عمارة" 
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm sm:text-base text-slate-900">
                إشراف: م. محمد عمارة
              </h3>
              <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                مشرف المادة
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              مهندس برمجيات متخصص في تبسيط علوم الحاسب ومنهج البرمجة لطلاب الثانوية العامة من التأسيس حتى الامتحان النهائي.
            </p>
          </div>
        </div>
      </div>

      {/* Pillars Grid */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-subtle">
        <h4 className="font-bold text-xs text-slate-900 pb-3 mb-3 border-b border-slate-100">
          مميزات الدراسة في كودورا:
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {pillars.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h5 className="font-bold text-xs text-slate-900">{item.title}</h5>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pricing Breakdown & WhatsApp */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-subtle">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
          <h4 className="font-bold text-xs text-slate-900">
            جدول الأسعار (بعد الحصة المجانية):
          </h4>
          <span className="text-[11px] text-emerald-700 font-semibold">
            عرض الافتتاح
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-[11px] text-slate-500 block">أول شهر</span>
            <span className="font-bold text-slate-900 text-sm">100 ج</span>
            <span className="text-[10px] text-slate-400 line-through block">بدل 150</span>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-[11px] text-slate-500 block">الترم كامل</span>
            <span className="font-bold text-slate-900 text-sm">400 ج</span>
            <span className="text-[10px] text-slate-400 line-through block">بدل 450</span>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-[11px] text-slate-500 block">السنة كاملة</span>
            <span className="font-bold text-slate-900 text-sm">750 ج</span>
            <span className="text-[10px] text-slate-400 line-through block">بدل 900</span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-500">لديك أي سؤال قبل الحجز؟</span>
          <a
            href={askWhatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-md border border-emerald-200 transition-colors"
          >
            <MessageCircle className="w-3.5 h-3.5 text-emerald-700" />
            <span>تواصل واتساب</span>
          </a>
        </div>
      </div>

    </div>
  );
};
