import React, { useRef } from 'react';
import { Phone, MessageCircle } from 'lucide-react';
import { ACADEMY_PHONE, getWhatsAppUrl } from '../lib/constants';

interface FooterProps {
  onSecretAdminClick?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onSecretAdminClick }) => {
  const whatsappUrl = getWhatsAppUrl(
    ACADEMY_PHONE,
    'السلام عليكم، أتواصل بخصوص كودورا أكاديمي لدروس البرمجة للثانوية العامة.'
  );

  // Secret 5-clicks detector
  const clickCountRef = useRef(0);
  const clickTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleTitleClick = () => {
    clickCountRef.current += 1;
    if (clickTimerRef.current) clearTimeout(clickTimerRef.current);

    if (clickCountRef.current >= 5) {
      clickCountRef.current = 0;
      if (onSecretAdminClick) {
        onSecretAdminClick();
      }
    } else {
      clickTimerRef.current = setTimeout(() => {
        clickCountRef.current = 0;
      }, 2500);
    }
  };

  return (
    <footer className="border-t border-slate-200/80 mt-12 py-6 text-right text-xs text-slate-500 bg-white select-none">
      <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-right">
        <div>
          <span 
            onClick={handleTitleClick}
            className="font-bold text-slate-800 block text-xs cursor-default"
            title=""
          >
            كودورا أكاديمي
          </span>
          <span className="text-[11px] text-slate-400">
            دروس البرمجة وتكنولوجيا المعلومات للثانوية العامة • إشراف: م. محمد عمارة &amp; م. عمر خالد
          </span>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={`tel:${ACADEMY_PHONE}`}
            className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <Phone className="w-3 h-3 text-slate-400" />
            <span className="font-mono text-xs">{ACADEMY_PHONE}</span>
          </a>

          <span className="text-slate-300">•</span>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-800 font-medium transition-colors"
          >
            <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span>واتساب</span>
          </a>
        </div>
      </div>
    </footer>
  );
};
