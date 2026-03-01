import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getPage } from '../services/api';

export default function About() {
  const { t, i18n } = useTranslation();
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPage('about')
      .then((res) => setPage(res.data))
      .catch(() => setPage(null))
      .finally(() => setLoading(false));
  }, []);

  const lang = i18n.language;
  const title = page?.[`title_${lang}`] || page?.title_en || '';
  const content = page?.[`content_${lang}`] || page?.content_en || '';

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Hero */}
      <div className="bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-500 text-white py-16 md:py-24">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-5xl font-bold mb-4">{title || t('pages.about')}</h1>
          <div className="w-20 h-1 bg-white/40 rounded-full mx-auto" />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-12 md:py-16">
        {content ? (
          <div
            className="prose"
            dir={lang === 'ar' ? 'rtl' : 'ltr'}
            dangerouslySetInnerHTML={{ __html: content }}
          />
        ) : (
          <p className="text-center text-gray-500">{t('pages.noContent')}</p>
        )}
      </div>
    </div>
  );
}
