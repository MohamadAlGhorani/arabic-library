import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HiOutlineHome, HiOutlineShieldCheck, HiOutlineArrowRightOnRectangle, HiOutlineArrowLeftOnRectangle } from 'react-icons/hi2';
import { useAuth } from '../context/AuthContext';
import LanguageSwitcher from './LanguageSwitcher';

export default function Navbar() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { admin, logoutAdmin } = useAuth();

  const handleLogout = () => {
    logoutAdmin();
    navigate('/');
  };

  return (
    <nav className="bg-emerald-700 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between flex-wrap gap-2">
        <Link to="/" className="flex items-center gap-2 text-xl font-bold hover:text-emerald-200 transition-colors">
          <img src="/logo.svg" alt="" className="w-8 h-8" />
          {t('app.title')}
        </Link>
        <div className="flex items-center gap-3 flex-wrap">
          <LanguageSwitcher />
          <Link to="/" className="flex items-center gap-1.5 hover:text-emerald-200 transition-colors">
            <HiOutlineHome className="w-5 h-5" />
            {t('nav.home')}
          </Link>
          {admin ? (
            <>
              <Link to="/admin" className="flex items-center gap-1.5 hover:text-emerald-200 transition-colors">
                <HiOutlineShieldCheck className="w-5 h-5" />
                {t('nav.dashboard')}
              </Link>
              <span className="text-emerald-200 text-sm hidden sm:inline">
                {admin.fullName || admin.username}
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 hover:text-emerald-200 transition-colors"
              >
                <HiOutlineArrowLeftOnRectangle className="w-5 h-5" />
                {t('nav.logout')}
              </button>
            </>
          ) : (
            <Link to="/admin/login" className="flex items-center gap-1.5 hover:text-emerald-200 transition-colors">
              <HiOutlineArrowRightOnRectangle className="w-5 h-5" />
              {t('nav.admin')}
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
