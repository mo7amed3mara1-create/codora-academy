import { PackageType, StatusType } from '../types';

export const ACADEMY_PHONE = '01080929572';
export const ACADEMY_PHONE_INTL = '201080929572';

export const GOVERNORATES = [
  'القاهرة',
  'الجيزة',
  'الإسكندرية',
  'الدقهلية',
  'الشرقية',
  'القليوبية',
  'البحيرة',
  'الغربية',
  'المنوفية',
  'دمياط',
  'كفر الشيخ',
  'بورسعيد',
  'الإسماعيلية',
  'السويس',
  'بني سويف',
  'الفيوم',
  'المنيا',
  'أسيوط',
  'سوهاج',
  'قنا',
  'الأقصر',
  'أسوان',
  'البحر الأحمر',
  'الوادي الجديد',
  'مطروح',
  'شمال سيناء',
  'جنوب سيناء',
] as const;

export const PACKAGES_INFO: Record<PackageType, {
  name: string;
  currentPrice: number;
  originalPrice: number;
  discountNote: string;
  badge?: string;
  popular?: boolean;
}> = {
  'شهر': {
    name: 'اشتراك شهري',
    currentPrice: 100,
    originalPrice: 150,
    discountNote: 'عرض الافتتاح: أول شهر بـ 100 ج بدل 150 ج (خصم 33%)',
    badge: 'عرض الافتتاح',
    popular: true,
  },
  'ترم': {
    name: 'اشتراك ترم كامل',
    currentPrice: 400,
    originalPrice: 450,
    discountNote: '400 ج بدل 450 ج (وفر 50 ج)',
  },
  'سنة': {
    name: 'اشتراك سنوي شامل',
    currentPrice: 750,
    originalPrice: 900,
    discountNote: '750 ج بدل 900 ج (وفر 150 ج)',
  },
};

export const COURSE_FEATURES = [
  {
    title: 'بناء صحيح من الأساس البرمجي',
    description: 'فهم عميق لمنطق البرمجة والتفكير الحسابي وليس مجرد حفظ أكواد.',
  },
  {
    title: 'تطبيق عملي ومشاريع برمجية حقيقية',
    description: 'كتابة برامج فعلية من أول حصة لربط المفاهيم النظرية بالتطبيق.',
  },
  {
    title: 'حل نماذج امتحانات وتدريبات مستمرة',
    description: 'تدريب مكثف على أسئلة ومسائل مطابقة لمواصفات امتحانات الثانوية العامة.',
  },
  {
    title: 'متابعة دورية لمستوى كل طالب وتقارير لولي الأمر',
    description: 'تقييم أسبوعي واختبارات قصيرة مع إرسال ملخص تطور الطالب بشكل دوري.',
  },
  {
    title: 'تنمية المهارات الشخصية وحل المشكلات (Soft Skills)',
    description: 'تعزيز مهارات التفكير النقدي، إدارة الوقت، وعرض المشاريع بثقة.',
  },
];

export const STATUS_CONFIG: Record<StatusType, {
  label: string;
  bg: string;
  text: string;
  border: string;
}> = {
  'جديد': {
    label: 'جديد',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
  },
  'تم التواصل': {
    label: 'تم التواصل',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
  },
  'تم الدفع': {
    label: 'تم الدفع',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
  },
  'مؤكد': {
    label: 'مؤكد',
    bg: 'bg-slate-100',
    text: 'text-slate-800',
    border: 'border-slate-300',
  },
  'ملغي': {
    label: 'ملغي',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
  },
};

export function cleanEgyptianPhone(phone: string): string {
  // Replace non-digits, replace arabic numerals with english
  const arabicNumerals = ['٠','١','٢','٣','٤','٥','٦','٧','٨','٩'];
  let cleaned = phone.replace(/[٠-٩]/g, d => arabicNumerals.indexOf(d).toString());
  cleaned = cleaned.replace(/[^0-9]/g, '');
  
  if (cleaned.startsWith('20') && cleaned.length === 12) {
    cleaned = cleaned.substring(2);
  } else if (cleaned.startsWith('+20') && cleaned.length === 13) {
    cleaned = cleaned.substring(3);
  }
  return cleaned;
}

export function isValidEgyptianPhone(phone: string): boolean {
  const cleaned = cleanEgyptianPhone(phone);
  return /^01[0125][0-9]{8}$/.test(cleaned);
}

export function getWhatsAppUrl(phone: string, text: string): string {
  const cleaned = cleanEgyptianPhone(phone);
  const internationalNumber = cleaned.startsWith('0') ? '2' + cleaned : cleaned;
  return `https://wa.me/${internationalNumber}?text=${encodeURIComponent(text)}`;
}
