import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  HiOutlineUser,
  HiOutlineEnvelope,
  HiOutlineChatBubbleLeftRight,
  HiOutlinePaperAirplane,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
  HiOutlineBuildingStorefront,
} from 'react-icons/hi2';
import { sendContact, getLocations } from '../services/api';

export default function Contact() {
  const { t } = useTranslation();
  const [locations, setLocations] = useState([]);
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '', locationId: '' });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getLocations().then((res) => {
      setLocations(res.data);
    }).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await sendContact(form);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || t('contact.error'));
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-xl p-8" role="alert">
          <HiOutlineCheckCircle className="w-16 h-16 text-green-600 dark:text-green-400 mx-auto mb-4" />
          <p className="text-green-800 dark:text-green-300 text-lg font-medium">{t('contact.success')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">{t('contact.title')}</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-6">{t('contact.subtitle')}</p>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-4 py-2 rounded-lg mb-4" role="alert">
          <HiOutlineExclamationCircle className="w-5 h-5 shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="contact-name" className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
            <HiOutlineUser className="w-4 h-4" />
            {t('contact.name')}
          </label>
          <input
            id="contact-name"
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder={t('contact.namePlaceholder')}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-gray-100"
          />
        </div>
        <div>
          <label htmlFor="contact-email" className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
            <HiOutlineEnvelope className="w-4 h-4" />
            {t('contact.email')}
          </label>
          <input
            id="contact-email"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder={t('contact.emailPlaceholder')}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-gray-100"
          />
        </div>
        {locations.length > 1 && (
          <div>
            <label htmlFor="contact-location" className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              <HiOutlineBuildingStorefront className="w-4 h-4" />
              {t('contact.location')}
            </label>
            <select
              id="contact-location"
              value={form.locationId}
              onChange={(e) => setForm({ ...form, locationId: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-gray-100"
            >
              <option value="">{t('contact.allLocations')}</option>
              {locations.map((loc) => (
                <option key={loc._id} value={loc._id}>{loc.name}</option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label htmlFor="contact-subject" className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
            <HiOutlineChatBubbleLeftRight className="w-4 h-4" />
            {t('contact.subject')}
          </label>
          <input
            id="contact-subject"
            type="text"
            required
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
            placeholder={t('contact.subjectPlaceholder')}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-gray-100"
          />
        </div>
        <div>
          <label htmlFor="contact-message" className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
            <HiOutlinePaperAirplane className="w-4 h-4" />
            {t('contact.message')}
          </label>
          <textarea
            id="contact-message"
            required
            rows={5}
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            placeholder={t('contact.messagePlaceholder')}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-gray-100 resize-none"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-emerald-600 text-white py-3 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 cursor-pointer"
        >
          {submitting ? t('contact.submitting') : t('contact.submit')}
        </button>
      </form>
    </div>
  );
}
