import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HiOutlineUser, HiOutlineLockClosed, HiOutlineShieldCheck } from 'react-icons/hi2';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { loginAdmin } = useAuth();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await loginAdmin(form);
      navigate('/admin');
    } catch (err) {
      setError(t('admin.invalidCredentials'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 w-full max-w-sm">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/40 rounded-full flex items-center justify-center">
            <HiOutlineShieldCheck className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-center text-gray-800 dark:text-gray-100 mb-6">
          {t('admin.login')}
        </h1>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-4 py-2 rounded-lg mb-4 text-center" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="login-username" className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              <HiOutlineUser className="w-4 h-4" />
              {t('admin.username')}
            </label>
            <input
              id="login-username"
              type="text"
              required
              autoComplete="username"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-gray-100"
            />
          </div>
          <div>
            <label htmlFor="login-password" className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              <HiOutlineLockClosed className="w-4 h-4" />
              {t('admin.password')}
            </label>
            <input
              id="login-password"
              type="password"
              required
              autoComplete="current-password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-gray-100"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 text-white py-3 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
          >
            {loading ? t('admin.loggingIn') : t('admin.loginBtn')}
          </button>
        </form>
      </div>
    </div>
  );
}
