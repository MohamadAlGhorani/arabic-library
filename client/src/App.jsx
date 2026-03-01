import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
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

function ProtectedRoute() {
  const { admin, loading } = useAuth();

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
      <AdminSidebar />
      <div className="flex-1 bg-gray-50 min-h-[calc(100vh-56px)] overflow-auto">
        <Outlet />
      </div>
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
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main id="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/reserve/:id" element={<Reserve />} />
          <Route path="/admin/login" element={<Login />} />
          <Route path="/admin" element={<ProtectedRoute />}>
            <Route index element={<Dashboard />} />
            <Route path="books" element={<ManageBooks />} />
            <Route path="reservations" element={<ManageReservations />} />
            <Route path="settings" element={<ManageSettings />} />
            <Route element={<SuperAdminRoute />}>
              <Route path="categories" element={<ManageCategories />} />
              <Route path="locations" element={<ManageLocations />} />
              <Route path="admins" element={<ManageAdmins />} />
            </Route>
          </Route>
        </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
