import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  HiOutlineHome,
  HiOutlineShieldCheck,
  HiOutlineArrowRightOnRectangle,
  HiOutlineArrowLeftOnRectangle,
  HiOutlineInformationCircle,
  HiOutlineQuestionMarkCircle,
  HiOutlineBars3,
  HiOutlineXMark,
} from 'react-icons/hi2';
import { useAuth } from '../context/AuthContext';
import LanguageSwitcher from './LanguageSwitcher';

export default function Navbar() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { admin, logoutAdmin } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);

  // Close mobile menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // Smart show/hide on scroll
  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      if (currentY <= 10) {
        setVisible(true);
      } else if (currentY > lastScrollY.current) {
        setVisible(false);
        setMenuOpen(false);
      } else {
        setVisible(true);
      }
      lastScrollY.current = currentY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logoutAdmin();
    navigate('/');
  };

  const navLinks = (
    <>
      <Link to="/" className="flex items-center gap-1.5 hover:text-emerald-200 transition-colors">
        <HiOutlineHome className="w-5 h-5" />
        {t('nav.home')}
      </Link>
      <Link to="/about" className="flex items-center gap-1.5 hover:text-emerald-200 transition-colors">
        <HiOutlineInformationCircle className="w-5 h-5" />
        {t('nav.about')}
      </Link>
      <Link to="/how-it-works" className="flex items-center gap-1.5 hover:text-emerald-200 transition-colors">
        <HiOutlineQuestionMarkCircle className="w-5 h-5" />
        {t('nav.howItWorks')}
      </Link>
      {admin ? (
        <>
          <Link to="/admin" className="flex items-center gap-1.5 hover:text-emerald-200 transition-colors">
            <HiOutlineShieldCheck className="w-5 h-5" />
            {t('nav.dashboard')}
          </Link>
          <span className="text-emerald-200 text-sm">
            {admin.fullName || admin.username}
          </span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 hover:text-emerald-200 transition-colors cursor-pointer"
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
    </>
  );

  return (
    <nav
      className={`bg-emerald-700 text-white shadow-lg sticky top-0 z-30 transition-transform duration-300 ${
        visible ? 'translate-y-0' : '-translate-y-full'
      }`}
      aria-label="Main navigation"
    >
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:start-2 focus:z-50 focus:bg-white focus:text-emerald-700 focus:px-4 focus:py-2 focus:rounded-lg focus:font-semibold"
      >
        Skip to content
      </a>
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-xl font-bold hover:text-emerald-200 transition-colors">
          <img src="/logo.svg" alt="" className="w-8 h-8" />
          <span className="hidden md:inline">{t('app.title')}</span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-3">
          <LanguageSwitcher />
          {navLinks}
        </div>

        {/* Mobile controls */}
        <div className="flex items-center gap-2 md:hidden">
          <LanguageSwitcher />
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1 hover:text-emerald-200 transition-colors cursor-pointer"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={t('nav.menu')}
          >
            {menuOpen ? (
              <HiOutlineXMark className="w-6 h-6" />
            ) : (
              <HiOutlineBars3 className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div
          id="mobile-menu"
          className="md:hidden border-t border-emerald-600 px-4 py-3 flex flex-col gap-3"
        >
          {navLinks}
        </div>
      )}
    </nav>
  );
}
