import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer className="bg-black text-gray-400 py-6 mt-auto">
      <div className="max-w-7xl mx-auto px-4 flex flex-col items-center gap-2 text-center">
        <div className="flex items-center gap-2">
          <img src="/logo.svg" alt="" className="w-6 h-6" />
          <span className="text-white font-semibold">{t('footer.text')}</span>
        </div>
        <p className="text-sm">
          &copy; {year} {t('footer.text')}. {t('footer.rights')}
        </p>
      </div>
    </footer>
  );
}
