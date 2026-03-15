import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  HiOutlineXMark,
  HiOutlineMapPin,
  HiOutlinePhone,
  HiOutlineBuildingStorefront,
  HiOutlineMap,
  HiOutlineBookOpen,
} from 'react-icons/hi2';

export default function LocationDetailModal({ location, onClose }) {
  const { t } = useTranslation();
  const closeRef = useRef(null);
  const previousFocusRef = useRef(null);
  const dialogRef = useRef(null);

  // Lock body scroll, manage focus
  useEffect(() => {
    previousFocusRef.current = document.activeElement;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    closeRef.current?.focus();

    return () => {
      document.body.style.overflow = originalOverflow;
      previousFocusRef.current?.focus();
    };
  }, []);

  // Escape key + focus trap
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

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

  const hasCoordinates = location.lat != null && location.lng != null;

  const getDirectionsUrl = () => {
    if (hasCoordinates) {
      return `https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lng}`;
    }
    if (location.address) {
      return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(location.address)}`;
    }
    return null;
  };

  const directionsUrl = getDirectionsUrl();

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
        aria-labelledby="location-detail-title"
        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto relative cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          ref={closeRef}
          onClick={onClose}
          className="absolute top-3 end-3 z-10 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 bg-white/80 dark:bg-gray-800/80 rounded-full p-1 transition-colors cursor-pointer"
          aria-label={t('books.close')}
        >
          <HiOutlineXMark className="w-6 h-6" />
        </button>

        {/* Image */}
        <div className="h-56 bg-gray-100 dark:bg-gray-700 overflow-hidden rounded-t-xl">
          {location.image ? (
            <img
              src={location.image}
              alt={location.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-gray-500">
              <HiOutlineBuildingStorefront className="w-16 h-16" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          <h2
            id="location-detail-title"
            className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-3"
          >
            {location.name}
          </h2>

          {location.description && (
            <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-4">
              {location.description}
            </p>
          )}

          <div className="space-y-2 mb-5">
            {location.address && (
              <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                <HiOutlineMapPin className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                <span>{location.address}</span>
              </div>
            )}
            {location.phone && (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <HiOutlinePhone className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <a href={`tel:${location.phone}`} className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                  {location.phone}
                </a>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            {directionsUrl && (
              <a
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium cursor-pointer"
              >
                <HiOutlineMap className="w-4 h-4" />
                {t('locations.planRoute')}
              </a>
            )}
            <Link
              to={`/?location=${location._id}`}
              onClick={onClose}
              className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 text-white py-2.5 rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
            >
              <HiOutlineBookOpen className="w-4 h-4" />
              {t('locations.browseBooks')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
