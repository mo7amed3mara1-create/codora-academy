import React from 'react';
import { MessageCircle } from 'lucide-react';
import { ACADEMY_PHONE, getWhatsAppUrl } from '../lib/constants';

export const Header: React.FC = () => {
  const whatsappUrl = getWhatsAppUrl(
    ACADEMY_PHONE,
    'السلام عليكم، حابب أستفسر عن أول سيشن مجانية في كودورا أكاديمي.'
  );

  return (
    <header className="bg-white/95 backdrop-blur-sm border-b border-slate-200/80 sticky top-0 z-30">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
        
        {/* Brand identity */}
        <div className="flex items-center gap-2.5">
          <img 
            src="/assets/codora-logo.jpg" 
            alt="كودورا أكاديمي" 
            className="w-8 h-8 rounded-lg object-cover border border-slate-200"
          />
          <div className="flex items-baseline gap-1.5">
            <span className="font-bold text-sm tracking-tight text-slate-900">
              كودورا أكاديمي
            </span>
            <span className="text-[11px] text-slate-400 font-normal">
              • ثانوية عامة
            </span>
          </div>
        </div>

        {/* Action */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
            أول سيشن مجانًا
          </span>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1 p-1"
            title="تواصل واتساب"
          >
            <MessageCircle className="w-4 h-4 text-emerald-600" />
          </a>
        </div>

      </div>
    </header>
  );
};
