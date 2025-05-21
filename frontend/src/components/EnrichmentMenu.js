import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

const EnrichmentMenu = ({ section, onClose, onEnrich }) => {
  const { t } = useTranslation();
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);

  const quickPrompts = [
    t('enrich.prompts.extend'),
    t('enrich.prompts.examples'),
    t('enrich.prompts.academic'),
    t('enrich.prompts.citations'),
    t('enrich.prompts.arguments')
  ];

  const handleSubmit = async (customPrompt = '') => {
    setLoading(true);
    try {
      await onEnrich(section, customPrompt || prompt);
      onClose();
    } catch (error) {
      console.error(t('enrich.error'), error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-dark-300/95 rounded-xl shadow-glass backdrop-blur-md p-6 w-full max-w-lg border border-dark-400/40">
        <h3 className="text-xl font-bold text-primary-400 mb-4">
          {t('enrich.title', { section: section.title })}
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-primary-300 mb-2">
              {t('enrich.quick_prompts')}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {quickPrompts.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSubmit(suggestion)}
                  disabled={loading}
                  className="bg-dark-400/50 hover:bg-dark-400/70 text-primary-300 px-3 py-2 rounded-lg text-sm transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-primary-300 mb-2">
              {t('enrich.custom_prompt')}
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={t('enrich.prompt.placeholder')}
              className="w-full h-24 bg-dark-400/50 border border-dark-500 text-white rounded-lg p-3 text-sm resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-400 hover:text-gray-300 transition-colors"
            >
              {t('enrich.cancel')}
            </button>
            <button
              onClick={() => handleSubmit()}
              disabled={loading || !prompt}
              className="bg-gradient-to-r from-primary-500 to-primary-700 hover:from-primary-600 hover:to-primary-800 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-card transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {t('enrich.loading')}
                </span>
              ) : t('enrich.submit')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnrichmentMenu; 