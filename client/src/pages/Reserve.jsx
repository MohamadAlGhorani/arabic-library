import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DayPicker } from 'react-day-picker';
import { format } from 'date-fns';
import { ar as arLocale } from 'date-fns/locale/ar';
import { nl as nlLocale } from 'date-fns/locale/nl';
import { enUS as enLocale } from 'date-fns/locale/en-US';
import 'react-day-picker/style.css';
import { HiOutlineUser, HiOutlineEnvelope, HiOutlinePhone, HiOutlineCalendarDays, HiOutlineClock, HiOutlineCheckCircle, HiOutlineExclamationCircle, HiOutlineBuildingStorefront } from 'react-icons/hi2';
import { getBook, createReservation, getSettings } from '../services/api';

const localeMap = { ar: arLocale, nl: nlLocale, en: enLocale };

export default function Reserve() {
  const { id } = useParams();
  const { t, i18n } = useTranslation();
  const [book, setBook] = useState(null);
  const [settings, setSettings] = useState(null);
  const [selectedDate, setSelectedDate] = useState(undefined);
  const [form, setForm] = useState({ name: '', email: '', phone: '', time: '' });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getBook(id)
      .then((res) => {
        setBook(res.data);
        // Fetch settings for this book's location
        const locId = res.data.location?._id || res.data.location;
        if (locId) {
          return getSettings(locId).then((sRes) => setSettings(sRes.data));
        }
      })
      .catch((err) => {
        console.error('Failed to load book or settings:', err);
        setError(err.response?.data?.message || 'Failed to load book details');
      });
  }, [id]);

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setForm({ ...form, time: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDate) return;
    setError('');
    setSubmitting(true);

    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      await createReservation({ bookId: id, name: form.name, email: form.email, phone: form.phone, date: dateStr, time: form.time });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  if (!book || (!settings && !error)) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>;
  }

  if (success) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="bg-green-50 border border-green-200 rounded-xl p-8" role="alert">
          <HiOutlineCheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <p className="text-green-800 text-lg font-medium">{t('reservation.success')}</p>
          <Link
            to="/"
            className="inline-block mt-6 bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
          >
            {t('reservation.backToBooks')}
          </Link>
        </div>
      </div>
    );
  }

  // Minimum date is tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Closed days (days NOT in openDays)
  const closedDays = [0, 1, 2, 3, 4, 5, 6].filter(
    (d) => !settings.openDays.includes(d)
  );

  // Disable closed days and past dates
  const disabledMatcher = [
    { before: tomorrow },
    { dayOfWeek: closedDays },
  ];

  const isDateValid = selectedDate !== undefined;
  const currentLocale = localeMap[i18n.language] || enLocale;
  const isRtl = i18n.language === 'ar';

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">{t('reservation.title')}</h1>
      <div className="bg-emerald-50 rounded-lg p-3 mb-6 flex items-center gap-3">
        {book.image && (
          <img src={book.image} alt={book.title} className="w-12 h-16 object-cover rounded" />
        )}
        <div>
          <p className="font-semibold text-gray-800">{book.title}</p>
          <p className="text-sm text-gray-500">{book.category?.name}</p>
          {book.location?.name && (
            <p className="text-xs text-blue-600 flex items-center gap-1 mt-0.5">
              <HiOutlineBuildingStorefront className="w-3 h-3" />
              {book.location.name}
            </p>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 text-red-700 px-4 py-2 rounded-lg mb-4" role="alert">
          <HiOutlineExclamationCircle className="w-5 h-5 shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="reserve-name" className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1">
            <HiOutlineUser className="w-4 h-4" />
            {t('reservation.name')}
          </label>
          <input
            id="reserve-name"
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder={t('reservation.namePlaceholder')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div>
          <label htmlFor="reserve-email" className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1">
            <HiOutlineEnvelope className="w-4 h-4" />
            {t('reservation.email')} *
          </label>
          <input
            id="reserve-email"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder={t('reservation.emailPlaceholder')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div>
          <label htmlFor="reserve-phone" className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1">
            <HiOutlinePhone className="w-4 h-4" />
            {t('reservation.phone')}
          </label>
          <input
            id="reserve-phone"
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder={t('reservation.phonePlaceholder')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div>
          <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1">
            <HiOutlineCalendarDays className="w-4 h-4" />
            {t('reservation.date')}
          </label>
          <div className="calendar-wrapper border border-gray-300 rounded-lg p-3 bg-white">
            <DayPicker
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              disabled={disabledMatcher}
              locale={currentLocale}
              dir={isRtl ? 'rtl' : 'ltr'}
              showOutsideDays
              navLayout="around"
            />
          </div>
          {selectedDate && (
            <p className="text-emerald-700 text-sm mt-2 font-medium">
              {format(selectedDate, 'EEEE, d MMMM yyyy', { locale: currentLocale })}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="reserve-time" className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1">
            <HiOutlineClock className="w-4 h-4" />
            {t('reservation.time')}
          </label>
          <select
            id="reserve-time"
            required
            value={form.time}
            onChange={(e) => setForm({ ...form, time: e.target.value })}
            disabled={!isDateValid}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-100 disabled:text-gray-400"
          >
            <option value="">{t('reservation.selectTime')}</option>
            {settings.timeSlots.map((slot) => (
              <option key={slot} value={slot}>
                {slot}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          disabled={submitting || !isDateValid || !form.time}
          className="w-full bg-emerald-600 text-white py-3 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
        >
          {submitting ? t('reservation.submitting') : t('reservation.submit')}
        </button>
      </form>
    </div>
  );
}
