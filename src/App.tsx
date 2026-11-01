import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Header } from './components/Header';
import { StudentPage } from './components/StudentPage';
import { Footer } from './components/Footer';
import { AdminUser } from './types';
import { getCachedAdminSession, adminLogout } from './services/api';

// Code-split admin bundle: normal visitors will NEVER download the admin UI or code!
const AdminLogin = lazy(() => import('./components/AdminLogin').then(m => ({ default: m.AdminLogin })));
const AdminDashboard = lazy(() => import('./components/AdminDashboard').then(m => ({ default: m.AdminDashboard })));

// Secret path for admin gateway
const SECRET_ADMIN_PATH = (import.meta.env.VITE_ADMIN_SECRET_PATH || '/emaraadmin').toLowerCase();

export const App: React.FC = () => {
  // Check if current URL matches the SECRET admin gateway
  const isSecretAdminRoute = () => {
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    const search = window.location.search.toLowerCase();
    
    return (
      path === '/emaraadmin' ||
      path === '/emaraadmin/' ||
      path === SECRET_ADMIN_PATH ||
      path === `${SECRET_ADMIN_PATH}/` ||
      hash === '#emaraadmin' ||
      hash === '#/emaraadmin' ||
      hash === `#${SECRET_ADMIN_PATH.replace('/', '')}` ||
      search.includes('emaraadmin')
    );
  };

  const [isAdminPage, setIsAdminPage] = useState<boolean>(isSecretAdminRoute());
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);

  useEffect(() => {
    // If someone tries /admin or /dashboard, silently redirect them to /
    const path = window.location.pathname.toLowerCase();
    if (path === '/admin' || path === '/admin/' || path === '/dashboard' || path === '/dashboard/') {
      window.history.replaceState({}, '', '/');
      setIsAdminPage(false);
    }

    // Check cached session
    const cached = getCachedAdminSession();
    if (cached) {
      setAdminUser(cached);
    }

    // Listen to route changes
    const handleLocationChange = () => {
      setIsAdminPage(isSecretAdminRoute());
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);

    // Secret shortcut listener: Ctrl + Shift + A (or Alt + Shift + K)
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey && e.shiftKey && (e.key === 'A' || e.key === 'a')) ||
          (e.altKey && e.shiftKey && (e.key === 'K' || e.key === 'k'))) {
        e.preventDefault();
        window.history.pushState({}, '', SECRET_ADMIN_PATH);
        setIsAdminPage(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleLogout = async () => {
    await adminLogout();
    setAdminUser(null);
    window.history.pushState({}, '', '/');
    setIsAdminPage(false);
  };

  const handleLoginSuccess = (user: AdminUser) => {
    setAdminUser(user);
  };

  // Secret admin trigger from footer (5 rapid clicks on logo/title)
  const handleSecretTrigger = () => {
    window.history.pushState({}, '', SECRET_ADMIN_PATH);
    setIsAdminPage(true);
  };

  // If on secret admin route:
  if (isAdminPage) {
    return (
      <div className="min-h-screen flex flex-col bg-[#0f172a] text-slate-100" dir="rtl">
        <header className="bg-slate-900 border-b border-slate-800 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg overflow-hidden border border-slate-700 bg-slate-800">
                <img 
                  src="/assets/codora-logo.jpg" 
                  alt="Codora" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-wide text-white">بوابة كودورا الإدارية</span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-1.5 py-0.5 rounded">
                  PORTAL SECURED
                </span>
              </div>
            </div>
            <button
              onClick={() => {
                window.history.pushState({}, '', '/');
                setIsAdminPage(false);
              }}
              className="text-xs text-slate-400 hover:text-white transition-colors"
            >
              ← العودة للموقع العام
            </button>
          </div>
        </header>

        <main className="flex-1 bg-slate-950/60 p-4">
          <Suspense
            fallback={
              <div className="flex items-center justify-center min-h-[300px] text-xs text-slate-400 gap-2">
                <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                <span>جاري تحميل البوابة المشفرة...</span>
              </div>
            }
          >
            {adminUser ? (
              <AdminDashboard admin={adminUser} onLogout={handleLogout} />
            ) : (
              <AdminLogin
                onLoginSuccess={handleLoginSuccess}
                onBackToStudent={() => {
                  window.history.pushState({}, '', '/');
                  setIsAdminPage(false);
                }}
              />
            )}
          </Suspense>
        </main>
      </div>
    );
  }

  // Public Student Site (Zero admin traces, /admin is a dead end)
  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] text-slate-900" dir="rtl">
      <Header />
      <div className="flex-1">
        <StudentPage />
      </div>
      <Footer onSecretAdminClick={handleSecretTrigger} />
    </div>
  );
};

export default App;
