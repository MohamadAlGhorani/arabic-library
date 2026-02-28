import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HiOutlineChartBarSquare, HiOutlineBookOpen, HiOutlineTag, HiOutlineCalendarDays, HiOutlineCog6Tooth } from 'react-icons/hi2';

export default function AdminSidebar() {
  const { t } = useTranslation();

  const links = [
    { to: '/admin', label: t('nav.dashboard'), end: true, icon: HiOutlineChartBarSquare },
    { to: '/admin/books', label: t('nav.books'), icon: HiOutlineBookOpen },
    { to: '/admin/categories', label: t('nav.categories'), icon: HiOutlineTag },
    { to: '/admin/reservations', label: t('nav.reservations'), icon: HiOutlineCalendarDays },
    { to: '/admin/settings', label: t('nav.settings'), icon: HiOutlineCog6Tooth },
  ];

  return (
    <aside className="w-56 bg-gray-800 text-white min-h-[calc(100vh-56px)] p-4 shrink-0">
      <nav className="flex flex-col gap-1">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
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
    </aside>
  );
}
