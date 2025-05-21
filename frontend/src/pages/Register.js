import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

const Register = () => {
  const { t } = useTranslation();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [plan, setPlan] = useState('free');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const plans = [
    { value: 'free', label: t('register.plan.free') },
    { value: 'starter', label: t('register.plan.starter') },
    { value: 'pro', label: t('register.plan.pro') },
    { value: 'business', label: t('register.plan.business') }
  ];

  useEffect(() => {
    if (location.state && location.state.plan) {
      setPlan(location.state.plan);
    }
  }, [location.state]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!fullName || !email || !password || !confirmPassword) {
      setError(t('register.error.fill_fields'));
      return;
    }
    if (password !== confirmPassword) {
      setError(t('register.error.password_mismatch'));
      return;
    }
    setLoading(true);
    try {
      const result = await register(email, password, fullName, plan);
      if (result.success) {
        navigate('/');
      } else {
        setError(result.error || t('register.error.generic'));
      }
    } catch (err) {
      setError(t('register.error.generic'));
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-100 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-md w-full space-y-8 bg-glass shadow-glass backdrop-blur-md p-10 rounded-2xl border border-dark-400/40">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-primary-400 tracking-tight drop-shadow">
            {t('register.title')}
          </h2>
          <p className="mt-2 text-center text-sm text-primary-200">
            {t('register.login_link')}{' '}
            <Link to="/login" className="font-medium text-primary-400 hover:text-primary-300 transition-colors">
              {t('Connexion')}
            </Link>
          </p>
        </div>
        {error && (
          <div className="bg-red-500/90 text-white p-3 rounded-xl text-sm shadow-card mb-4 text-center">
            {error}
          </div>
        )}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-xl shadow-card -space-y-px">
            <div>
              <label htmlFor="fullName" className="sr-only">{t('register.full_name')}</label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                required
                className="appearance-none rounded-t-xl relative block w-full px-4 py-3 border border-dark-500 bg-dark-300/80 placeholder-gray-400 text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 text-base"
                placeholder={t('register.full_name')}
                value={fullName}
                onChange={e => setFullName(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="email" className="sr-only">{t('register.email')}</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="appearance-none relative block w-full px-4 py-3 border border-dark-500 bg-dark-300/80 placeholder-gray-400 text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 text-base"
                placeholder={t('register.email')}
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">{t('register.password')}</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none relative block w-full px-4 py-3 border border-dark-500 bg-dark-300/80 placeholder-gray-400 text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 text-base"
                placeholder={t('register.password')}
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="confirm-password" className="sr-only">{t('register.confirm_password')}</label>
              <input
                id="confirm-password"
                name="confirm-password"
                type="password"
                required
                className="appearance-none rounded-b-xl relative block w-full px-4 py-3 border border-dark-500 bg-dark-300/80 placeholder-gray-400 text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 text-base"
                placeholder={t('register.confirm_password')}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
              />
            </div>
            <div className="mt-4">
              <label htmlFor="plan" className="block text-sm font-medium text-primary-300 mb-2">{t('register.plan_label')}</label>
              <select
                id="plan"
                name="plan"
                value={plan}
                onChange={e => setPlan(e.target.value)}
                className="block w-full rounded-xl bg-dark-300/80 border border-dark-500 text-white shadow-card px-4 py-3"
              >
                {plans.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center items-center py-3 px-4 border border-transparent text-base font-semibold rounded-xl text-white bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700 hover:from-primary-600 hover:to-primary-800 shadow-card focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-6 w-6 mr-2 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
                  {t('register.loading')}
                </>
              ) : t('register.submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register; 