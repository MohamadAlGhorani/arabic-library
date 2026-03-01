import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import {
  HiOutlineChartBarSquare,
  HiOutlineBookOpen,
  HiOutlineTag,
  HiOutlineCalendarDays,
  HiOutlineCog6Tooth,
  HiOutlineBuildingStorefront,
  HiOutlineUsers,
  HiOutlineDocumentText,
  HiOutlineXMark,
} from 'react-icons/hi2';

export default function AdminSidebar({ isOpen, onClose }) {
  const { t } = useTranslation();
  const { isSuperAdmin } = useAuth();

  const links = [
    { to: '/admin', label: t('nav.dashboard'), end: true, icon: HiOutlineChartBarSquare },
    { to: '/admin/books', label: t('nav.books'), icon: HiOutlineBookOpen },
    { to: '/admin/reservations', label: t('nav.reservations'), icon: HiOutlineCalendarDays },
    { to: '/admin/settings', label: t('nav.settings'), icon: HiOutlineCog6Tooth },
  ];

  if (isSuperAdmin) {
    links.push(
      { to: '/admin/categories', label: t('nav.categories'), icon: HiOutlineTag },
      { to: '/admin/locations', label: t('nav.locations'), icon: HiOutlineBuildingStorefront },
      { to: '/admin/admins', label: t('nav.admins'), icon: HiOutlineUsers },
      { to: '/admin/content', label: t('nav.content'), icon: HiOutlineDocumentText },
    );
  }

  const navContent = (
    <nav className="flex flex-col gap-1" aria-label="Admin navigation">
      {links.map((link) => {
        const Icon = link.icon;
        return (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded transition-colors ${
                isActive ? 'bg-emerald-600 text-white' : 'text-gray-300 hover:bg-gray-700'
              }`
            }
          >
            <Icon className="w-5 h-5 shrink-0" />
            {link.label}
          </NavLink>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden cursor-pointer"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Desktop sidebar (always visible on md+) */}
      <aside
        className="hidden md:block w-56 bg-gray-800 text-white min-h-[calc(100vh-56px)] p-4 shrink-0"
        aria-label="Sidebar"
      >
        {navContent}
      </aside>

      {/* Mobile drawer (overlay, only when open) */}
      {isOpen && (
        <aside
          className="fixed inset-y-0 start-0 z-50 w-64 bg-gray-800 text-white p-4 md:hidden"
          aria-label="Sidebar"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-lg font-semibold">{t('nav.menu')}</span>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors cursor-pointer"
              aria-label={t('books.close')}
            >
              <HiOutlineXMark className="w-5 h-5" />
            </button>
          </div>
          {navContent}
        </aside>
      )}
    </>
  );
}
