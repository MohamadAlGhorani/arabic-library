import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { HiOutlineArrowDownTray, HiOutlineExclamationTriangle } from 'react-icons/hi2';
import { useAuth } from '../../context/AuthContext';
import { getReports, getLocations } from '../../services/api';
import { exportToCsv } from '../../utils/exportCsv';

export default function Reports() {
  const { t } = useTranslation();
  const { admin, isSuperAdmin } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [preset, setPreset] = useState('month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    if (isSuperAdmin) {
      getLocations().then((res) => setLocations(res.data));
    }
  }, [isSuperAdmin]);

  // Calculate date range from preset
  useEffect(() => {
    const now = new Date();
    let start = '';
    let end = now.toISOString().split('T')[0];

    if (preset === 'week') {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      start = d.toISOString().split('T')[0];
    } else if (preset === 'month') {
      const d = new Date(now);
      d.setMonth(d.getMonth() - 1);
      start = d.toISOString().split('T')[0];
    } else if (preset === '3months') {
      const d = new Date(now);
      d.setMonth(d.getMonth() - 3);
      start = d.toISOString().split('T')[0];
    }
    // 'custom' — don't override

    if (preset !== 'custom') {
      setStartDate(start);
      setEndDate(end);
    }
  }, [preset]);

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (isSuperAdmin && selectedLocation) {
      params.locationId = selectedLocation;
    } else if (!isSuperAdmin && admin?.location?._id) {
      params.locationId = admin.location._id;
    }
    getReports(params)
      .then((res) => setData(res.data))
      .finally(() => setLoading(false));
  }, [startDate, endDate, selectedLocation, admin, isSuperAdmin]);

  const statusColors = {
    pending: 'bg-orange-100 text-orange-800',
    collected: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{t('reports.title')}</h1>
        {isSuperAdmin && locations.length > 0 && (
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
            aria-label={t('books.allLocations')}
          >
            <option value="">{t('books.allLocations')}</option>
            {locations.map((loc) => (
              <option key={loc._id} value={loc._id}>{loc.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Date Range Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{t('reports.dateRange')}:</span>
          {['week', 'month', '3months', 'custom'].map((p) => (
            <button
              key={p}
              onClick={() => setPreset(p)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer transition-colors ${
                preset === p
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {t(`reports.${p === '3months' ? 'last3Months' : p === 'week' ? 'thisWeek' : p === 'month' ? 'thisMonth' : 'custom'}`)}
            </button>
          ))}
          {preset === 'custom' && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                aria-label={t('reports.startDate')}
              />
              <span className="text-gray-400 dark:text-gray-500">-</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                aria-label={t('reports.endDate')}
              />
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-gray-500 dark:text-gray-400" aria-live="polite" role="status">{t('reports.loading')}</div>
      ) : !data ? (
        <div className="text-gray-500 dark:text-gray-400">{t('reports.noData')}</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Status Breakdown */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{t('reports.statusBreakdown')}</h2>
              <ExportButton
                onClick={() =>
                  exportToCsv('status-breakdown.csv', data.statusBreakdown, [
                    { key: 'status', label: t('reports.status') },
                    { key: 'count', label: t('reports.count') },
                  ])
                }
                label={t('reports.exportCsv')}
              />
            </div>
            {data.statusBreakdown.length === 0 ? (
              <p className="text-gray-400 dark:text-gray-500 text-sm">{t('reports.noData')}</p>
            ) : (
              <div className="flex flex-wrap gap-3">
                {data.statusBreakdown.map((s) => (
                  <div key={s.status} className={`px-4 py-3 rounded-lg ${statusColors[s.status] || 'bg-gray-100 text-gray-800'}`}>
                    <div className="text-2xl font-bold">{s.count}</div>
                    <div className="text-sm font-medium capitalize">{t(`reports.statusLabels.${s.status}`, s.status)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Most Borrowed Books */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{t('reports.mostBorrowed')}</h2>
              <ExportButton
                onClick={() =>
                  exportToCsv('most-borrowed.csv', data.mostBorrowed, [
                    { key: 'title', label: t('reports.bookTitle') },
                    { key: 'category', label: t('reports.category') },
                    { key: 'count', label: t('reports.borrowCount') },
                  ])
                }
                label={t('reports.exportCsv')}
              />
            </div>
            {data.mostBorrowed.length === 0 ? (
              <p className="text-gray-400 dark:text-gray-500 text-sm">{t('reports.noData')}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-3 py-2 text-start font-medium text-gray-600 dark:text-gray-300">{t('reports.rank')}</th>
                      <th className="px-3 py-2 text-start font-medium text-gray-600 dark:text-gray-300">{t('reports.bookTitle')}</th>
                      <th className="px-3 py-2 text-start font-medium text-gray-600 dark:text-gray-300">{t('reports.category')}</th>
                      <th className="px-3 py-2 text-start font-medium text-gray-600 dark:text-gray-300">{t('reports.borrowCount')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {data.mostBorrowed.map((b, i) => (
                      <tr key={b.bookId} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-3 py-2 text-gray-500 dark:text-gray-400">{i + 1}</td>
                        <td className="px-3 py-2 font-medium text-gray-800 dark:text-gray-100">{b.title}</td>
                        <td className="px-3 py-2 text-gray-600 dark:text-gray-300">{b.category || '-'}</td>
                        <td className="px-3 py-2 font-semibold text-emerald-600 dark:text-emerald-400">{b.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Category Popularity */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{t('reports.categoryPopularity')}</h2>
              <ExportButton
                onClick={() =>
                  exportToCsv('category-popularity.csv', data.categoryPopularity, [
                    { key: 'category', label: t('reports.category') },
                    { key: 'count', label: t('reports.borrowCount') },
                  ])
                }
                label={t('reports.exportCsv')}
              />
            </div>
            {data.categoryPopularity.length === 0 ? (
              <p className="text-gray-400 dark:text-gray-500 text-sm">{t('reports.noData')}</p>
            ) : (
              <div className="space-y-3">
                {data.categoryPopularity.map((cat) => {
                  const max = data.categoryPopularity[0]?.count || 1;
                  return (
                    <div key={cat.category} className="flex items-center gap-3">
                      <span className="text-gray-600 dark:text-gray-300 w-32 truncate">{cat.category || '-'}</span>
                      <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-6 overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full flex items-center justify-end px-2"
                          style={{
                            width: `${(cat.count / max) * 100}%`,
                            minWidth: cat.count > 0 ? '2rem' : '0',
                          }}
                        >
                          <span className="text-white text-xs font-medium">{cat.count}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Busiest Days */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{t('reports.busiestDays')}</h2>
              <ExportButton
                onClick={() =>
                  exportToCsv('busiest-days.csv', data.busiestDays, [
                    { key: 'date', label: t('reports.date') },
                    { key: 'count', label: t('reports.reservationCount') },
                  ])
                }
                label={t('reports.exportCsv')}
              />
            </div>
            {data.busiestDays.length === 0 ? (
              <p className="text-gray-400 dark:text-gray-500 text-sm">{t('reports.noData')}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-3 py-2 text-start font-medium text-gray-600 dark:text-gray-300">{t('reports.date')}</th>
                      <th className="px-3 py-2 text-start font-medium text-gray-600 dark:text-gray-300">{t('reports.reservationCount')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {data.busiestDays.map((d) => (
                      <tr key={d.date} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-3 py-2 text-gray-800 dark:text-gray-100">{d.date}</td>
                        <td className="px-3 py-2 font-semibold text-emerald-600 dark:text-emerald-400">{d.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Busiest Time Slots */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{t('reports.busiestTimeSlots')}</h2>
              <ExportButton
                onClick={() =>
                  exportToCsv('busiest-timeslots.csv', data.busiestTimeSlots, [
                    { key: 'timeSlot', label: t('reports.timeSlot') },
                    { key: 'count', label: t('reports.reservationCount') },
                  ])
                }
                label={t('reports.exportCsv')}
              />
            </div>
            {data.busiestTimeSlots.length === 0 ? (
              <p className="text-gray-400 dark:text-gray-500 text-sm">{t('reports.noData')}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-3 py-2 text-start font-medium text-gray-600 dark:text-gray-300">{t('reports.timeSlot')}</th>
                      <th className="px-3 py-2 text-start font-medium text-gray-600 dark:text-gray-300">{t('reports.reservationCount')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {data.busiestTimeSlots.map((s) => (
                      <tr key={s.timeSlot} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-3 py-2 text-gray-800 dark:text-gray-100">{s.timeSlot}</td>
                        <td className="px-3 py-2 font-semibold text-emerald-600 dark:text-emerald-400">{s.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Overdue Books */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-800 dark:text-gray-100">
                <HiOutlineExclamationTriangle className="w-5 h-5 text-red-500" />
                {t('reports.overdueBooks')}
              </h2>
              <ExportButton
                onClick={() =>
                  exportToCsv(
                    'overdue-books.csv',
                    data.overdueBooks.map((r) => ({
                      bookTitle: r.bookId?.title || '-',
                      borrower: r.name,
                      email: r.email,
                      returnDate: r.returnDate,
                      daysOverdue: Math.floor(
                        (new Date() - new Date(r.returnDate)) / (1000 * 60 * 60 * 24)
                      ),
                      location: r.location?.name || '-',
                    })),
                    [
                      { key: 'bookTitle', label: t('reports.bookTitle') },
                      { key: 'borrower', label: t('reports.borrower') },
                      { key: 'email', label: t('reports.email') },
                      { key: 'returnDate', label: t('reports.returnDate') },
                      { key: 'daysOverdue', label: t('reports.daysOverdue') },
                      { key: 'location', label: t('reports.location') },
                    ]
                  )
                }
                label={t('reports.exportCsv')}
              />
            </div>
            {data.overdueBooks.length === 0 ? (
              <p className="text-gray-400 dark:text-gray-500 text-sm">{t('reports.noOverdue')}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-3 py-2 text-start font-medium text-gray-600 dark:text-gray-300">{t('reports.bookTitle')}</th>
                      <th className="px-3 py-2 text-start font-medium text-gray-600 dark:text-gray-300">{t('reports.borrower')}</th>
                      <th className="px-3 py-2 text-start font-medium text-gray-600 dark:text-gray-300">{t('reports.returnDate')}</th>
                      <th className="px-3 py-2 text-start font-medium text-gray-600 dark:text-gray-300">{t('reports.daysOverdue')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {data.overdueBooks.map((r) => {
                      const days = Math.floor(
                        (new Date() - new Date(r.returnDate)) / (1000 * 60 * 60 * 24)
                      );
                      return (
                        <tr key={r._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-3 py-2 font-medium text-gray-800 dark:text-gray-100">{r.bookId?.title || '-'}</td>
                          <td className="px-3 py-2 text-gray-700 dark:text-gray-200">{r.name}</td>
                          <td className="px-3 py-2 text-gray-700 dark:text-gray-200">{r.returnDate}</td>
                          <td className="px-3 py-2">
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              {days} {t('reports.days')}
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
      )}
    </div>
  );
}

function ExportButton({ onClick, label }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/30 cursor-pointer transition-colors"
    >
      <HiOutlineArrowDownTray className="w-4 h-4" />
      {label}
    </button>
  );
}
