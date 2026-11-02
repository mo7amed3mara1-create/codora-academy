import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Calendar, 
  Search, 
  Filter, 
  Download, 
  RefreshCw, 
  LogOut, 
  MessageCircle, 
  Phone, 
  Edit3, 
  Trash2, 
  History, 
  Check, 
  X, 
  ChevronDown, 
  Eye, 
  Clock, 
  ShieldCheck, 
  AlertCircle 
} from 'lucide-react';
import { 
  StudentRegistration, 
  StatusType, 
  GradeType, 
  PackageType, 
  AuditLog, 
  AdminUser 
} from '../types';
import { 
  GOVERNORATES, 
  STATUS_CONFIG, 
  ACADEMY_PHONE, 
  getWhatsAppUrl 
} from '../lib/constants';
import { 
  fetchAllRegistrations, 
  updateStudentStatus, 
  updateStudentAdminNotes, 
  deleteStudentRegistration, 
  fetchAuditLogs, 
  isSupabaseConfigured,
  resetDemoData
} from '../services/api';

interface AdminDashboardProps {
  admin: AdminUser;
  onLogout: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ admin, onLogout }) => {
  const [registrations, setRegistrations] = useState<StudentRegistration[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Search and Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [selectedPackage, setSelectedPackage] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedGov, setSelectedGov] = useState<string>('all');

  // Modals
  const [editingNotesStudent, setEditingNotesStudent] = useState<StudentRegistration | null>(null);
  const [tempNotes, setTempNotes] = useState('');
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [detailStudent, setDetailStudent] = useState<StudentRegistration | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Load Data
  const loadData = async () => {
    try {
      setIsRefreshing(true);
      const [regs, logs] = await Promise.all([
        fetchAllRegistrations(),
        fetchAuditLogs(),
      ]);
      setRegistrations(regs);
      setAuditLogs(logs);
    } catch (err) {
      console.error('Error loading admin data:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered registrations
  const filteredRegistrations = useMemo(() => {
    return registrations.filter(item => {
      // Search
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const matchesName = item.full_name.toLowerCase().includes(query);
        const matchesPhone = item.student_phone.includes(query) || item.parent_phone.includes(query);
        const matchesGov = item.governorate.toLowerCase().includes(query);
        const matchesSchool = item.school?.toLowerCase().includes(query) || false;
        if (!matchesName && !matchesPhone && !matchesGov && !matchesSchool) {
          return false;
        }
      }

      // Grade
      if (selectedGrade !== 'all' && item.grade !== selectedGrade) {
        return false;
      }

      // Package
      if (selectedPackage !== 'all' && item.package !== selectedPackage) {
        return false;
      }

      // Status
      if (selectedStatus !== 'all' && item.status !== selectedStatus) {
        return false;
      }

      // Gov
      if (selectedGov !== 'all' && item.governorate !== selectedGov) {
        return false;
      }

      return true;
    });
  }, [registrations, searchQuery, selectedGrade, selectedPackage, selectedStatus, selectedGov]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = registrations.length;
    
    // Today count
    const today = new Date().toISOString().slice(0, 10);
    const todayCount = registrations.filter(r => r.created_at.slice(0, 10) === today).length;

    // By Grade
    const byGrade = {
      first: registrations.filter(r => r.grade === 'الصف الأول الثانوي').length,
      second: registrations.filter(r => r.grade === 'الصف الثاني الثانوي').length,
      third: registrations.filter(r => r.grade === 'الصف الثالث الثانوي').length,
    };

    // By Package
    const byPackage = {
      month: registrations.filter(r => r.package === 'شهر').length,
      term: registrations.filter(r => r.package === 'ترم').length,
      year: registrations.filter(r => r.package === 'سنة').length,
    };

    // By Status
    const byStatus = {
      new: registrations.filter(r => r.status === 'جديد').length,
      contacted: registrations.filter(r => r.status === 'تم التواصل').length,
      paid: registrations.filter(r => r.status === 'تم الدفع').length,
      confirmed: registrations.filter(r => r.status === 'مؤكد').length,
      cancelled: registrations.filter(r => r.status === 'ملغي').length,
    };

    return { total, todayCount, byGrade, byPackage, byStatus };
  }, [registrations]);

  // Status Change handler
  const handleStatusChange = async (studentId: string, newStatus: StatusType) => {
    // Optimistic UI update
    setRegistrations(prev =>
      prev.map(item =>
        item.id === studentId
          ? {
              ...item,
              status: newStatus,
              last_modified_by: admin.email,
              updated_at: new Date().toISOString(),
            }
          : item
      )
    );

    await updateStudentStatus(studentId, newStatus, admin.email);
    // Reload logs in background
    const logs = await fetchAuditLogs();
    setAuditLogs(logs);
  };

  // Notes Save handler
  const handleSaveNotes = async () => {
    if (!editingNotesStudent) return;
    const studentId = editingNotesStudent.id;
    const notesText = tempNotes;

    setRegistrations(prev =>
      prev.map(item =>
        item.id === studentId
          ? {
              ...item,
              admin_notes: notesText,
              last_modified_by: admin.email,
              updated_at: new Date().toISOString(),
            }
          : item
      )
    );

    setEditingNotesStudent(null);
    await updateStudentAdminNotes(studentId, notesText, admin.email);
    const logs = await fetchAuditLogs();
    setAuditLogs(logs);
  };

  // Delete handler
  const handleDelete = async (id: string) => {
    await deleteStudentRegistration(id, admin.email);
    setRegistrations(prev => prev.filter(r => r.id !== id));
    setDeleteConfirmId(null);
    if (detailStudent?.id === id) setDetailStudent(null);
    const logs = await fetchAuditLogs();
    setAuditLogs(logs);
  };

  // Export to Excel / CSV with UTF-8 BOM
  const handleExportCSV = () => {
    if (filteredRegistrations.length === 0) {
      alert('لا توجد بيانات متاحة للتصدير حسب الفلاتر المحددة.');
      return;
    }

    const headers = [
      'كود التسجيل',
      'اسم الطالب',
      'موبايل الطالب',
      'موبايل ولي الأمر',
      'الصف الدراسي',
      'المحافظة',
      'المدرسة',
      'الباقة المختارة',
      'الحالة',
      'ملاحظات الطالب',
      'ملاحظات الإدارة',
      'تاريخ التسجيل',
      'آخر تعديل بواسطة',
      'وقت آخر تعديل',
    ];

    const rows = filteredRegistrations.map(r => [
      `#${r.id.slice(-6).toUpperCase()}`,
      `"${r.full_name.replace(/"/g, '""')}"`,
      `"${r.student_phone}"`,
      `"${r.parent_phone}"`,
      `"${r.grade}"`,
      `"${r.governorate}"`,
      `"${(r.school || '').replace(/"/g, '""')}"`,
      `"${r.package}"`,
      `"${r.status}"`,
      `"${(r.notes || '').replace(/"/g, '""')}"`,
      `"${(r.admin_notes || '').replace(/"/g, '""')}"`,
      `"${new Date(r.created_at).toLocaleString('ar-EG')}"`,
      `"${r.last_modified_by || 'النظام'}"`,
      `"${r.updated_at ? new Date(r.updated_at).toLocaleString('ar-EG') : ''}"`,
    ]);

    // Prepend UTF-8 BOM (\uFEFF) for Microsoft Excel compatibility with Arabic letters
    const csvContent =
      '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `تسجيلات_كودورا_أكاديمي_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedGrade('all');
    setSelectedPackage('all');
    setSelectedStatus('all');
    setSelectedGov('all');
  };

  const getWhatsAppMessage = (student: StudentRegistration, target: 'student' | 'parent') => {
    if (target === 'student') {
      return `السلام عليكم يا ${student.full_name}، معاك كودورا أكاديمي بخصوص تسجيلك في دروس البرمجة (${student.grade}). حابين نحدد موعد البدء وتفاصيل المجموعة معك.`;
    }
    return `السلام عليكم ورحمة الله، كودورا أكاديمي تتواصل مع حضرتك بخصوص تسجيل الطالب/ة ${student.full_name} في مادة البرمجة للثانوية العامة (${student.grade}). نرجو إفادتنا بأفضل موعد للتواصل لتأكيد الحجز.`;
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 text-right">
      
      {/* Top Admin Action Bar */}
      <div className="bg-white rounded-lg border border-slate-300 p-4 mb-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-navy-900 text-white flex items-center justify-center font-bold text-sm">
            أدمن
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-navy-900">
                لوحة تحكم المشرفين | كودورا أكاديمي
              </h1>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                إشراف: م. محمد عمارة &amp; م. عمر خالد
              </span>
            </div>
            <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
              <span>مسجل الدخول: <strong className="text-navy-900">{admin.email}</strong></span>
              <span>•</span>
              {isSupabaseConfigured ? (
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  قاعدة بيانات Supabase
                </span>
              ) : (
                <span className="text-slate-600 font-medium flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  الوضع التجريبي الداخلي
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          <button
            onClick={() => setShowLogsModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition-colors"
            title="سجل التعديلات"
          >
            <History className="w-3.5 h-3.5 text-navy-800" />
            <span>سجل النشاط ({auditLogs.length})</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-white bg-navy-900 hover:bg-navy-800 transition-colors"
            title="تصدير ملف إكسيل / CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>تصدير إكسيل ({filteredRegistrations.length})</span>
          </button>

          <button
            onClick={loadData}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition-colors"
            title="تحديث البيانات"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-navy-800 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={onLogout}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors"
            title="تسجيل الخروج"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>خروج</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3 mb-5">
        
        {/* Card 1: Total Registrations */}
        <div className="bg-white rounded-lg border border-slate-300 p-3 sm:p-4">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">إجمالي التسجيلات</span>
            <Users className="w-4 h-4 text-navy-800" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-navy-900">
            {stats.total}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            جميع الطلبات المسجلة
          </div>
        </div>

        {/* Card 2: Today's Registrations */}
        <div className="bg-white rounded-lg border border-slate-300 p-3 sm:p-4">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">تسجيلات اليوم</span>
            <Calendar className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-700">
            {stats.todayCount}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            آخر 24 ساعة
          </div>
        </div>

        {/* Card 3: By Grade */}
        <div className="bg-white rounded-lg border border-slate-300 p-3 sm:p-4">
          <span className="text-xs font-medium text-slate-500 block mb-1">حسب الصف</span>
          <div className="space-y-0.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-600">أولى:</span>
              <span className="font-bold text-navy-900">{stats.byGrade.first}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">تانية:</span>
              <span className="font-bold text-navy-900">{stats.byGrade.second}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">تالتة:</span>
              <span className="font-bold text-navy-900">{stats.byGrade.third}</span>
            </div>
          </div>
        </div>

        {/* Card 4: By Package */}
        <div className="bg-white rounded-lg border border-slate-300 p-3 sm:p-4">
          <span className="text-xs font-medium text-slate-500 block mb-1">حسب الباقة</span>
          <div className="space-y-0.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-600">شهر:</span>
              <span className="font-bold text-navy-900">{stats.byPackage.month}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">ترم:</span>
              <span className="font-bold text-navy-900">{stats.byPackage.term}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">سنة:</span>
              <span className="font-bold text-navy-900">{stats.byPackage.year}</span>
            </div>
          </div>
        </div>

        {/* Card 5: By Status */}
        <div className="bg-white rounded-lg border border-slate-300 p-3 sm:p-4 col-span-2 sm:col-span-1">
          <span className="text-xs font-medium text-slate-500 block mb-1">حسب الحالة</span>
          <div className="space-y-0.5 text-[11px]">
            <div className="flex justify-between">
              <span className="text-blue-700">جديد:</span>
              <span className="font-bold text-navy-900">{stats.byStatus.new}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-amber-700">تواصل:</span>
              <span className="font-bold text-navy-900">{stats.byStatus.contacted}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-emerald-700">تم الدفع / مؤكد:</span>
              <span className="font-bold text-navy-900">{stats.byStatus.paid + stats.byStatus.confirmed}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-lg border border-slate-300 p-3.5 mb-4 space-y-3 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          
          {/* Search */}
          <div className="lg:col-span-2 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="بحث بالاسم، رقم الموبايل، المدرسة، المحافظة..."
              className="w-full px-3 py-1.5 pl-8 text-xs bg-slate-50 focus:bg-white border border-slate-300 rounded-md focus:outline-none focus:border-navy-800 text-slate-900"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
          </div>

          {/* Grade Filter */}
          <div>
            <select
              value={selectedGrade}
              onChange={e => setSelectedGrade(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 focus:bg-white border border-slate-300 rounded-md focus:outline-none focus:border-navy-800 text-slate-900"
            >
              <option value="all">كل الصفوف الدراسية</option>
              <option value="الصف الأول الثانوي">أولى ثانوي</option>
              <option value="الصف الثاني الثانوي">تانية ثانوي</option>
              <option value="الصف الثالث الثانوي">تالتة ثانوي</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 focus:bg-white border border-slate-300 rounded-md focus:outline-none focus:border-navy-800 text-slate-900"
            >
              <option value="all">كل الحالات</option>
              <option value="جديد">جديد</option>
              <option value="تم التواصل">تم التواصل</option>
              <option value="تم الدفع">تم الدفع</option>
              <option value="مؤكد">مؤكد</option>
              <option value="ملغي">ملغي</option>
            </select>
          </div>

          {/* Package Filter */}
          <div>
            <select
              value={selectedPackage}
              onChange={e => setSelectedPackage(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 focus:bg-white border border-slate-300 rounded-md focus:outline-none focus:border-navy-800 text-slate-900"
            >
              <option value="all">كل الباقات</option>
              <option value="شهر">باقة الشهر</option>
              <option value="ترم">باقة الترم</option>
              <option value="سنة">باقة السنة</option>
            </select>
          </div>

        </div>

        {/* Second Row: Gov Filter & Results Counter */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">المحافظة:</span>
            <select
              value={selectedGov}
              onChange={e => setSelectedGov(e.target.value)}
              className="px-2 py-1 text-xs bg-slate-50 border border-slate-300 rounded-md focus:outline-none text-slate-900"
            >
              <option value="all">كل المحافظات ({GOVERNORATES.length})</option>
              {GOVERNORATES.map(gov => (
                <option key={gov} value={gov}>{gov}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-slate-600 font-medium">
              النتائج المعروضة: <strong className="text-navy-900">{filteredRegistrations.length}</strong> من {registrations.length}
            </span>
            {(searchQuery || selectedGrade !== 'all' || selectedPackage !== 'all' || selectedStatus !== 'all' || selectedGov !== 'all') && (
              <button
                onClick={resetFilters}
                className="text-[11px] text-rose-700 hover:text-rose-800 underline font-medium"
              >
                إعادة ضبط الفلاتر
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Registrations List / Table */}
      {isLoading ? (
        <div className="bg-white rounded-lg border border-slate-300 p-12 text-center">
          <div className="w-6 h-6 border-2 border-navy-800 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500">جاري تحميل بيانات الطلاب...</p>
        </div>
      ) : filteredRegistrations.length === 0 ? (
        <div className="bg-white rounded-lg border border-slate-300 p-8 text-center">
          <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-700">لا توجد تسجيلات مطابقة</h3>
          <p className="text-xs text-slate-500 mt-1">
            جرب تعديل معايير البحث أو تصفير الفلاتر للوصول لكافة الطلبات.
          </p>
          <button
            onClick={resetFilters}
            className="mt-3 px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 border border-slate-300 text-xs font-semibold text-slate-700"
          >
            إلغاء الفلاتر
          </button>
        </div>
      ) : (
        <>
          {/* Desktop Table View (Hidden on mobile) */}
          <div className="hidden lg:block bg-white rounded-lg border border-slate-300 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold">
                  <tr>
                    <th className="py-2.5 px-3">الطالب</th>
                    <th className="py-2.5 px-3">الصف والمحافظة</th>
                    <th className="py-2.5 px-3">الباقة</th>
                    <th className="py-2.5 px-3">أرقام التواصل والواتساب</th>
                    <th className="py-2.5 px-3">الحالة الحالية</th>
                    <th className="py-2.5 px-3">الملاحظات الداخلية</th>
                    <th className="py-2.5 px-3">التاريخ والتدقيق</th>
                    <th className="py-2.5 px-3 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredRegistrations.map(student => {
                    const statusInfo = STATUS_CONFIG[student.status] || STATUS_CONFIG['جديد'];
                    const studentWaUrl = getWhatsAppUrl(
                      student.student_phone,
                      getWhatsAppMessage(student, 'student')
                    );
                    const parentWaUrl = getWhatsAppUrl(
                      student.parent_phone,
                      getWhatsAppMessage(student, 'parent')
                    );

                    return (
                      <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                        
                        {/* Student Name & School */}
                        <td className="py-3 px-3">
                          <div className="font-bold text-navy-900 text-xs">
                            {student.full_name}
                          </div>
                          {student.school ? (
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              {student.school}
                            </div>
                          ) : (
                            <div className="text-[10px] text-slate-400">مدرسة غير محددة</div>
                          )}
                          <span className="font-mono text-[10px] text-slate-400">
                            #{student.id.slice(-6).toUpperCase()}
                          </span>
                        </td>

                        {/* Grade & Gov */}
                        <td className="py-3 px-3">
                          <div className="font-medium text-slate-800">
                            {student.grade.replace('الصف ', '')}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {student.governorate}
                          </div>
                        </td>

                        {/* Package */}
                        <td className="py-3 px-3">
                          <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-navy-900 border border-slate-200">
                            باقة {student.package}
                          </span>
                        </td>

                        {/* Phones with WhatsApp Action */}
                        <td className="py-3 px-3">
                          <div className="space-y-1">
                            {/* Student Phone */}
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-medium text-slate-500 w-8">الطالب:</span>
                              <span className="font-mono text-xs text-slate-800" dir="ltr">
                                {student.student_phone}
                              </span>
                              <a
                                href={studentWaUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[10px] font-semibold transition-colors"
                                title="مراسلة الطالب عبر واتساب"
                              >
                                <MessageCircle className="w-3 h-3 text-emerald-600" />
                                <span>واتساب</span>
                              </a>
                            </div>

                            {/* Parent Phone */}
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-medium text-slate-500 w-8">ولي الأمر:</span>
                              <span className="font-mono text-xs text-slate-800" dir="ltr">
                                {student.parent_phone}
                              </span>
                              <a
                                href={parentWaUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[10px] font-semibold transition-colors"
                                title="مراسلة ولي الأمر عبر واتساب"
                              >
                                <MessageCircle className="w-3 h-3 text-emerald-600" />
                                <span>واتساب</span>
                              </a>
                            </div>
                          </div>
                        </td>

                        {/* One-click Status Changer */}
                        <td className="py-3 px-3">
                          <select
                            value={student.status}
                            onChange={e => handleStatusChange(student.id, e.target.value as StatusType)}
                            className={`px-2 py-1 rounded text-xs font-semibold border cursor-pointer focus:outline-none ${statusInfo.bg} ${statusInfo.text} ${statusInfo.border}`}
                          >
                            <option value="جديد">جديد</option>
                            <option value="تم التواصل">تم التواصل</option>
                            <option value="تم الدفع">تم الدفع</option>
                            <option value="مؤكد">مؤكد</option>
                            <option value="ملغي">ملغي</option>
                          </select>
                        </td>

                        {/* Internal Notes */}
                        <td className="py-3 px-3 max-w-[180px]">
                          <div 
                            onClick={() => {
                              setEditingNotesStudent(student);
                              setTempNotes(student.admin_notes || '');
                            }}
                            className="cursor-pointer group flex items-start justify-between gap-1 p-1.5 rounded hover:bg-slate-100 border border-transparent hover:border-slate-200"
                            title="اضغط لتعديل الملاحظات"
                          >
                            <p className="text-[11px] text-slate-700 line-clamp-2 leading-tight">
                              {student.admin_notes || <span className="text-slate-400 italic">أضف ملاحظات...</span>}
                            </p>
                            <Edit3 className="w-3 h-3 text-slate-400 group-hover:text-navy-900 shrink-0 mt-0.5" />
                          </div>
                        </td>

                        {/* Audit / Date */}
                        <td className="py-3 px-3 text-[11px] text-slate-500">
                          <div>{new Date(student.created_at).toLocaleDateString('ar-EG')}</div>
                          {student.last_modified_by && (
                            <div className="text-[10px] text-slate-400 mt-0.5" title={`عدّله: ${student.last_modified_by}`}>
                              تعديل: {student.last_modified_by.split('@')[0]}
                            </div>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => setDetailStudent(student)}
                              className="p-1 rounded text-slate-600 hover:text-navy-900 hover:bg-slate-100"
                              title="عرض التفاصيل كاملة"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(student.id)}
                              className="p-1 rounded text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                              title="حذف التسجيل"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards View (Compact, optimized for mobile screens) */}
          <div className="lg:hidden space-y-3">
            {filteredRegistrations.map(student => {
              const statusInfo = STATUS_CONFIG[student.status] || STATUS_CONFIG['جديد'];
              const studentWaUrl = getWhatsAppUrl(
                student.student_phone,
                getWhatsAppMessage(student, 'student')
              );
              const parentWaUrl = getWhatsAppUrl(
                student.parent_phone,
                getWhatsAppMessage(student, 'parent')
              );

              return (
                <div 
                  key={student.id} 
                  className="bg-white rounded-lg border border-slate-300 p-3.5 shadow-sm space-y-2.5 text-right"
                >
                  {/* Top card row: Name, Grade & Status */}
                  <div className="flex items-start justify-between gap-2 border-b border-slate-200 pb-2">
                    <div>
                      <div className="font-bold text-sm text-navy-900">
                        {student.full_name}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                        <span>{student.grade.replace('الصف ', '')}</span>
                        <span>•</span>
                        <span>{student.governorate}</span>
                        <span>•</span>
                        <span className="font-semibold text-navy-800">باقة الـ {student.package}</span>
                      </div>
                    </div>
                    
                    {/* Status Dropdown */}
                    <select
                      value={student.status}
                      onChange={e => handleStatusChange(student.id, e.target.value as StatusType)}
                      className={`px-2 py-1 rounded text-xs font-semibold border focus:outline-none ${statusInfo.bg} ${statusInfo.text} ${statusInfo.border}`}
                    >
                      <option value="جديد">جديد</option>
                      <option value="تم التواصل">تم التواصل</option>
                      <option value="تم الدفع">تم الدفع</option>
                      <option value="مؤكد">مؤكد</option>
                      <option value="ملغي">ملغي</option>
                    </select>
                  </div>

                  {/* School & Student Notes */}
                  {(student.school || student.notes) && (
                    <div className="text-xs bg-slate-50 p-2 rounded border border-slate-200 space-y-1">
                      {student.school && (
                        <div>
                          <strong className="text-slate-600">المدرسة: </strong>
                          <span className="text-slate-800">{student.school}</span>
                        </div>
                      )}
                      {student.notes && (
                        <div>
                          <strong className="text-slate-600">ملاحظات الطالب: </strong>
                          <span className="text-slate-800">{student.notes}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Contact Buttons */}
                  <div className="space-y-1.5 pt-1">
                    {/* Student Contact */}
                    <div className="flex items-center justify-between text-xs bg-slate-50 px-2.5 py-1.5 rounded border border-slate-200">
                      <div>
                        <span className="text-slate-500 text-[10px] block">رقم الطالب:</span>
                        <span className="font-mono font-medium text-slate-800">{student.student_phone}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <a
                          href={`tel:${student.student_phone}`}
                          className="p-1.5 rounded bg-slate-200 hover:bg-slate-300 text-slate-700"
                          title="اتصال بالطالب"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                        <a
                          href={studentWaUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded bg-emerald-600 text-white font-semibold text-xs"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>واتساب الطالب</span>
                        </a>
                      </div>
                    </div>

                    {/* Parent Contact */}
                    <div className="flex items-center justify-between text-xs bg-slate-50 px-2.5 py-1.5 rounded border border-slate-200">
                      <div>
                        <span className="text-slate-500 text-[10px] block">رقم ولي الأمر:</span>
                        <span className="font-mono font-medium text-slate-800">{student.parent_phone}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <a
                          href={`tel:${student.parent_phone}`}
                          className="p-1.5 rounded bg-slate-200 hover:bg-slate-300 text-slate-700"
                          title="اتصال بولي الأمر"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                        <a
                          href={parentWaUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded bg-emerald-600 text-white font-semibold text-xs"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>واتساب ولي الأمر</span>
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Internal Notes Button & Meta */}
                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                    <button
                      onClick={() => {
                        setEditingNotesStudent(student);
                        setTempNotes(student.admin_notes || '');
                      }}
                      className="inline-flex items-center gap-1 text-slate-700 hover:text-navy-900 font-medium"
                    >
                      <Edit3 className="w-3 h-3 text-navy-800" />
                      <span>{student.admin_notes ? 'تعديل الملاحظات' : 'إضافة ملاحظة إدارية'}</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setDetailStudent(student)}
                        className="text-navy-800 font-semibold hover:underline"
                      >
                        تفاصيل
                      </button>
                      <span>•</span>
                      <button
                        onClick={() => setDeleteConfirmId(student.id)}
                        className="text-rose-600 font-medium hover:underline"
                      >
                        حذف
                      </button>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        </>
      )}

      {/* MODAL 1: Edit Internal Notes */}
      {editingNotesStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-none">
          <div className="bg-white rounded-lg border border-slate-300 shadow-modal max-w-md w-full p-5 text-right">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
              <h3 className="font-bold text-sm text-navy-900">
                ملاحظات داخلية: {editingNotesStudent.full_name}
              </h3>
              <button 
                onClick={() => setEditingNotesStudent(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <p className="text-xs text-slate-500 mb-2">
              هذه الملاحظات خاصة بفريق الإدارة والمتابعة ولن تظهر للطالب.
            </p>

            <textarea
              value={tempNotes}
              onChange={e => setTempNotes(e.target.value)}
              rows={4}
              placeholder="اكتب هنا ما تم مع الطالب (مثال: كلمنا ولي الأمر، دفع عبر فودافون كاش، موعد الحصة السبت 6 مساءً...)"
              className="w-full px-3 py-2 text-xs bg-slate-50 focus:bg-white border border-slate-300 rounded-md focus:outline-none focus:border-navy-800 text-slate-900 mb-4"
            ></textarea>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingNotesStudent(null)}
                className="px-3 py-1.5 rounded-md border border-slate-300 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSaveNotes}
                className="px-4 py-1.5 rounded-md bg-navy-900 hover:bg-navy-800 text-xs font-semibold text-white"
              >
                حفظ الملاحظة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Full Student Profile View */}
      {detailStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-none">
          <div className="bg-white rounded-lg border border-slate-300 shadow-modal max-w-lg w-full p-5 text-right max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
              <div>
                <h3 className="font-bold text-base text-navy-900">
                  {detailStudent.full_name}
                </h3>
                <span className="font-mono text-xs text-slate-500">
                  كود التسجيل: #{detailStudent.id.slice(-6).toUpperCase()}
                </span>
              </div>
              <button 
                onClick={() => setDetailStudent(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-md border border-slate-200">
                <div>
                  <span className="text-slate-500 block">الصف الدراسي:</span>
                  <span className="font-bold text-slate-800">{detailStudent.grade}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">المحافظة:</span>
                  <span className="font-bold text-slate-800">{detailStudent.governorate}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">المدرسة:</span>
                  <span className="font-bold text-slate-800">{detailStudent.school || 'غير محددة'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">الباقة:</span>
                  <span className="font-bold text-emerald-700">باقة الـ {detailStudent.package}</span>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-md border border-slate-200 space-y-2">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-slate-500 block">موبايل الطالب:</span>
                    <span className="font-mono font-bold text-slate-800">{detailStudent.student_phone}</span>
                  </div>
                  <a
                    href={getWhatsAppUrl(detailStudent.student_phone, getWhatsAppMessage(detailStudent, 'student'))}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1 rounded bg-emerald-600 text-white font-semibold text-xs flex items-center gap-1"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>واتساب</span>
                  </a>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                  <div>
                    <span className="text-slate-500 block">موبايل ولي الأمر:</span>
                    <span className="font-mono font-bold text-slate-800">{detailStudent.parent_phone}</span>
                  </div>
                  <a
                    href={getWhatsAppUrl(detailStudent.parent_phone, getWhatsAppMessage(detailStudent, 'parent'))}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1 rounded bg-emerald-600 text-white font-semibold text-xs flex items-center gap-1"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>واتساب</span>
                  </a>
                </div>
              </div>

              {detailStudent.notes && (
                <div className="bg-slate-50 p-3 rounded-md border border-slate-200">
                  <span className="text-slate-500 font-medium block mb-1">ملاحظات كتبها الطالب أثناء التسجيل:</span>
                  <p className="text-slate-800 leading-relaxed">{detailStudent.notes}</p>
                </div>
              )}

              <div className="bg-slate-50 p-3 rounded-md border border-slate-200">
                <span className="text-slate-500 font-medium block mb-1">ملاحظات الإدارة الداخلية:</span>
                <p className="text-slate-800 leading-relaxed">
                  {detailStudent.admin_notes || 'لا توجد ملاحظات مسجلة بعد.'}
                </p>
              </div>

              <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-200 space-y-1">
                <div>تاريخ التسجيل: {new Date(detailStudent.created_at).toLocaleString('ar-EG')}</div>
                {detailStudent.last_modified_by && (
                  <div>آخر تعديل بواسطة: {detailStudent.last_modified_by} ({new Date(detailStudent.updated_at || '').toLocaleString('ar-EG')})</div>
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setDetailStudent(null)}
                className="px-4 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 border border-slate-300 text-xs font-semibold text-slate-800"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Audit Activity Logs Drawer */}
      {showLogsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-none">
          <div className="bg-white rounded-lg border border-slate-300 shadow-modal max-w-2xl w-full p-5 text-right max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-navy-800" />
                <h3 className="font-bold text-sm sm:text-base text-navy-900">
                  سجل نشاط وتعديلات الأدمن (Audit Trail)
                </h3>
              </div>
              <button 
                onClick={() => setShowLogsModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-3">
              يسجل كل إجراء قام به المشرفون على المنظومة لضمان الشفافية ومتابعة التغييرات.
            </p>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {auditLogs.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  لا توجد سجلات تعديل حتى الآن
                </div>
              ) : (
                auditLogs.map(log => (
                  <div 
                    key={log.id} 
                    className="p-2.5 rounded-md bg-slate-50 border border-slate-200 text-xs text-right space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-navy-900">
                        {log.student_name}
                      </span>
                      <span className="text-[10px] text-slate-400" dir="ltr">
                        {new Date(log.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="text-slate-700">
                      الإجراء: <span className="font-medium">{log.action}</span>
                      {log.new_status && (
                        <span className="inline-block mr-1 px-1.5 py-0.2 rounded bg-slate-200 text-slate-800 text-[10px]">
                          {log.new_status}
                        </span>
                      )}
                    </div>
                    {log.notes_added && (
                      <p className="text-slate-600 text-[11px] bg-white p-1.5 rounded border border-slate-200">
                        "{log.notes_added}"
                      </p>
                    )}
                    <div className="text-[10px] text-slate-400 pt-1 flex items-center justify-between border-t border-slate-100">
                      <span>بواسطة: <strong>{log.performed_by}</strong></span>
                      <span>{new Date(log.created_at).toLocaleDateString('ar-EG')}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 mt-3 border-t border-slate-200 flex justify-between items-center">
              {!isSupabaseConfigured && (
                <button
                  onClick={() => {
                    resetDemoData();
                    loadData();
                  }}
                  className="text-xs text-rose-600 hover:underline"
                >
                  استعادة البيانات التجريبية الافتراضية
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowLogsModal(false)}
                className="px-4 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 border border-slate-300 text-xs font-semibold text-slate-800 mr-auto"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Delete Confirmation */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-none">
          <div className="bg-white rounded-lg border border-slate-300 shadow-modal max-w-sm w-full p-5 text-right">
            <h3 className="font-bold text-sm text-navy-900 mb-2">
              تأكيد حذف التسجيل
            </h3>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              هل أنت متأكد من رغبتك في حذف هذا التسجيل؟ سيتم تسجيل عملية الحذف في سجل النشاط.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-3 py-1.5 rounded-md border border-slate-300 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                إلغاء
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-4 py-1.5 rounded-md bg-rose-600 hover:bg-rose-700 text-xs font-semibold text-white"
              >
                نعم، احذف
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
