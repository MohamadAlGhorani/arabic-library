import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { HiOutlineDocumentText, HiOutlinePencilSquare, HiOutlineArrowLeft, HiOutlineCheck } from 'react-icons/hi2';
import { getPage, updatePage } from '../../services/api';

const PAGES = [
  { slug: 'about', labelKey: 'pages.about' },
  { slug: 'how-it-works', labelKey: 'pages.howItWorks' },
];

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'ar', label: 'العربية' },
  { code: 'nl', label: 'Nederlands' },
];

const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ align: [] }],
    [{ direction: 'rtl' }],
    ['link'],
    [{ color: [] }, { background: [] }],
    ['clean'],
  ],
};

export default function ManagePages() {
  const { t, i18n } = useTranslation();
  const [editingSlug, setEditingSlug] = useState(null);
  const [activeLang, setActiveLang] = useState('en');
  const [pageData, setPageData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (editingSlug) {
      loadPage(editingSlug);
    }
  }, [editingSlug]);

  const loadPage = async (slug) => {
    setLoading(true);
    try {
      const res = await getPage(slug);
      setPageData(res.data);
    } catch {
      setPageData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!pageData || !editingSlug) return;
    setSaving(true);
    setSuccessMsg('');
    try {
      await updatePage(editingSlug, {
        title_en: pageData.title_en,
        title_ar: pageData.title_ar,
        title_nl: pageData.title_nl,
        content_en: pageData.content_en,
        content_ar: pageData.content_ar,
        content_nl: pageData.content_nl,
      });
      setSuccessMsg(t('pages.saved'));
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch {
      // error
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field, value) => {
    setPageData((prev) => ({ ...prev, [field]: value }));
  };

  const isRtl = i18n.language === 'ar';

  // Page list view
  if (!editingSlug) {
    return (
      <div className="p-4 md:p-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">{t('pages.manageContent')}</h1>

        <div className="grid gap-4 sm:grid-cols-2">
          {PAGES.map((page) => (
            <div
              key={page.slug}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 flex items-start justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/40 rounded-lg flex items-center justify-center">
                  <HiOutlineDocumentText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-gray-100">{t(page.labelKey)}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">/{page.slug}</p>
                </div>
              </div>
              <button
                onClick={() => setEditingSlug(page.slug)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 transition-colors cursor-pointer"
              >
                <HiOutlinePencilSquare className="w-4 h-4" />
                {t('admin.edit')}
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Edit view
  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <button
        onClick={() => { setEditingSlug(null); setPageData(null); setSuccessMsg(''); }}
        className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 mb-4 transition-colors cursor-pointer"
      >
        <HiOutlineArrowLeft className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
        {t('pages.back')}
      </button>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
          {t('pages.editPage')} — {t(PAGES.find((p) => p.slug === editingSlug)?.labelKey || '')}
        </h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : pageData ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          {/* Language tabs */}
          <div className="flex gap-1 mb-6 border-b border-gray-200 dark:border-gray-700">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setActiveLang(lang.code)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
                  activeLang === lang.code
                    ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>

          {/* Title input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">{t('pages.title')}</label>
            <input
              type="text"
              value={pageData[`title_${activeLang}`] || ''}
              onChange={(e) => updateField(`title_${activeLang}`, e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700"
              dir={activeLang === 'ar' ? 'rtl' : 'ltr'}
            />
          </div>

          {/* Rich text editor */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">{t('pages.content')}</label>
            <div dir={activeLang === 'ar' ? 'rtl' : 'ltr'} className="quill-wrapper">
              <ReactQuill
                key={`${editingSlug}-${activeLang}`}
                theme="snow"
                value={pageData[`content_${activeLang}`] || ''}
                onChange={(value) => updateField(`content_${activeLang}`, value)}
                modules={quillModules}
              />
            </div>
          </div>

          {/* Save button + success message */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors cursor-pointer"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <HiOutlineCheck className="w-4 h-4" />
              )}
              {saving ? t('admin.saving') : t('admin.save')}
            </button>
            {successMsg && (
              <span className="text-emerald-600 dark:text-emerald-400 text-sm font-medium">{successMsg}</span>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
