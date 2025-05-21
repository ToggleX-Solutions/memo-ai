import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Plans = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const plans = [
    {
      name: t('plans.free.name'),
      price: 0,
      priceText: t('plans.free.price'),
      description: t('plans.free.description'),
      features: t('plans.free.features', { returnObjects: true })
    },
    {
      name: t('plans.starter.name'),
      price: 9,
      priceText: t('plans.starter.price'),
      description: t('plans.starter.description'),
      features: t('plans.starter.features', { returnObjects: true })
    },
    {
      name: t('plans.pro.name'),
      price: 19,
      priceText: t('plans.pro.price'),
      description: t('plans.pro.description'),
      features: t('plans.pro.features', { returnObjects: true })
    },
    {
      name: t('plans.business.name'),
      price: 49,
      priceText: t('plans.business.price'),
      description: t('plans.business.description'),
      features: t('plans.business.features', { returnObjects: true })
    }
  ];

  return (
    <div className="max-w-5xl mx-auto py-12 px-4 font-sans">
      <h1 className="text-4xl font-extrabold text-primary-400 mb-8 text-center drop-shadow">{t('plans.title')}</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {plans.map(plan => (
          <div key={plan.name} className="bg-dark-300/80 rounded-2xl shadow-card border border-dark-400/40 p-8 flex flex-col items-center">
            <h2 className="text-2xl font-bold text-primary-400 mb-2">{plan.name}</h2>
            <div className="text-3xl font-extrabold text-white mb-2">{plan.priceText}</div>
            <div className="text-primary-300 mb-4 text-center min-h-[48px]">{plan.description}</div>
            <ul className="mb-6 space-y-1 text-sm text-primary-200 text-left w-full">
              {plan.features.map((f, i) => (
                <li key={i} className="flex items-center"><span className="mr-2">✔️</span>{f}</li>
              ))}
            </ul>
            <button
              onClick={() => navigate('/register', { state: { plan: plan.name.toLowerCase() } })}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-primary-500 to-primary-700 text-white font-semibold shadow-card hover:from-primary-600 hover:to-primary-800 transition-all duration-200"
            >
              {plan.price === 0 ? t('plans.start_free') : t('plans.choose_plan')}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Plans; 