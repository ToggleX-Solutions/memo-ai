import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

const Dashboard = () => {
  const { t } = useTranslation();
  const [memoires, setMemoires] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState('');
  const [formData, setFormData] = useState({
    type: t('dashboard.form.type.options.memoire'),
    domaine: '',
    sujet: '',
    niveau: t('dashboard.form.niveau.options.licence')
  });
  const { token, user } = useAuth();
  const navigate = useNavigate();

  const fetchMemoires = useCallback(async () => {
    try {
      const response = await axios.get(`http://localhost:3001/api/memoires/user/${user.id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setMemoires(response.data.memoires);
    } catch (error) {
      setError(t('dashboard.error.fetch'));
    } finally {
      setLoading(false);
    }
  }, [token, user.id, t]);

  useEffect(() => {
    fetchMemoires();
  }, [fetchMemoires]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGenerating(true);
    setError('');
    setProgress(t('dashboard.form.progress.toc'));
    try {
      const response = await axios.post('http://localhost:3001/api/memoires/generate-advanced', formData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setProgress(t('dashboard.form.progress.done'));
      navigate(`/memoire/${response.data.memoire.id}`);
    } catch (error) {
      if (error.response && error.response.status === 403 && error.response.data.message?.includes('Limite atteinte')) {
        setError(error.response.data.message);
      } else {
        setError(t('dashboard.error.generate'));
      }
      setProgress('');
    } finally {
      setGenerating(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 font-sans">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Formulaire de génération */}
        <div className="bg-glass shadow-glass backdrop-blur-md rounded-2xl p-8 border border-dark-400/40">
          <h2 className="text-3xl font-extrabold text-primary-400 mb-8 tracking-tight drop-shadow">{t('dashboard.generate.title')}</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/90 text-white p-3 rounded-xl text-sm shadow-card">
                {error}
                {error.includes(t('dashboard.error.limit')) && (
                  <button
                    onClick={() => navigate('/plans')}
                    className="ml-4 bg-primary-500 hover:bg-primary-600 text-white px-3 py-1 rounded-xl text-xs font-semibold shadow-card transition-all duration-200"
                  >
                    {t('dashboard.error.view_plans')}
                  </button>
                )}
              </div>
            )}
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-primary-300 mb-1">{t('dashboard.form.type.label')}</label>
              <select
                id="type"
                name="type"
                required
                className="mt-1 block w-full rounded-xl bg-dark-300/80 border border-dark-500 text-white shadow-card focus:border-primary-500 focus:ring-primary-500 px-4 py-2"
                value={formData.type}
                onChange={handleChange}
              >
                <option value={t('dashboard.form.type.options.tfc')}>{t('dashboard.form.type.options.tfc')}</option>
                <option value={t('dashboard.form.type.options.memoire')}>{t('dashboard.form.type.options.memoire')}</option>
                <option value={t('dashboard.form.type.options.rapport')}>{t('dashboard.form.type.options.rapport')}</option>
                <option value={t('dashboard.form.type.options.tp')}>{t('dashboard.form.type.options.tp')}</option>
              </select>
            </div>
            <div>
              <label htmlFor="domaine" className="block text-sm font-medium text-primary-300 mb-1">{t('dashboard.form.domaine.label')}</label>
              <input
                type="text"
                id="domaine"
                name="domaine"
                required
                className="mt-1 block w-full rounded-xl bg-dark-300/80 border border-dark-500 text-white shadow-card focus:border-primary-500 focus:ring-primary-500 px-4 py-2 placeholder-gray-400"
                value={formData.domaine}
                onChange={handleChange}
                placeholder={t('dashboard.form.domaine.placeholder')}
              />
            </div>
            <div>
              <label htmlFor="sujet" className="block text-sm font-medium text-primary-300 mb-1">{t('dashboard.form.sujet.label')}</label>
              <input
                type="text"
                id="sujet"
                name="sujet"
                required
                className="mt-1 block w-full rounded-xl bg-dark-300/80 border border-dark-500 text-white shadow-card focus:border-primary-500 focus:ring-primary-500 px-4 py-2 placeholder-gray-400"
                value={formData.sujet}
                onChange={handleChange}
                placeholder={t('dashboard.form.sujet.placeholder')}
              />
            </div>
            <div>
              <label htmlFor="niveau" className="block text-sm font-medium text-primary-300 mb-1">{t('dashboard.form.niveau.label')}</label>
              <select
                id="niveau"
                name="niveau"
                required
                className="mt-1 block w-full rounded-xl bg-dark-300/80 border border-dark-500 text-white shadow-card focus:border-primary-500 focus:ring-primary-500 px-4 py-2"
                value={formData.niveau}
                onChange={handleChange}
              >
                <option value={t('dashboard.form.niveau.options.licence')}>{t('dashboard.form.niveau.options.licence')}</option>
                <option value={t('dashboard.form.niveau.options.master')}>{t('dashboard.form.niveau.options.master')}</option>
                <option value={t('dashboard.form.niveau.options.doctorat')}>{t('dashboard.form.niveau.options.doctorat')}</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={generating}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-card text-base font-semibold text-white bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700 hover:from-primary-600 hover:to-primary-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {generating ? (
                <>
                  <svg className="animate-spin h-6 w-6 mr-2 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
                  {t('dashboard.form.generating')}
                </>
              ) : t('dashboard.form.submit')}
            </button>
            {generating && (
              <div className="text-primary-300 text-center mt-4 animate-pulse text-base font-medium tracking-wide">{progress}</div>
            )}
          </form>
        </div>

        {/* Liste des mémoires */}
        <div className="bg-glass shadow-glass backdrop-blur-md rounded-2xl p-8 border border-dark-400/40">
          <h2 className="text-3xl font-extrabold text-primary-400 mb-8 tracking-tight drop-shadow">{t('dashboard.memoires.title')}</h2>
          {loading ? (
            <div className="text-center text-primary-300 animate-pulse">{t('dashboard.loading')}</div>
          ) : memoires.length === 0 ? (
            <div className="text-center text-gray-400">{t('dashboard.empty')}</div>
          ) : (
            <div className="space-y-4">
              {memoires.map((memoire) => (
                <div
                  key={memoire.id}
                  className="bg-dark-300/80 p-5 rounded-xl hover:bg-dark-400/80 transition-colors cursor-pointer shadow-card border border-dark-500/30"
                  onClick={() => navigate(`/memoire/${memoire.id}`)}
                >
                  <h3 className="text-lg font-semibold text-white mb-1">{memoire.sujet}</h3>
                  <p className="text-sm text-primary-300">
                    {memoire.domaine} • {memoire.niveau}
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    {t('dashboard.created_at')} {new Date(memoire.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 