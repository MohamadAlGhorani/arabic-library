import { createContext, useContext, useState, useEffect } from 'react';
import { login as loginApi, getMe } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount: if token exists, fetch admin data
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }
    getMe()
      .then((res) => setAdmin(res.data))
      .catch(() => {
        localStorage.removeItem('token');
        setAdmin(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const loginAdmin = async (credentials) => {
    const res = await loginApi(credentials);
    const { token } = res.data;
    localStorage.setItem('token', token);
    // Fetch full admin profile
    const meRes = await getMe();
    setAdmin(meRes.data);
    return meRes.data;
  };

  const logoutAdmin = () => {
    localStorage.removeItem('token');
    setAdmin(null);
  };

  const isSuperAdmin = admin?.role === 'super_admin';
  const isLocationAdmin = admin?.role === 'location_admin';

  return (
    <AuthContext.Provider
      value={{ admin, loading, loginAdmin, logoutAdmin, isSuperAdmin, isLocationAdmin }}
    >
      {children}
    </AuthContext.Provider>
  );
};
