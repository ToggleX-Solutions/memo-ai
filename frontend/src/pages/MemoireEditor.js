import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import Editor from '@monaco-editor/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import TableOfContents from '../components/TableOfContents';
import EnrichmentMenu from '../components/EnrichmentMenu';
import { useTranslation } from 'react-i18next';

const MemoireEditor = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const [memoire, setMemoire] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [selectedSection, setSelectedSection] = useState(null);
  const [showEnrichmentMenu, setShowEnrichmentMenu] = useState(false);
  const { token } = useAuth();
  const navigate = useNavigate();
  const previewRef = useRef(null);
  const editorRef = useRef(null);

  const fetchMemoire = useCallback(async () => {
    try {
      const response = await axios.get(`http://localhost:3001/api/memoires/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setMemoire(response.data.memoire);
    } catch (error) {
      setError(t('editor.error.fetch'));
      navigate('/');
    } finally {
      setLoading(false);
    }
  }, [id, token, navigate, t]);

  useEffect(() => {
    fetchMemoire();
  }, [fetchMemoire]);

  const handleEditorChange = (value) => {
    setMemoire(prev => ({
      ...prev,
      contenu: value
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put(`http://localhost:3001/api/memoires/${id}`, {
        contenu: memoire.contenu
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setSaving(false);
    } catch (error) {
      setError(t('editor.error.save'));
      setSaving(false);
    }
  };

  const handleExport = async (format) => {
    try {
      const response = await axios.post(
        `http://localhost:3001/api/export/${format}/${id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          },
          responseType: 'blob'
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `memoire-${id}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      setError(t('editor.error.export', { format: format.toUpperCase() }));
    }
  };

  const handleSectionClick = (lineNumber) => {
    if (editorRef.current) {
      editorRef.current.revealLineInCenter(lineNumber + 1);
      editorRef.current.setPosition({ lineNumber: lineNumber + 1, column: 1 });
      editorRef.current.focus();
    }
  };

  const handleEnrichClick = (section) => {
    setSelectedSection(section);
    setShowEnrichmentMenu(true);
  };

  const handleEnrich = async (section, prompt) => {
    try {
      const response = await axios.post(
        `http://localhost:3001/api/memoires/${id}/enrich`,
        {
          section: section.title,
          prompt,
          lineNumber: section.lineNumber
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setMemoire(prev => ({
        ...prev,
        contenu: response.data.contenu
      }));
    } catch (error) {
      setError(t('editor.error.enrich'));
    }
  };

  // Synchronisation du scroll
  const handleEditorMount = (editor) => {
    editorRef.current = editor;
    editor.onDidScrollChange(() => {
      if (previewRef.current && editor) {
        const editorScroll = editor.getScrollTop() / (editor.getScrollHeight() - editor.getLayoutInfo().height);
        previewRef.current.scrollTop = editorScroll * (previewRef.current.scrollHeight - previewRef.current.clientHeight);
      }
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-white">{t('editor.loading')}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 font-sans">
      <div className="bg-glass shadow-glass backdrop-blur-md rounded-2xl p-8 border border-dark-400/40">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-extrabold text-primary-400 tracking-tight drop-shadow">{memoire.sujet}</h2>
          <div className="space-x-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-gradient-to-r from-primary-500 to-primary-700 hover:from-primary-600 hover:to-primary-800 text-white px-4 py-2 rounded-xl font-semibold shadow-card transition-all duration-200"
            >
              {saving ? t('editor.saving') : t('editor.save')}
            </button>
            <button
              onClick={() => handleExport('word')}
              className="bg-gradient-to-r from-green-400 to-green-600 hover:from-green-500 hover:to-green-700 text-white px-4 py-2 rounded-xl font-semibold shadow-card transition-all duration-200"
            >
              {t('editor.export.word')}
            </button>
            <button
              onClick={() => handleExport('pdf')}
              className="bg-gradient-to-r from-red-400 to-red-600 hover:from-red-500 hover:to-red-700 text-white px-4 py-2 rounded-xl font-semibold shadow-card transition-all duration-200"
            >
              {t('editor.export.pdf')}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Table des matières */}
          <div className="col-span-2">
            <TableOfContents
              content={memoire.contenu}
              onSectionClick={handleSectionClick}
              onEnrichClick={handleEnrichClick}
            />
          </div>

          {/* Éditeur et Preview */}
          <div className="col-span-10 grid grid-cols-2 gap-6">
            {/* Éditeur */}
            <div className="bg-dark-300/80 rounded-xl shadow-card border border-dark-500/30 overflow-hidden h-[70vh] flex flex-col">
              <div className="px-4 py-2 text-primary-300 font-semibold text-sm border-b border-dark-500/30 bg-dark-400/40">
                {t('editor.markdown')}
              </div>
              <Editor
                height="100%"
                defaultLanguage="markdown"
                value={memoire.contenu}
                onChange={handleEditorChange}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  fontSize: 15,
                  wordWrap: 'on',
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  fontFamily: 'Fira Mono, monospace',
                  smoothScrolling: true
                }}
                onMount={handleEditorMount}
              />
            </div>

            {/* Preview */}
            <div
              ref={previewRef}
              className="bg-dark-300/80 rounded-xl shadow-card border border-dark-500/30 overflow-y-auto h-[70vh] p-6 prose prose-invert max-w-none"
            >
              <div className="text-primary-300 font-semibold text-sm mb-2 border-b border-dark-500/30 pb-2">
                {t('editor.preview')}
              </div>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{memoire.contenu || ''}</ReactMarkdown>
            </div>
          </div>
        </div>
      </div>

      {/* Menu d'enrichissement */}
      {showEnrichmentMenu && selectedSection && (
        <EnrichmentMenu
          section={selectedSection}
          onClose={() => setShowEnrichmentMenu(false)}
          onEnrich={handleEnrich}
        />
      )}
    </div>
  );
};

export default MemoireEditor; 