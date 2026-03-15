import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HiOutlineCheckCircle, HiOutlineClock, HiOutlineBookOpen, HiOutlineBuildingStorefront, HiOutlineCalendarDays } from 'react-icons/hi2';
import BookDetailModal from './BookDetailModal';

const statusColors = {
  available: 'bg-green-500',
  reserved: 'bg-orange-500',
  borrowed: 'bg-red-500',
};

const statusIcons = {
  available: HiOutlineCheckCircle,
  reserved: HiOutlineClock,
  borrowed: HiOutlineBookOpen,
};

export default function BookCard({ book }) {
  const { t } = useTranslation();
  const [showDetail, setShowDetail] = useState(false);

  const statusLabel = t(`books.${book.status}`);
  const categoryName = book.category?.name || '';
  const locationName = book.location?.name || '';
  const StatusIcon = statusIcons[book.status];

  const handleCardKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setShowDetail(true);
    }
  };

  return (
    <>
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow flex flex-col cursor-pointer"
        onClick={() => setShowDetail(true)}
        onKeyDown={handleCardKeyDown}
        role="button"
        tabIndex={0}
        aria-label={book.title}
      >
        <div className="h-48 bg-gray-100 dark:bg-gray-700 overflow-hidden">
          {book.image ? (
            <img
              src={book.image}
              alt={book.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-gray-500">
              <HiOutlineBookOpen className="w-12 h-12" />
            </div>
          )}
        </div>
        <div className="p-4 flex flex-col flex-1">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100 line-clamp-1">{book.title}</h3>
            <span
              className={`${statusColors[book.status]} text-white text-xs px-2 py-1 rounded-full whitespace-nowrap flex items-center gap-1`}
            >
              <StatusIcon className="w-3.5 h-3.5" />
              {statusLabel}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {categoryName && (
              <span className="text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">
                {categoryName}
              </span>
            )}
            {locationName && (
              <span className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                <HiOutlineBuildingStorefront className="w-3 h-3" />
                {locationName}
              </span>
            )}
          </div>
          <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-2 flex-1">{book.description}</p>
          {book.status === 'borrowed' && book.returnDate && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-2.5 py-1.5 rounded-lg">
              <HiOutlineCalendarDays className="w-4 h-4 shrink-0" />
              <span>{t('books.availableFrom')}: {new Date(book.returnDate).toLocaleDateString()}</span>
            </div>
          )}
          {book.status === 'reserved' && book.pickupDate && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30 px-2.5 py-1.5 rounded-lg">
              <HiOutlineCalendarDays className="w-4 h-4 shrink-0" />
              <span>{t('books.pickupOn')}: {new Date(book.pickupDate).toLocaleDateString()}</span>
            </div>
          )}
          {book.status === 'available' && (
            <Link
              to={`/reserve/${book._id}`}
              className="mt-3 block text-center bg-emerald-600 text-white py-2 rounded-lg hover:bg-emerald-700 transition-colors"
              onClick={(e) => e.stopPropagation()}
              aria-label={`${t('books.reserve')}: ${book.title}`}
            >
              {t('books.reserve')}
            </Link>
          )}
        </div>
      </div>
      {showDetail && (
        <BookDetailModal book={book} onClose={() => setShowDetail(false)} />
      )}
    </>
  );
}
