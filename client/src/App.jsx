import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { HiOutlineBars3 } from 'react-icons/hi2';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AdminSidebar from './components/AdminSidebar';
import Home from './pages/Home';
import Reserve from './pages/Reserve';
import Login from './pages/admin/Login';
import Dashboard from './pages/admin/Dashboard';
import ManageBooks from './pages/admin/ManageBooks';
import ManageCategories from './pages/admin/ManageCategories';
import ManageReservations from './pages/admin/ManageReservations';
import ManageSettings from './pages/admin/ManageSettings';
import ManageLocations from './pages/admin/ManageLocations';
import ManageAdmins from './pages/admin/ManageAdmins';
import ManagePages from './pages/admin/ManagePages';
import Reports from './pages/admin/Reports';
import AuditLog from './pages/admin/AuditLog';
import About from './pages/About';
import HowItWorks from './pages/HowItWorks';
import Contact from './pages/Contact';
import Locations from './pages/Locations';

function ProtectedRoute() {
  const { t } = useTranslation();
  const { admin, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-56px)]" role="status" aria-label="Loading">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!admin) return <Navigate to="/admin/login" replace />;

  return (
    <div className="flex">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 bg-gray-50 dark:bg-gray-900 min-h-[calc(100vh-56px)] overflow-auto">
        <button
          onClick={() => setSidebarOpen(true)}
          className="md:hidden flex items-center gap-2 m-4 mb-0 px-3 py-2 bg-gray-800 text-white rounded-lg text-sm cursor-pointer hover:bg-gray-700 transition-colors"
          aria-label={t('nav.menu')}
        >
          <HiOutlineBars3 className="w-5 h-5" />
          {t('nav.menu')}
        </button>
        <Outlet />
      </div>
    </div>
  );
}

function PublicLayout() {
  return (
    <div className="flex flex-col min-h-[calc(100vh-56px)]">
      <div className="flex-1">
        <Outlet />
      </div>
      <Footer />
    </div>
  );
}

function SuperAdminRoute() {
  const { isSuperAdmin } = useAuth();
  if (!isSuperAdmin) return <Navigate to="/admin" replace />;
  return <Outlet />;
}

export default function App() {
  const { i18n } = useTranslation();

  useEffect(() => {
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <main id="main-content">
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/locations" element={<Locations />} />
            <Route path="/reserve/:id" element={<Reserve />} />
            <Route path="/admin/login" element={<Login />} />
          </Route>
          <Route path="/admin" element={<ProtectedRoute />}>
            <Route index element={<Dashboard />} />
            <Route path="books" element={<ManageBooks />} />
            <Route path="reservations" element={<ManageReservations />} />
            <Route path="settings" element={<ManageSettings />} />
            <Route path="reports" element={<Reports />} />
            <Route element={<SuperAdminRoute />}>
              <Route path="categories" element={<ManageCategories />} />
              <Route path="locations" element={<ManageLocations />} />
              <Route path="admins" element={<ManageAdmins />} />
              <Route path="content" element={<ManagePages />} />
              <Route path="audit-log" element={<AuditLog />} />
            </Route>
          </Route>
        </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
