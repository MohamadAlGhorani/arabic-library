import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { HiOutlineMagnifyingGlass } from 'react-icons/hi2';
import { getAuditLogs, getLocations } from '../../services/api';

export default function AuditLog() {
  const { t } = useTranslation();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [locations, setLocations] = useState([]);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    getLocations().then((res) => setLocations(res.data));
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, actionFilter, entityFilter, locationFilter, startDate, endDate]);

  useEffect(() => {
    loadLogs();
  }, [search, actionFilter, entityFilter, locationFilter, startDate, endDate, page]);

  const loadLogs = () => {
    setLoading(true);
    const params = { page, limit: 25 };
    if (search) params.search = search;
    if (actionFilter) params.action = actionFilter;
    if (entityFilter) params.entityType = entityFilter;
    if (locationFilter) params.locationId = locationFilter;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    getAuditLogs(params)
      .then((res) => {
        setLogs(res.data.logs);
        setTotalPages(res.data.totalPages);
        setTotal(res.data.total);
      })
      .finally(() => setLoading(false));
  };

  const actions = ['create', 'update', 'delete', 'status_change', 'toggle', 'login'];
  const entityTypes = ['book', 'reservation', 'category', 'location', 'admin', 'settings', 'page'];

  const actionBadgeColors = {
    create: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    update: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    delete: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    status_change: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    toggle: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    login: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const from = (page - 1) * 25 + 1;
  const to = Math.min(page * 25, total);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">{t('auditLog.title')}</h1>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 mb-4">
        <div className="flex flex-wrap gap-3">
          {/* Search */}
          <div className="relative min-w-[180px]">
            <HiOutlineMagnifyingGlass className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('auditLog.searchPlaceholder')}
              className="w-full ps-9 pe-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              aria-label={t('auditLog.searchPlaceholder')}
            />
          </div>

          {/* Action Filter */}
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
            aria-label={t('auditLog.action')}
          >
            <option value="">{t('auditLog.allActions')}</option>
            {actions.map((a) => (
              <option key={a} value={a}>{t(`auditLog.actions.${a}`, a)}</option>
            ))}
          </select>

          {/* Entity Type Filter */}
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
            aria-label={t('auditLog.entityType')}
          >
            <option value="">{t('auditLog.allEntities')}</option>
            {entityTypes.map((e) => (
              <option key={e} value={e}>{t(`auditLog.entities.${e}`, e)}</option>
            ))}
          </select>

          {/* Location Filter */}
          {locations.length > 0 && (
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              aria-label={t('books.allLocations')}
            >
              <option value="">{t('books.allLocations')}</option>
              {locations.map((loc) => (
                <option key={loc._id} value={loc._id}>{loc.name}</option>
              ))}
            </select>
          )}

          {/* Date Range */}
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
            aria-label={t('reports.startDate')}
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
            aria-label={t('reports.endDate')}
          />
        </div>
      </div>

      {/* Results */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
        {loading ? (
          <div className="p-6 text-gray-500 dark:text-gray-400" aria-live="polite" role="status">{t('reports.loading')}</div>
        ) : logs.length === 0 ? (
          <div className="p-6 text-gray-400 dark:text-gray-500" aria-live="polite" role="status">{t('auditLog.noLogs')}</div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-start font-medium text-gray-600 dark:text-gray-300">{t('auditLog.dateTime')}</th>
                    <th className="px-4 py-3 text-start font-medium text-gray-600 dark:text-gray-300">{t('auditLog.admin')}</th>
                    <th className="px-4 py-3 text-start font-medium text-gray-600 dark:text-gray-300">{t('auditLog.action')}</th>
                    <th className="px-4 py-3 text-start font-medium text-gray-600 dark:text-gray-300">{t('auditLog.entityType')}</th>
                    <th className="px-4 py-3 text-start font-medium text-gray-600 dark:text-gray-300">{t('auditLog.details')}</th>
                    <th className="px-4 py-3 text-start font-medium text-gray-600 dark:text-gray-300">{t('reports.location')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {logs.map((log) => (
                    <tr key={log._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">{formatDate(log.createdAt)}</td>
                      <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-100">{log.adminName}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${actionBadgeColors[log.action] || 'bg-gray-100 text-gray-800'}`}>
                          {t(`auditLog.actions.${log.action}`, log.action)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300 capitalize">{t(`auditLog.entities.${log.entityType}`, log.entityType)}</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-200 max-w-xs truncate">{log.details}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{log.location?.name || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-700">
              {logs.map((log) => (
                <div key={log._id} className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${actionBadgeColors[log.action] || 'bg-gray-100 text-gray-800'}`}>
                      {t(`auditLog.actions.${log.action}`, log.action)}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{formatDate(log.createdAt)}</span>
                  </div>
                  <p className="text-sm text-gray-800 dark:text-gray-100 font-medium">{log.adminName}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{log.details}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <span className="capitalize">{t(`auditLog.entities.${log.entityType}`, log.entityType)}</span>
                    {log.location?.name && (
                      <>
                        <span>&middot;</span>
                        <span>{log.location.name}</span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-700">
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {t('auditLog.showing', { from, to, total })}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-default cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                {t('auditLog.prev')}
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-default cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                {t('auditLog.next')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
