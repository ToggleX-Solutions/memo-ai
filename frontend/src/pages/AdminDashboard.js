import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import ReactMarkdown from 'react-markdown';

const AdminDashboard = () => {
  const { t } = useTranslation();
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [licences, setLicences] = useState([]);
  const [showLicenceModal, setShowLicenceModal] = useState(false);
  const [licencePlan, setLicencePlan] = useState('free');
  const [licenceExpiry, setLicenceExpiry] = useState('');
  const [licenceMsg, setLicenceMsg] = useState('');
  const [memoireUserId, setMemoireUserId] = useState('');
  const [memoireForm, setMemoireForm] = useState({
    type: 'TFC',
    domaine: '',
    sujet: '',
    niveau: 'Licence'
  });
  const [memoireMsg, setMemoireMsg] = useState('');
  const [memoiresAll, setMemoiresAll] = useState([]);
  const [showUserDocs, setShowUserDocs] = useState(false);
  const [userDocs, setUserDocs] = useState([]);
  const [userDocsLoading, setUserDocsLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDocContent, setShowDocContent] = useState(false);
  const [docContent, setDocContent] = useState('');
  const [docContentTitle, setDocContentTitle] = useState('');
  const [deletingDocId, setDeletingDocId] = useState(null);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterNiveau, setFilterNiveau] = useState('');
  const [page, setPage] = useState(1);
  const docsPerPage = 10;

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
      return;
    }
    fetchAll();
    // eslint-disable-next-line
  }, [user]);

  const fetchAll = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [usersRes, plansRes, licencesRes] = await Promise.all([
        axios.get('http://localhost:3001/api/admin/users', { headers }),
        axios.get('http://localhost:3001/api/admin/plans', { headers }),
        axios.get('http://localhost:3001/api/admin/licences', { headers })
      ]);
      setUsers(usersRes.data.users);
      setPlans(plansRes.data.plans);
      setLicences(licencesRes.data.licences);
    } catch (e) {
      // gestion d'erreur simple
    }
  };

  const handleGenerateLicence = async (e) => {
    e.preventDefault();
    setLicenceMsg('');
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.post('http://localhost:3001/api/admin/licences', {
        plan: licencePlan,
        expires_at: licenceExpiry || null
      }, { headers });
      setLicenceMsg(`Licence générée : ${res.data.licence.key}`);
      setShowLicenceModal(false);
      fetchAll();
    } catch (e) {
      setLicenceMsg(t('admin.error.license'));
    }
  };

  const fetchAllMemoires = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get('http://localhost:3001/api/memoires/all', { headers });
      setMemoiresAll(res.data.memoires);
    } catch (e) {
      // gestion d'erreur simple
    }
  };

  // Fonction pour charger les documents d'un utilisateur
  const handleShowUserDocs = async (user) => {
    setSelectedUser(user);
    setShowUserDocs(true);
    setUserDocsLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get(`http://localhost:3001/api/memoires/user/${user.id}`, { headers });
      setUserDocs(res.data.memoires);
    } catch (e) {
      setUserDocs([]);
    }
    setUserDocsLoading(false);
  };

  // Voir le contenu d'un document
  const handleViewDoc = async (doc) => {
    setShowDocContent(true);
    setDocContent(doc.contenu || '');
    setDocContentTitle(doc.sujet || '');
    // Si le contenu n'est pas chargé, on le récupère
    if (!doc.contenu) {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const res = await axios.get(`http://localhost:3001/api/memoires/${doc.id}`, { headers });
        setDocContent(res.data.memoire.contenu);
      } catch (e) {
        setDocContent('Erreur lors du chargement du contenu.');
      }
    }
  };

  // Export direct
  const handleExportDoc = async (docId, format) => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.post(`http://localhost:3001/api/export/${format}/${docId}`, {}, { headers, responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `memoire-${docId}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      alert('Erreur lors de l\'export.');
    }
  };

  // Suppression
  const handleDeleteDoc = async (docId) => {
    if (!window.confirm(t('admin.user.docs.delete_confirm'))) return;
    setDeletingDocId(docId);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.delete(`http://localhost:3001/api/memoires/${docId}`, { headers });
      setUserDocs(docs => docs.filter(d => d.id !== docId));
    } catch (e) {
      alert('Erreur lors de la suppression.');
    }
    setDeletingDocId(null);
  };

  // Filtrage et pagination
  const filteredDocs = userDocs.filter(doc => {
    const searchLower = search.toLowerCase();
    const matchSearch =
      doc.sujet?.toLowerCase().includes(searchLower) ||
      doc.domaine?.toLowerCase().includes(searchLower) ||
      doc.type?.toLowerCase().includes(searchLower) ||
      doc.niveau?.toLowerCase().includes(searchLower);
    const matchType = !filterType || doc.type === filterType;
    const matchNiveau = !filterNiveau || doc.niveau === filterNiveau;
    return matchSearch && matchType && matchNiveau;
  });
  const totalPages = Math.ceil(filteredDocs.length / docsPerPage);
  const paginatedDocs = filteredDocs.slice((page - 1) * docsPerPage, page * docsPerPage);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans">
      <div className="bg-glass shadow-glass backdrop-blur-md rounded-2xl p-8 border border-dark-400/40">
        <div className="flex gap-4 mb-8">
          <button onClick={() => setTab('users')} className={`px-4 py-2 rounded-xl font-semibold ${tab === 'users' ? 'bg-primary-500 text-white' : 'bg-dark-300/80 text-primary-300'}`}>{t('admin.tabs.users')}</button>
          <button onClick={() => setTab('plans')} className={`px-4 py-2 rounded-xl font-semibold ${tab === 'plans' ? 'bg-primary-500 text-white' : 'bg-dark-300/80 text-primary-300'}`}>{t('admin.tabs.plans')}</button>
          <button onClick={() => setTab('licences')} className={`px-4 py-2 rounded-xl font-semibold ${tab === 'licences' ? 'bg-primary-500 text-white' : 'bg-dark-300/80 text-primary-300'}`}>{t('admin.tabs.licenses')}</button>
          <button onClick={() => setTab('memoires')} className={`px-4 py-2 rounded-xl font-semibold ${tab === 'memoires' ? 'bg-primary-500 text-white' : 'bg-dark-300/80 text-primary-300'}`}>{t('admin.tabs.theses')}</button>
        </div>

        {tab === 'users' && (
          <div className="overflow-x-auto bg-dark-300/80 rounded-xl p-6 shadow-card">
            <h2 className="text-xl font-bold mb-4 text-primary-300">{t('admin.tabs.users')}</h2>
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-primary-400">
                  <th className="px-2 py-1">ID</th>
                  <th className="px-2 py-1">{t('Nom')}</th>
                  <th className="px-2 py-1">{t('Email')}</th>
                  <th className="px-2 py-1">{t('Rôle')}</th>
                  <th className="px-2 py-1">{t('Plan')}</th>
                  <th className="px-2 py-1">{t('Licence')}</th>
                  <th className="px-2 py-1">{t('Inscription')}</th>
                  <th className="px-2 py-1">{t('admin.user.docs')}</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-b border-dark-500/30">
                    <td className="px-2 py-1">{u.id}</td>
                    <td className="px-2 py-1">{u.full_name}</td>
                    <td className="px-2 py-1">{u.email}</td>
                    <td className="px-2 py-1">{u.role}</td>
                    <td className="px-2 py-1">{u.plan}</td>
                    <td className="px-2 py-1">{u.licence || '-'}</td>
                    <td className="px-2 py-1">{new Date(u.created_at).toLocaleDateString()}</td>
                    <td className="px-2 py-1">
                      <button onClick={() => handleShowUserDocs(u)} className="bg-primary-500 text-white px-3 py-1 rounded shadow-card hover:bg-primary-600 text-xs font-semibold">{t('admin.user.docs')}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Modale documents utilisateur */}
            {showUserDocs && (
              <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                <div className="bg-dark-300/95 rounded-xl shadow-glass p-8 w-full max-w-2xl border border-dark-400/40 relative">
                  <button onClick={() => setShowUserDocs(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white text-xl">&times;</button>
                  <h3 className="text-xl font-bold text-primary-400 mb-4">{t('admin.user.docs.title', { user: selectedUser?.full_name })}</h3>
                  {userDocsLoading ? (
                    <div className="text-primary-300">{t('dashboard.loading')}</div>
                  ) : userDocs.length === 0 ? (
                    <div className="text-gray-400">{t('dashboard.empty')}</div>
                  ) : (
                    <>
                      {/* Filtres et recherche */}
                      <div className="flex flex-wrap gap-2 mb-4 items-center">
                        <input
                          type="text"
                          value={search}
                          onChange={e => { setSearch(e.target.value); setPage(1); }}
                          placeholder={t('admin.user.docs.search_placeholder')}
                          className="px-3 py-2 rounded bg-dark-400/50 border border-dark-500 text-primary-100 text-sm"
                        />
                        <select
                          value={filterType}
                          onChange={e => { setFilterType(e.target.value); setPage(1); }}
                          className="px-2 py-2 rounded bg-dark-400/50 border border-dark-500 text-primary-100 text-sm"
                        >
                          <option value="">{t('dashboard.form.type.label')}</option>
                          <option value="TFC">{t('dashboard.form.type.options.tfc')}</option>
                          <option value="Mémoire">{t('dashboard.form.type.options.memoire')}</option>
                          <option value="Rapport de stage">{t('dashboard.form.type.options.rapport')}</option>
                          <option value="TP">{t('dashboard.form.type.options.tp')}</option>
                          <option value="Thesis">Thesis</option>
                          <option value="Internship report">Internship report</option>
                          <option value="Lab work">Lab work</option>
                        </select>
                        <select
                          value={filterNiveau}
                          onChange={e => { setFilterNiveau(e.target.value); setPage(1); }}
                          className="px-2 py-2 rounded bg-dark-400/50 border border-dark-500 text-primary-100 text-sm"
                        >
                          <option value="">{t('dashboard.form.niveau.label')}</option>
                          <option value="Licence">{t('dashboard.form.niveau.options.licence')}</option>
                          <option value="Master">{t('dashboard.form.niveau.options.master')}</option>
                          <option value="Doctorat">{t('dashboard.form.niveau.options.doctorat')}</option>
                          <option value="Bachelor">Bachelor</option>
                          <option value="PhD">PhD</option>
                        </select>
                      </div>
                      {/* Tableau paginé */}
                      <table className="min-w-full text-sm mb-4">
                        <thead>
                          <tr className="text-primary-400">
                            <th className="px-2 py-1">ID</th>
                            <th className="px-2 py-1">{t('Type de document')}</th>
                            <th className="px-2 py-1">{t('Sujet')}</th>
                            <th className="px-2 py-1">{t('Domaine')}</th>
                            <th className="px-2 py-1">{t('Niveau')}</th>
                            <th className="px-2 py-1">{t('dashboard.created_at')}</th>
                            <th className="px-2 py-1">{t('admin.user.docs.actions')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedDocs.map(m => (
                            <tr key={m.id} className="border-b border-dark-500/30">
                              <td className="px-2 py-1">{m.id}</td>
                              <td className="px-2 py-1">{m.type || '-'}</td>
                              <td className="px-2 py-1">{m.sujet}</td>
                              <td className="px-2 py-1">{m.domaine}</td>
                              <td className="px-2 py-1">{m.niveau}</td>
                              <td className="px-2 py-1">{new Date(m.created_at).toLocaleDateString()}</td>
                              <td className="px-2 py-1 space-x-1">
                                <button onClick={() => handleViewDoc(m)} className="bg-primary-400 text-white px-2 py-1 rounded text-xs font-semibold hover:bg-primary-500">{t('admin.user.docs.view')}</button>
                                <button onClick={() => handleExportDoc(m.id, 'word')} className="bg-green-500 text-white px-2 py-1 rounded text-xs font-semibold hover:bg-green-600">Word</button>
                                <button onClick={() => handleExportDoc(m.id, 'pdf')} className="bg-red-500 text-white px-2 py-1 rounded text-xs font-semibold hover:bg-red-600">PDF</button>
                                <button onClick={() => handleDeleteDoc(m.id)} disabled={deletingDocId === m.id} className="bg-gray-600 text-white px-2 py-1 rounded text-xs font-semibold hover:bg-gray-700 disabled:opacity-50">{deletingDocId === m.id ? t('dashboard.form.generating') : t('admin.user.docs.delete')}</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {/* Pagination */}
                      {totalPages > 1 && (
                        <div className="flex justify-center items-center gap-2 mb-2">
                          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-2 py-1 rounded bg-dark-400/50 border border-dark-500 text-primary-100 disabled:opacity-50">&lt;</button>
                          <span className="text-primary-200 text-sm">{page} / {totalPages}</span>
                          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-2 py-1 rounded bg-dark-400/50 border border-dark-500 text-primary-100 disabled:opacity-50">&gt;</button>
                        </div>
                      )}
                    </>
                  )}
                  {/* Modale contenu document */}
                  {showDocContent && (
                    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                      <div className="bg-dark-300/95 rounded-xl shadow-glass p-8 w-full max-w-3xl border border-dark-400/40 relative overflow-y-auto max-h-[90vh]">
                        <button onClick={() => setShowDocContent(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white text-xl">&times;</button>
                        <h4 className="text-lg font-bold text-primary-400 mb-4">{docContentTitle}</h4>
                        <div className="prose prose-invert max-w-none">
                          <ReactMarkdown>{docContent}</ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'plans' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-primary-200">
              <thead>
                <tr className="text-left border-b border-dark-500">
                  <th className="px-2 py-1">{t('plans.table.name')}</th>
                  <th className="px-2 py-1">{t('plans.table.price')}</th>
                  <th className="px-2 py-1">{t('plans.table.page_limit')}</th>
                  <th className="px-2 py-1">{t('plans.table.description')}</th>
                </tr>
              </thead>
              <tbody>
                {plans.map(p => (
                  <tr key={p.id} className="border-b border-dark-500/50">
                    <td className="px-2 py-1">{p.name}</td>
                    <td className="px-2 py-1">{p.price}</td>
                    <td className="px-2 py-1">{p.page_limit || t('admin.table.unlimited')}</td>
                    <td className="px-2 py-1">{t('plans.' + p.name + '.description')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'licences' && (
          <div className="overflow-x-auto bg-dark-300/80 rounded-xl p-6 shadow-card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-primary-300">{t('admin.tabs.licenses')}</h2>
              <button onClick={() => setShowLicenceModal(true)} className="bg-primary-500 text-white px-4 py-2 rounded-xl font-semibold shadow-card hover:bg-primary-600">{t('admin.license.generate')}</button>
            </div>
            <table className="min-w-full text-sm mb-4">
              <thead>
                <tr className="text-primary-400">
                  <th className="px-2 py-1">{t('Clé')}</th>
                  <th className="px-2 py-1">{t('Plan')}</th>
                  <th className="px-2 py-1">{t('Statut')}</th>
                  <th className="px-2 py-1">{t('Attribuée à')}</th>
                  <th className="px-2 py-1">{t('Émise le')}</th>
                  <th className="px-2 py-1">{t('Expire le')}</th>
                </tr>
              </thead>
              <tbody>
                {licences.map(l => (
                  <tr key={l.id} className="border-b border-dark-500/30">
                    <td className="px-2 py-1 font-mono text-xs">{l.key}</td>
                    <td className="px-2 py-1">{l.plan}</td>
                    <td className="px-2 py-1">{l.status}</td>
                    <td className="px-2 py-1">{l.user_id || '-'}</td>
                    <td className="px-2 py-1">{new Date(l.issued_at).toLocaleDateString()}</td>
                    <td className="px-2 py-1">{l.expires_at ? new Date(l.expires_at).toLocaleDateString() : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {licenceMsg && <div className="text-primary-400 mb-2">{licenceMsg}</div>}
          </div>
        )}

        {tab === 'memoires' && (
          <div className="overflow-x-auto bg-dark-300/80 rounded-xl p-6 shadow-card">
            <h2 className="text-xl font-bold text-primary-300 mb-4">{t('admin.tabs.theses')}</h2>
            <form onSubmit={async (e) => {
              e.preventDefault();
              setMemoireMsg('');
              try {
                const headers = { Authorization: `Bearer ${token}` };
                await axios.post('http://localhost:3001/api/memoires/generate-advanced', {
                  ...memoireForm,
                  userId: memoireUserId,
                  lang: i18n.language
                }, { headers });
                setMemoireMsg('Mémoire généré avec succès !');
                fetchAllMemoires();
              } catch (e) {
                setMemoireMsg(t('admin.error.thesis'));
              }
            }} className="space-y-4 mb-8">
              <div>
                <label className="block text-sm font-medium text-primary-300 mb-2">{t('Utilisateur')}</label>
                <select value={memoireUserId} onChange={e => setMemoireUserId(e.target.value)} className="w-full rounded-xl bg-dark-400/50 border border-dark-500 text-white p-2">
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.full_name} ({u.email})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-300 mb-2">{t('Type de document')}</label>
                <select value={memoireForm.type} onChange={e => setMemoireForm(f => ({...f, type: e.target.value}))} className="w-full rounded-xl bg-dark-400/50 border border-dark-500 text-white p-2">
                  <option value={t('dashboard.form.type.options.tfc')}>{t('dashboard.form.type.options.tfc')}</option>
                  <option value={t('dashboard.form.type.options.memoire')}>{t('dashboard.form.type.options.memoire')}</option>
                  <option value={t('dashboard.form.type.options.rapport')}>{t('dashboard.form.type.options.rapport')}</option>
                  <option value={t('dashboard.form.type.options.tp')}>{t('dashboard.form.type.options.tp')}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-300 mb-2">{t('Domaine')}</label>
                <input type="text" value={memoireForm.domaine} onChange={e => setMemoireForm(f => ({...f, domaine: e.target.value}))} className="w-full rounded-xl bg-dark-400/50 border border-dark-500 text-white p-2" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-300 mb-2">{t('Sujet')}</label>
                <input type="text" value={memoireForm.sujet} onChange={e => setMemoireForm(f => ({...f, sujet: e.target.value}))} className="w-full rounded-xl bg-dark-400/50 border border-dark-500 text-white p-2" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-300 mb-2">{t('Niveau')}</label>
                <select value={memoireForm.niveau} onChange={e => setMemoireForm(f => ({...f, niveau: e.target.value}))} className="w-full rounded-xl bg-dark-400/50 border border-dark-500 text-white p-2">
                  <option value={t('dashboard.form.niveau.options.licence')}>{t('dashboard.form.niveau.options.licence')}</option>
                  <option value={t('dashboard.form.niveau.options.master')}>{t('dashboard.form.niveau.options.master')}</option>
                  <option value={t('dashboard.form.niveau.options.doctorat')}>{t('dashboard.form.niveau.options.doctorat')}</option>
                </select>
              </div>
              <button type="submit" className="bg-primary-500 text-white px-4 py-2 rounded-xl font-semibold shadow-card hover:bg-primary-600">{t('Générer')}</button>
              {memoireMsg && <div className="text-primary-400 mb-2">{memoireMsg}</div>}
            </form>
            <h2 className="text-xl font-bold text-primary-300 mb-4">{t('Tous les mémoires')}</h2>
            <table className="min-w-full text-sm mb-4">
              <thead>
                <tr className="text-primary-400">
                  <th className="px-2 py-1">ID</th>
                  <th className="px-2 py-1">{t('Utilisateur')}</th>
                  <th className="px-2 py-1">{t('Sujet')}</th>
                  <th className="px-2 py-1">{t('Domaine')}</th>
                  <th className="px-2 py-1">{t('Niveau')}</th>
                  <th className="px-2 py-1">{t('dashboard.created_at')}</th>
                </tr>
              </thead>
              <tbody>
                {memoiresAll.map(m => (
                  <tr key={m.id} className="border-b border-dark-500/30">
                    <td className="px-2 py-1">{m.id}</td>
                    <td className="px-2 py-1">{users.find(u => u.id === m.user_id)?.full_name || m.user_id}</td>
                    <td className="px-2 py-1">{m.sujet}</td>
                    <td className="px-2 py-1">{m.domaine}</td>
                    <td className="px-2 py-1">{m.niveau}</td>
                    <td className="px-2 py-1">{new Date(m.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal génération licence */}
        {showLicenceModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-dark-300/95 rounded-xl shadow-glass p-8 w-full max-w-md border border-dark-400/40">
              <h3 className="text-xl font-bold text-primary-400 mb-4">Générer une licence</h3>
              <form onSubmit={handleGenerateLicence} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-primary-300 mb-2">Plan</label>
                  <select value={licencePlan} onChange={e => setLicencePlan(e.target.value)} className="w-full rounded-xl bg-dark-400/50 border border-dark-500 text-white p-2">
                    {plans.map(p => (
                      <option key={p.name} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary-300 mb-2">Date d'expiration (optionnel)</label>
                  <input type="date" value={licenceExpiry} onChange={e => setLicenceExpiry(e.target.value)} className="w-full rounded-xl bg-dark-400/50 border border-dark-500 text-white p-2" />
                </div>
                <div className="flex justify-end space-x-3">
                  <button type="button" onClick={() => setShowLicenceModal(false)} className="px-4 py-2 text-sm text-gray-400 hover:text-gray-300">Annuler</button>
                  <button type="submit" className="bg-primary-500 text-white px-4 py-2 rounded-xl font-semibold shadow-card hover:bg-primary-600">Générer</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard; 