import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  HiOutlineClock,
  HiOutlineArrowPath,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineXMark,
  HiOutlineBellAlert,
  HiOutlineCalendarDays,
  HiOutlineMagnifyingGlass,
} from 'react-icons/hi2';
import { useAuth } from '../../context/AuthContext';
import { getReservations, updateReservation, sendReminder, extendReservation, getLocations } from '../../services/api';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  collected: 'bg-orange-100 text-orange-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const statusIcons = {
  pending: HiOutlineClock,
  collected: HiOutlineArrowPath,
  completed: HiOutlineCheckCircle,
  cancelled: HiOutlineXCircle,
};

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

function getNextWeekday(weekday, fromDate) {
  const d = new Date(fromDate);
  d.setDate(d.getDate() + 7);
  const diff = (weekday - d.getDay() + 7) % 7;
  d.setDate(d.getDate() + diff);
  return d.toISOString().split('T')[0];
}

function getReturnDateBadgeClass(returnDate) {
  if (!returnDate) return '';
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  if (returnDate < today) return 'text-red-600 font-semibold';
  if (returnDate <= tomorrowStr) return 'text-orange-600 font-semibold';
  return 'text-gray-700';
}

export default function ManageReservations() {
  const { t } = useTranslation();
  const { admin, isSuperAdmin } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [locations, setLocations] = useState([]);
  const [sendingId, setSendingId] = useState(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterLocation, setFilterLocation] = useState('');

  // Collect modal state
  const [collectModal, setCollectModal] = useState(null);
  const [collectMode, setCollectMode] = useState('week');
  const [collectSpecificDate, setCollectSpecificDate] = useState('');
  const [collectWeekday, setCollectWeekday] = useState(new Date().getDay());
  const [collectSaving, setCollectSaving] = useState(false);

  // Extend modal state
  const [extendModal, setExtendModal] = useState(null);
  const [extendMode, setExtendMode] = useState('week');
  const [extendSpecificDate, setExtendSpecificDate] = useState('');
  const [extendWeekday, setExtendWeekday] = useState(new Date().getDay());
  const [extendSaving, setExtendSaving] = useState(false);

  const dayNames = [
    t('settings.sunday'),
    t('settings.monday'),
    t('settings.tuesday'),
    t('settings.wednesday'),
    t('settings.thursday'),
    t('settings.friday'),
    t('settings.saturday'),
  ];

  const loadReservations = () => {
    const params = {};
    if (!isSuperAdmin && admin?.location?._id) {
      params.locationId = admin.location._id;
    }
    if (search) params.search = search;
    if (filterStatus) params.status = filterStatus;
    if (filterLocation && isSuperAdmin) params.locationId = filterLocation;
    getReservations(params).then((res) => setReservations(res.data));
  };

  useEffect(() => {
    loadReservations();
    if (isSuperAdmin) {
      getLocations().then((res) => setLocations(res.data));
    }
  }, []);

  useEffect(() => {
    loadReservations();
  }, [search, filterStatus, filterLocation]);

  const handleStatusChange = async (id, status, returnDate) => {
    await updateReservation(id, { status, returnDate });
    loadReservations();
  };

  const handleSendReminder = async (id) => {
    setSendingId(id);
    try {
      await sendReminder(id);
      alert(t('admin.reminderSuccess'));
      loadReservations();
    } catch (err) {
      alert(err.response?.data?.message || t('admin.reminderFailed'));
    } finally {
      setSendingId(null);
    }
  };

  // --- Collect modal helpers ---
  const openCollectModal = (id) => {
    setCollectModal(id);
    setCollectMode('week');
    setCollectSpecificDate('');
    setCollectWeekday(new Date().getDay());
  };

  const getCollectReturnDate = () => {
    if (collectMode === 'specific') return collectSpecificDate;
    return getNextWeekday(collectWeekday, new Date().toISOString().split('T')[0]);
  };

  const handleCollectConfirm = async () => {
    const returnDate = getCollectReturnDate();
    if (!returnDate) return;
    setCollectSaving(true);
    try {
      await handleStatusChange(collectModal, 'collected', returnDate);
      setCollectModal(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Error');
    } finally {
      setCollectSaving(false);
    }
  };

  // --- Extend modal helpers ---
  const openExtendModal = (reservation) => {
    setExtendModal(reservation);
    setExtendMode('week');
    setExtendSpecificDate('');
    setExtendWeekday(new Date().getDay());
  };

  const getExtendReturnDate = () => {
    if (extendMode === 'specific') return extendSpecificDate;
    return getNextWeekday(extendWeekday, extendModal?.returnDate || new Date().toISOString().split('T')[0]);
  };

  const handleExtendConfirm = async () => {
    const returnDate = getExtendReturnDate();
    if (!returnDate) return;
    setExtendSaving(true);
    try {
      await extendReservation(extendModal._id, { returnDate });
      loadReservations();
      setExtendModal(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Error');
    } finally {
      setExtendSaving(false);
    }
  };

  // Escape key to close modals
  const handleEscapeKey = useCallback((e) => {
    if (e.key === 'Escape') {
      if (collectModal) setCollectModal(null);
      if (extendModal) setExtendModal(null);
    }
  }, [collectModal, extendModal]);

  useEffect(() => {
    if (collectModal || extendModal) {
      document.addEventListener('keydown', handleEscapeKey);
      return () => document.removeEventListener('keydown', handleEscapeKey);
    }
  }, [collectModal, extendModal, handleEscapeKey]);

  const tomorrowStr = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  })();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">{t('admin.manageReservations')}</h1>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 mb-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[180px]">
            <HiOutlineMagnifyingGlass className="absolute top-1/2 -translate-y-1/2 start-3 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
            <input
              type="text"
              placeholder={t('admin.searchReservations')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full ps-9 pe-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-gray-100"
              aria-label={t('admin.searchReservations')}
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-gray-100"
            aria-label={t('admin.allStatuses')}
          >
            <option value="">{t('admin.allStatuses')}</option>
            <option value="pending">{t('admin.pending')}</option>
            <option value="collected">{t('admin.collected')}</option>
            <option value="overdue">{t('admin.overdue')}</option>
            <option value="completed">{t('admin.completed')}</option>
            <option value="cancelled">{t('admin.cancelled')}</option>
          </select>
          {isSuperAdmin && (
            <select
              value={filterLocation}
              onChange={(e) => setFilterLocation(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-gray-100"
              aria-label={t('books.allLocations')}
            >
              <option value="">{t('books.allLocations')}</option>
              {locations.map((loc) => (
                <option key={loc._id} value={loc._id}>{loc.name}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {reservations.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-8 text-center text-gray-500 dark:text-gray-400">
          {t('admin.noReservations')}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-start font-medium text-gray-600 dark:text-gray-300">{t('admin.bookTitleCol')}</th>
                <th className="px-4 py-3 text-start font-medium text-gray-600 dark:text-gray-300">{t('admin.categoryCol')}</th>
                <th className="px-4 py-3 text-start font-medium text-gray-600 dark:text-gray-300">{t('admin.nameCol')}</th>
                <th className="px-4 py-3 text-start font-medium text-gray-600 dark:text-gray-300">{t('admin.emailCol')}</th>
                <th className="px-4 py-3 text-start font-medium text-gray-600 dark:text-gray-300">{t('admin.phoneCol')}</th>
                <th className="px-4 py-3 text-start font-medium text-gray-600 dark:text-gray-300">{t('admin.codeCol')}</th>
                <th className="px-4 py-3 text-start font-medium text-gray-600 dark:text-gray-300">{t('admin.dateCol')}</th>
                <th className="px-4 py-3 text-start font-medium text-gray-600 dark:text-gray-300">{t('admin.timeCol')}</th>
                <th className="px-4 py-3 text-start font-medium text-gray-600 dark:text-gray-300">{t('admin.returnDateCol')}</th>
                <th className="px-4 py-3 text-start font-medium text-gray-600 dark:text-gray-300">{t('admin.statusCol')}</th>
                <th className="px-4 py-3 text-start font-medium text-gray-600 dark:text-gray-300">{t('admin.actionsCol')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {reservations.map((r) => {
                const StatusIcon = statusIcons[r.status];
                const todayDate = new Date().toISOString().split('T')[0];
                const isOverdue = r.status === 'collected' && r.returnDate && r.returnDate < todayDate;
                const daysOverdue = isOverdue ? Math.floor((new Date(todayDate) - new Date(r.returnDate)) / (1000 * 60 * 60 * 24)) : 0;
                return (
                  <tr key={r._id} className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${isOverdue ? 'bg-red-50/50 dark:bg-red-900/20' : ''}`}>
                    <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-100">
                      {r.bookId?.title || '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      {r.bookId?.category?.name || '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{r.name}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{r.email}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{r.phone || '-'}</td>
                    <td className="px-4 py-3">
                      {r.confirmationCode ? (
                        <span className="font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400 tracking-wider">{r.confirmationCode}</span>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{r.date}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{r.time}</td>
                    <td className={`px-4 py-3 ${getReturnDateBadgeClass(r.returnDate)}`}>
                      {r.returnDate || '-'}
                      {isOverdue && (
                        <span className="block text-xs text-red-600 font-semibold mt-0.5">
                          {daysOverdue} {t('reports.days')} {t('admin.overdue').toLowerCase()}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <span className={`flex items-center gap-1 w-fit px-2 py-1 rounded-full text-xs font-medium ${statusColors[r.status]}`}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {t(`admin.${r.status}`)}
                        </span>
                        {isOverdue && (
                          <span className="flex items-center gap-1 w-fit px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">
                            {t('admin.overdue')}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 flex-wrap">
                        {r.status === 'pending' && (
                          <>
                            <button
                              onClick={() => openCollectModal(r._id)}
                              className="flex items-center gap-1 bg-orange-100 text-orange-700 px-3 py-1 rounded text-xs hover:bg-orange-200 transition-colors"
                            >
                              <HiOutlineArrowPath className="w-3.5 h-3.5" />
                              {t('admin.markCollected')}
                            </button>
                            <button
                              onClick={() => handleStatusChange(r._id, 'cancelled')}
                              className="flex items-center gap-1 bg-red-100 text-red-700 px-3 py-1 rounded text-xs hover:bg-red-200 transition-colors"
                            >
                              <HiOutlineXCircle className="w-3.5 h-3.5" />
                              {t('admin.markCancelled')}
                            </button>
                          </>
                        )}

                        {r.status === 'collected' && (
                          <>
                            <button
                              onClick={() => handleStatusChange(r._id, 'completed')}
                              className="flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded text-xs hover:bg-green-200 transition-colors"
                            >
                              <HiOutlineCheckCircle className="w-3.5 h-3.5" />
                              {t('admin.markReturned')}
                            </button>
                            <button
                              onClick={() => openExtendModal(r)}
                              className="flex items-center gap-1 bg-purple-100 text-purple-700 px-3 py-1 rounded text-xs hover:bg-purple-200 transition-colors"
                            >
                              <HiOutlineCalendarDays className="w-3.5 h-3.5" />
                              {t('admin.extend')}
                            </button>
                          </>
                        )}

                        {['pending', 'collected'].includes(r.status) && (
                          <button
                            onClick={() => handleSendReminder(r._id)}
                            disabled={sendingId === r._id}
                            className="flex items-center gap-1 bg-blue-100 text-blue-700 px-3 py-1 rounded text-xs hover:bg-blue-200 transition-colors disabled:opacity-50"
                          >
                            <HiOutlineBellAlert className="w-3.5 h-3.5" />
                            {sendingId === r._id
                              ? t('admin.sending')
                              : t('admin.sendReminder')}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Collect Modal — Set Return Date */}
      {collectModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 cursor-pointer" onClick={() => setCollectModal(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6 cursor-default" role="dialog" aria-modal="true" aria-labelledby="collect-modal-title" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 id="collect-modal-title" className="text-lg font-semibold text-gray-800 dark:text-gray-100">{t('admin.setReturnDate')}</h3>
              <button onClick={() => setCollectModal(null)} className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 cursor-pointer" aria-label={t('books.close')}>
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            </div>

            {/* Mode Tabs */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setCollectMode('week')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  collectMode === 'week'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {t('admin.weekSystem')}
              </button>
              <button
                onClick={() => setCollectMode('specific')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  collectMode === 'specific'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {t('admin.specificDate')}
              </button>
            </div>

            {collectMode === 'week' ? (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{t('admin.returnDay')}</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {ALL_DAYS.map((day) => (
                    <button
                      key={day}
                      onClick={() => setCollectWeekday(day)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                        collectWeekday === day
                          ? 'bg-emerald-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {dayNames[day]}
                    </button>
                  ))}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('admin.returnDate')}: <span className="font-medium text-gray-800 dark:text-gray-100">{getCollectReturnDate()}</span>
                </p>
              </div>
            ) : (
              <div>
                <input
                  type="date"
                  min={tomorrowStr}
                  value={collectSpecificDate}
                  onChange={(e) => setCollectSpecificDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
            )}

            <div className="flex gap-3 mt-5">
              <button
                onClick={handleCollectConfirm}
                disabled={collectSaving || (collectMode === 'specific' && !collectSpecificDate)}
                className="flex-1 bg-emerald-600 text-white py-2 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 text-sm font-medium"
              >
                {collectSaving ? t('admin.saving') : t('admin.confirm')}
              </button>
              <button
                onClick={() => setCollectModal(null)}
                className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
              >
                {t('admin.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Extend Modal */}
      {extendModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 cursor-pointer" onClick={() => setExtendModal(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6 cursor-default" role="dialog" aria-modal="true" aria-labelledby="extend-modal-title" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 id="extend-modal-title" className="text-lg font-semibold text-gray-800 dark:text-gray-100">{t('admin.extendReturn')}</h3>
              <button onClick={() => setExtendModal(null)} className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 cursor-pointer" aria-label={t('books.close')}>
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {t('admin.returnDate')}: <span className="font-medium text-gray-800 dark:text-gray-100">{extendModal.returnDate}</span>
            </p>

            {/* Mode Tabs */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setExtendMode('week')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  extendMode === 'week'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {t('admin.weekSystem')}
              </button>
              <button
                onClick={() => setExtendMode('specific')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  extendMode === 'specific'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {t('admin.specificDate')}
              </button>
            </div>

            {extendMode === 'week' ? (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{t('admin.returnDay')}</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {ALL_DAYS.map((day) => (
                    <button
                      key={day}
                      onClick={() => setExtendWeekday(day)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                        extendWeekday === day
                          ? 'bg-emerald-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {dayNames[day]}
                    </button>
                  ))}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('admin.returnDate')}: <span className="font-medium text-gray-800 dark:text-gray-100">{getExtendReturnDate()}</span>
                </p>
              </div>
            ) : (
              <div>
                <input
                  type="date"
                  min={tomorrowStr}
                  value={extendSpecificDate}
                  onChange={(e) => setExtendSpecificDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
            )}

            <div className="flex gap-3 mt-5">
              <button
                onClick={handleExtendConfirm}
                disabled={extendSaving || (extendMode === 'specific' && !extendSpecificDate)}
                className="flex-1 bg-emerald-600 text-white py-2 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 text-sm font-medium"
              >
                {extendSaving ? t('admin.saving') : t('admin.confirm')}
              </button>
              <button
                onClick={() => setExtendModal(null)}
                className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
              >
                {t('admin.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
