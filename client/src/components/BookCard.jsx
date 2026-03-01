import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HiOutlineCheckCircle, HiOutlineClock, HiOutlineBookOpen, HiOutlineBuildingStorefront } from 'react-icons/hi2';

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

  const statusLabel = t(`books.${book.status}`);
  const categoryName = book.category?.name || '';
  const locationName = book.location?.name || '';
  const StatusIcon = statusIcons[book.status];

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow flex flex-col">
      <div className="h-48 bg-gray-100 overflow-hidden">
        {book.image ? (
          <img
            src={book.image}
            alt={book.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <HiOutlineBookOpen className="w-12 h-12" />
          </div>
        )}
      </div>
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-bold text-lg text-gray-800 line-clamp-1">{book.title}</h3>
          <span
            className={`${statusColors[book.status]} text-white text-xs px-2 py-1 rounded-full whitespace-nowrap flex items-center gap-1`}
          >
            <StatusIcon className="w-3.5 h-3.5" />
            {statusLabel}
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {categoryName && (
            <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              {categoryName}
            </span>
          )}
          {locationName && (
            <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full flex items-center gap-0.5">
              <HiOutlineBuildingStorefront className="w-3 h-3" />
              {locationName}
            </span>
          )}
        </div>
        <p className="text-gray-600 text-sm line-clamp-2 flex-1">{book.description}</p>
        {book.status === 'available' && (
          <Link
            to={`/reserve/${book._id}`}
            className="mt-3 block text-center bg-emerald-600 text-white py-2 rounded-lg hover:bg-emerald-700 transition-colors"
          >
            {t('books.reserve')}
          </Link>
        )}
      </div>
    </div>
  );
}
