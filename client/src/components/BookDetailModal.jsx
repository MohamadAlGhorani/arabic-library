import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  HiOutlineXMark,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineBookOpen,
  HiOutlineBuildingStorefront,
  HiOutlineCalendarDays,
} from 'react-icons/hi2';

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

export default function BookDetailModal({ book, onClose }) {
  const { t } = useTranslation();
  const closeRef = useRef(null);
  const previousFocusRef = useRef(null);
  const dialogRef = useRef(null);

  const statusLabel = t(`books.${book.status}`);
  const categoryName = book.category?.name || '';
  const locationName = book.location?.name || '';
  const StatusIcon = statusIcons[book.status];

  // Lock body scroll, manage focus
  useEffect(() => {
    previousFocusRef.current = document.activeElement;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Auto-focus close button
    closeRef.current?.focus();

    return () => {
      document.body.style.overflow = originalOverflow;
      previousFocusRef.current?.focus();
    };
  }, []);

  // Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      // Focus trap
      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 cursor-pointer"
      onClick={onClose}
      aria-hidden="true"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="book-detail-title"
        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto relative cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          ref={closeRef}
          onClick={onClose}
          className="absolute top-3 end-3 z-10 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 bg-white/80 dark:bg-gray-800/80 rounded-full p-1 transition-colors"
          aria-label={t('books.close')}
        >
          <HiOutlineXMark className="w-6 h-6" />
        </button>

        {/* Image */}
        <div className="h-64 bg-gray-100 dark:bg-gray-700 overflow-hidden rounded-t-xl">
          {book.image ? (
            <img
              src={book.image}
              alt={book.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-gray-500">
              <HiOutlineBookOpen className="w-16 h-16" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Title + Status */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <h2
              id="book-detail-title"
              className="text-xl font-bold text-gray-800 dark:text-gray-100"
            >
              {book.title}
            </h2>
            <span
              className={`${statusColors[book.status]} text-white text-xs px-2.5 py-1 rounded-full whitespace-nowrap flex items-center gap-1 shrink-0`}
            >
              <StatusIcon className="w-3.5 h-3.5" />
              {statusLabel}
            </span>
          </div>

          {/* Category + Location pills */}
          <div className="flex flex-wrap gap-1.5 mb-4">
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

          {/* Full description */}
          <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-4">
            {book.description}
          </p>

          {/* Return date for borrowed books */}
          {book.status === 'borrowed' && book.returnDate && (
            <div className="flex items-center gap-1.5 text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-3 py-2 rounded-lg mb-4">
              <HiOutlineCalendarDays className="w-4 h-4 shrink-0" />
              <span>
                {t('books.availableFrom')}:{' '}
                {new Date(book.returnDate).toLocaleDateString()}
              </span>
            </div>
          )}

          {/* Pickup date for reserved books */}
          {book.status === 'reserved' && book.pickupDate && (
            <div className="flex items-center gap-1.5 text-sm text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30 px-3 py-2 rounded-lg mb-4">
              <HiOutlineCalendarDays className="w-4 h-4 shrink-0" />
              <span>
                {t('books.pickupOn')}:{' '}
                {new Date(book.pickupDate).toLocaleDateString()}
              </span>
            </div>
          )}

          {/* Reserve button */}
          {book.status === 'available' && (
            <Link
              to={`/reserve/${book._id}`}
              className="block text-center bg-emerald-600 text-white py-2.5 rounded-lg hover:bg-emerald-700 transition-colors text-base font-medium"
            >
              {t('books.reserve')}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
