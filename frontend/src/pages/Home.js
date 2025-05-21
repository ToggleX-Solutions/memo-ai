import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Home = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const features = [
    {
      title: t('home.features.ai.title'),
      desc: t('home.features.ai.desc')
    },
    {
      title: t('home.features.export.title'),
      desc: t('home.features.export.desc')
    },
    {
      title: t('home.features.editor.title'),
      desc: t('home.features.editor.desc')
    },
    {
      title: t('home.features.plans.title'),
      desc: t('home.features.plans.desc')
    }
  ];

  const steps = [
    t('home.steps.step1'),
    t('home.steps.step2'),
    t('home.steps.step3'),
    t('home.steps.step4')
  ];

  return (
    <div className="font-sans">
      {/* Hero */}
      <section className="py-20 text-center bg-gradient-to-b from-dark-200 to-dark-400">
        <h1 className="text-5xl font-extrabold text-primary-400 mb-4 drop-shadow">Memo AI</h1>
        <p className="text-xl text-primary-200 mb-8 max-w-2xl mx-auto">
          {t('home.hero.subtitle')}
        </p>
        <div className="flex flex-col md:flex-row justify-center gap-4 mb-8">
          <button
            onClick={() => navigate('/register')}
            className="px-8 py-4 rounded-xl bg-gradient-to-r from-primary-500 to-primary-700 text-white font-bold text-lg shadow-card hover:from-primary-600 hover:to-primary-800 transition-all duration-200"
          >
            {t('home.hero.start_button')}
          </button>
          <button
            onClick={() => navigate('/plans')}
            className="px-8 py-4 rounded-xl bg-dark-300/80 text-primary-300 font-bold text-lg shadow-card border border-primary-500 hover:bg-dark-400/80 transition-all duration-200"
          >
            {t('home.hero.pricing_button')}
          </button>
        </div>
        <div className="text-primary-300 text-sm">{t('home.hero.no_card_required')}</div>
      </section>

      {/* Fonctionnalités */}
      <section className="py-16">
        <h2 className="text-3xl font-bold text-primary-400 mb-8 text-center">{t('home.features.title')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
          {features.map((f, i) => (
            <div key={i} className="bg-dark-300/80 rounded-2xl shadow-card p-6 text-center border border-dark-400/40">
              <h3 className="text-xl font-semibold text-primary-300 mb-2">{f.title}</h3>
              <p className="text-primary-200 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Comment ça marche */}
      <section className="py-16 bg-dark-100">
        <h2 className="text-3xl font-bold text-primary-400 mb-8 text-center">{t('home.how_it_works.title')}</h2>
        <ol className="max-w-3xl mx-auto space-y-6 text-primary-200">
          {steps.map((s, i) => (
            <li key={i} className="flex items-start gap-4">
              <span className="bg-primary-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-lg shadow-card">{i + 1}</span>
              <span className="pt-1">{s}</span>
            </li>
          ))}
        </ol>
      </section>

      {/* Call to action */}
      <section className="py-16 bg-gradient-to-t from-dark-200 to-dark-400 text-center">
        <h2 className="text-3xl font-bold text-primary-400 mb-4">{t('home.cta.title')}</h2>
        <button
          onClick={() => navigate('/register')}
          className="px-10 py-4 rounded-xl bg-gradient-to-r from-primary-500 to-primary-700 text-white font-bold text-lg shadow-card hover:from-primary-600 hover:to-primary-800 transition-all duration-200"
        >
          {t('home.cta.button')}
        </button>
      </section>
    </div>
  );
};

export default Home; 