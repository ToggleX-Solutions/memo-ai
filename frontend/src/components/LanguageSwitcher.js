import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher = () => {
  const { i18n, t } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('lang', lng);
    window.location.reload(); // Force le rechargement pour appliquer la nouvelle langue
  };

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={() => changeLanguage('fr')}
        className={`px-2 py-1 rounded ${i18n.language === 'fr' ? 'bg-primary-500 text-white' : 'bg-dark-400 text-primary-200'}`}
      >
        {t('Français')}
      </button>
      <button
        onClick={() => changeLanguage('en')}
        className={`px-2 py-1 rounded ${i18n.language === 'en' ? 'bg-primary-500 text-white' : 'bg-dark-400 text-primary-200'}`}
      >
        {t('Anglais')}
      </button>
    </div>
  );
};

export default LanguageSwitcher; 