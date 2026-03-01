import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { HiOutlineBookOpen, HiOutlineCheckCircle, HiOutlineCalendar, HiOutlineArrowPath, HiOutlineClipboardDocumentList } from 'react-icons/hi2';
import { useAuth } from '../../context/AuthContext';
import { getStats, getLocations } from '../../services/api';

export default function Dashboard() {
  const { t } = useTranslation();
  const { admin, isSuperAdmin } = useAuth();
  const [stats, setStats] = useState(null);
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState('');

  useEffect(() => {
    if (isSuperAdmin) {
      getLocations().then((res) => setLocations(res.data));
    }
  }, [isSuperAdmin]);

  useEffect(() => {
    const params = {};
    if (isSuperAdmin && selectedLocation) {
      params.locationId = selectedLocation;
    } else if (!isSuperAdmin && admin?.location?._id) {
      params.locationId = admin.location._id;
    }
    getStats(params).then((res) => setStats(res.data));
  }, [selectedLocation, admin, isSuperAdmin]);

  if (!stats) {
    return <div className="p-6 text-gray-500">Loading...</div>;
  }

  const cards = [
    { label: t('admin.totalBooks'), value: stats.totalBooks, color: 'bg-blue-500', icon: HiOutlineBookOpen },
    { label: t('admin.availableBooks'), value: stats.availableBooks, color: 'bg-green-500', icon: HiOutlineCheckCircle },
    { label: t('admin.reservedBooks'), value: stats.reservedBooks, color: 'bg-orange-500', icon: HiOutlineCalendar },
    { label: t('admin.borrowedBooks'), value: stats.borrowedBooks, color: 'bg-red-500', icon: HiOutlineArrowPath },
    { label: t('admin.totalReservations'), value: stats.totalReservations, color: 'bg-purple-500', icon: HiOutlineClipboardDocumentList },
  ];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-800">{t('admin.dashboard')}</h1>
        {isSuperAdmin && locations.length > 0 && (
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            aria-label={t('books.allLocations')}
          >
            <option value="">{t('books.allLocations')}</option>
            {locations.map((loc) => (
              <option key={loc._id} value={loc._id}>{loc.name}</option>
            ))}
          </select>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white rounded-xl shadow p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-gray-500 text-sm">{card.label}</p>
                <div className={`${card.color} w-10 h-10 rounded-lg flex items-center justify-center`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
              </div>
              <span className="text-3xl font-bold text-gray-800">{card.value}</span>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl shadow p-5 mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          {t('admin.booksPerCategory')}
        </h2>
        <div className="space-y-3">
          {stats.booksPerCategory.map((cat) => (
            <div key={cat.name} className="flex items-center gap-3">
              <span className="text-gray-600 w-32">{cat.name}</span>
              <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full flex items-center justify-end px-2"
                  style={{
                    width: `${stats.totalBooks ? (cat.count / stats.totalBooks) * 100 : 0}%`,
                    minWidth: cat.count > 0 ? '2rem' : '0',
                  }}
                >
                  <span className="text-white text-xs font-medium">{cat.count}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Borrowed Books with Return Dates */}
      <div className="bg-white rounded-xl shadow p-5">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-800 mb-4">
          <HiOutlineArrowPath className="w-5 h-5 text-red-500" />
          {t('admin.borrowedBooksSection')}
        </h2>
        {(!stats.borrowedReservations || stats.borrowedReservations.length === 0) ? (
          <p className="text-gray-400 text-sm">{t('admin.noBorrowedBooks')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-start font-medium text-gray-600">{t('admin.bookTitleCol')}</th>
                  <th className="px-4 py-3 text-start font-medium text-gray-600">{t('admin.borrowerCol')}</th>
                  <th className="px-4 py-3 text-start font-medium text-gray-600">{t('admin.returnDateCol')}</th>
                  <th className="px-4 py-3 text-start font-medium text-gray-600">{t('admin.statusCol')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stats.borrowedReservations.map((r) => {
                  const today = new Date().toISOString().split('T')[0];
                  const tomorrow = new Date();
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  const tomorrowStr = tomorrow.toISOString().split('T')[0];

                  let badgeClass = 'bg-green-100 text-green-800';
                  let badgeText = t('admin.onTrack');
                  if (r.returnDate && r.returnDate < today) {
                    badgeClass = 'bg-red-100 text-red-800';
                    badgeText = t('admin.overdue');
                  } else if (r.returnDate && r.returnDate <= tomorrowStr) {
                    badgeClass = 'bg-orange-100 text-orange-800';
                    badgeText = t('admin.dueSoon');
                  }

                  return (
                    <tr key={r._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-800">{r.bookId?.title || '-'}</td>
                      <td className="px-4 py-3 text-gray-700">{r.name}</td>
                      <td className="px-4 py-3 text-gray-700">{r.returnDate || '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${badgeClass}`}>
                          {badgeText}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
