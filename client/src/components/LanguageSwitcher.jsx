import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { HiOutlineGlobeAlt, HiOutlineChevronDown } from 'react-icons/hi2';

const languages = [
  { code: 'ar', label: 'العربية' },
  { code: 'en', label: 'English' },
  { code: 'nl', label: 'Nederlands' },
];

export default function LanguageSwitcher() {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const ref = useRef(null);
  const buttonRef = useRef(null);
  const optionRefs = useRef([]);

  const handleChange = (code) => {
    i18n.changeLanguage(code);
    localStorage.setItem('lang', code);
    document.documentElement.dir = code === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = code;
    setOpen(false);
    buttonRef.current?.focus();
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (open && focusedIndex >= 0) {
      optionRefs.current[focusedIndex]?.focus();
    }
  }, [focusedIndex, open]);

  const handleToggleKeyDown = (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        const currentIndex = languages.findIndex((l) => l.code === i18n.language);
        setFocusedIndex(currentIndex >= 0 ? currentIndex : 0);
      }
    } else if (e.key === 'Escape' && open) {
      setOpen(false);
    }
  };

  const handleOptionKeyDown = (e, index) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex((index + 1) % languages.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex((index - 1 + languages.length) % languages.length);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleChange(languages[index].code);
    } else if (e.key === 'Escape') {
      setOpen(false);
      buttonRef.current?.focus();
    }
  };

  const currentLang = languages.find((l) => l.code === i18n.language);

  return (
    <div className="relative" ref={ref}>
      <button
        ref={buttonRef}
        onClick={() => {
          setOpen(!open);
          if (!open) {
            const currentIndex = languages.findIndex((l) => l.code === i18n.language);
            setFocusedIndex(currentIndex >= 0 ? currentIndex : 0);
          }
        }}
        onKeyDown={handleToggleKeyDown}
        className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-sm text-white/90 hover:text-white hover:bg-white/10 transition-colors"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={t('nav.language')}
      >
        <HiOutlineGlobeAlt className="w-5 h-5" />
        <span>{currentLang?.label}</span>
        <HiOutlineChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          className="absolute top-full mt-1 end-0 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 min-w-[140px] z-50"
          role="listbox"
          aria-label={t('nav.language')}
        >
          {languages.map((lang, index) => (
            <button
              key={lang.code}
              ref={(el) => (optionRefs.current[index] = el)}
              onClick={() => handleChange(lang.code)}
              onKeyDown={(e) => handleOptionKeyDown(e, index)}
              role="option"
              aria-selected={i18n.language === lang.code}
              className={`w-full text-start px-4 py-2 text-sm transition-colors ${
                i18n.language === lang.code
                  ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-semibold'
                  : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {lang.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
