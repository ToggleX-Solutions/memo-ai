import React from 'react';
import { useTranslation } from 'react-i18next';

const Footer = () => {
  const { t } = useTranslation();
  
  return (
    <footer className="bg-dark-300/80 border-t border-dark-400/40 py-4 mt-auto">
      <div className="container mx-auto px-4 text-center text-primary-200 text-sm">
        {t('footer.powered')}
      </div>
    </footer>
  );
};

export default Footer; 