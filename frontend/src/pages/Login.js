import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

const Login = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(email, password);
      if (result.success) {
        navigate('/');
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError(t('login.error'));
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-100 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-md w-full space-y-8 bg-glass shadow-glass backdrop-blur-md p-10 rounded-2xl border border-dark-400/40">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-primary-400 tracking-tight drop-shadow">
            {t('login.title')} <span className="text-primary-500">Memo AI</span>
          </h2>
          <p className="mt-2 text-center text-sm text-primary-200">
            {t('login.register_link')}{' '}
            <Link to="/register" className="font-medium text-primary-400 hover:text-primary-300 transition-colors">
              {t('Inscription')}
            </Link>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-500/90 text-white p-3 rounded-xl text-sm shadow-card">
              {error}
            </div>
          )}
          <div className="rounded-xl shadow-card -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                {t('login.email')}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="appearance-none rounded-t-xl relative block w-full px-4 py-3 border border-dark-500 bg-dark-300/80 placeholder-gray-400 text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 text-base"
                placeholder={t('login.email')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                {t('login.password')}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none rounded-b-xl relative block w-full px-4 py-3 border border-dark-500 bg-dark-300/80 placeholder-gray-400 text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 text-base"
                placeholder={t('login.password')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
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
                  {t('login.loading')}
                </>
              ) : t('login.submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login; 