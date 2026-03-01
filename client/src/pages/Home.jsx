import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { HiOutlineMagnifyingGlass, HiOutlineFunnel, HiOutlineXMark } from 'react-icons/hi2';
import { getBooks, getCategories, getLocations } from '../services/api';
import BookCard from '../components/BookCard';

export default function Home() {
  const { t } = useTranslation();
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    getCategories().then((res) => setCategories(res.data));
    getLocations().then((res) => setLocations(res.data));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (search) params.search = search;
    if (category) params.category = category;
    if (status) params.status = status;
    if (location) params.location = location;

    getBooks(params)
      .then((res) => setBooks(res.data))
      .finally(() => setLoading(false));
  }, [search, category, status, location]);

  const activeFilterCount = [category, status, location].filter(Boolean).length;

  const clearFilters = () => {
    setCategory('');
    setStatus('');
    setLocation('');
  };

  const filterSelects = (
    <>
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
        aria-label={t('books.allCategories')}
      >
        <option value="">{t('books.allCategories')}</option>
        {categories.map((cat) => (
          <option key={cat._id} value={cat._id}>
            {cat.name}
          </option>
        ))}
      </select>
      {locations.length > 1 && (
        <select
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
          aria-label={t('books.allLocations')}
        >
          <option value="">{t('books.allLocations')}</option>
          {locations.map((loc) => (
            <option key={loc._id} value={loc._id}>
              {loc.name}
            </option>
          ))}
        </select>
      )}
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
        aria-label={t('books.allStatuses')}
      >
        <option value="">{t('books.allStatuses')}</option>
        <option value="available">{t('books.available')}</option>
        <option value="reserved">{t('books.reserved')}</option>
        <option value="borrowed">{t('books.borrowed')}</option>
      </select>
    </>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">{t('app.title')}</h1>
        <p className="text-gray-500">{t('app.subtitle')}</p>
      </div>

      {/* Filters — Desktop: inline row, Mobile: search + filter button */}
      <div className="mb-8">
        {/* Search bar + filter trigger (mobile) */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <HiOutlineMagnifyingGlass className="absolute top-1/2 -translate-y-1/2 start-3 w-5 h-5 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder={t('books.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full ps-10 pe-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              aria-label={t('books.searchPlaceholder')}
            />
          </div>

          {/* Filter trigger button — mobile only */}
          <button
            onClick={() => setFilterOpen(true)}
            className="relative md:hidden flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
            aria-label={t('books.filters')}
            aria-expanded={filterOpen}
            aria-controls="filter-drawer"
          >
            <HiOutlineFunnel className="w-5 h-5 text-gray-600" />
            <span className="text-sm text-gray-600">{t('books.filters')}</span>
            {activeFilterCount > 0 && (
              <span className="absolute -top-1.5 -end-1.5 w-5 h-5 bg-emerald-600 text-white text-xs rounded-full flex items-center justify-center font-semibold">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Desktop inline filters — hidden on mobile */}
        <div className="hidden md:flex gap-3 mt-3">
          {filterSelects}
          {activeFilterCount > 0 && (
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-sm text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
            >
              {t('books.clearFilters')}
            </button>
          )}
        </div>
      </div>

      {/* Mobile filter drawer — backdrop + bottom sheet */}
      {filterOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 cursor-pointer"
            onClick={() => setFilterOpen(false)}
            aria-hidden="true"
          />

          {/* Bottom sheet */}
          <div
            id="filter-drawer"
            role="dialog"
            aria-label={t('books.filters')}
            className="absolute bottom-0 inset-x-0 bg-white rounded-t-2xl shadow-2xl p-5 animate-slide-up"
          >
            {/* Handle bar */}
            <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-4" />

            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-800">{t('books.filters')}</h2>
              <button
                onClick={() => setFilterOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                aria-label={t('books.close')}
              >
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            </div>

            {/* Filter selects */}
            <div className="flex flex-col gap-3">
              {filterSelects}
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-5">
              {activeFilterCount > 0 && (
                <button
                  onClick={() => { clearFilters(); setFilterOpen(false); }}
                  className="flex-1 py-2.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer text-sm font-medium"
                >
                  {t('books.clearFilters')}
                </button>
              )}
              <button
                onClick={() => setFilterOpen(false)}
                className="flex-1 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors cursor-pointer text-sm font-medium"
              >
                {t('books.close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Books Grid */}
      {loading ? (
        <div className="text-center py-12 text-gray-500" role="status" aria-live="polite">Loading...</div>
      ) : books.length === 0 ? (
        <div className="text-center py-12 text-gray-500" role="status" aria-live="polite">{t('books.noBooks')}</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {books.map((book) => (
            <BookCard key={book._id} book={book} />
          ))}
        </div>
      )}
    </div>
  );
}
