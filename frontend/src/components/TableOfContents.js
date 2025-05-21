import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const TableOfContents = ({ content, onSectionClick, onEnrichClick }) => {
  const { t } = useTranslation();
  const [sections, setSections] = useState([]);

  useEffect(() => {
    // Parse le contenu pour extraire les sections
    const lines = content.split('\n');
    const parsedSections = [];
    let currentSection = null;

    lines.forEach((line, index) => {
      if (line.startsWith('# ')) {
        if (currentSection) {
          parsedSections.push(currentSection);
        }
        currentSection = {
          title: line.replace('# ', '').trim(),
          level: 1,
          lineNumber: index,
          children: []
        };
      } else if (line.startsWith('## ')) {
        if (currentSection) {
          currentSection.children.push({
            title: line.replace('## ', '').trim(),
            level: 2,
            lineNumber: index,
            children: []
          });
        }
      } else if (line.startsWith('### ')) {
        if (currentSection && currentSection.children.length > 0) {
          const lastChild = currentSection.children[currentSection.children.length - 1];
          lastChild.children.push({
            title: line.replace('### ', '').trim(),
            level: 3,
            lineNumber: index
          });
        }
      }
    });

    if (currentSection) {
      parsedSections.push(currentSection);
    }

    setSections(parsedSections);
  }, [content]);

  const renderSection = (section, index) => {
    return (
      <div key={index} className="mb-2">
        <div className="flex items-center group">
          <button
            onClick={() => onSectionClick(section.lineNumber)}
            className="text-primary-300 hover:text-primary-400 text-sm font-medium flex-grow text-left"
          >
            {section.title}
          </button>
          <button
            onClick={() => onEnrichClick(section)}
            className="opacity-0 group-hover:opacity-100 text-xs bg-primary-500/20 hover:bg-primary-500/30 text-primary-300 px-2 py-1 rounded transition-all duration-200"
          >
            {t('toc.enrich')}
          </button>
        </div>
        {section.children.map((child, childIndex) => (
          <div key={childIndex} className="ml-4 mt-1">
            <div className="flex items-center group">
              <button
                onClick={() => onSectionClick(child.lineNumber)}
                className="text-gray-400 hover:text-gray-300 text-sm flex-grow text-left"
              >
                {child.title}
              </button>
              <button
                onClick={() => onEnrichClick(child)}
                className="opacity-0 group-hover:opacity-100 text-xs bg-primary-500/20 hover:bg-primary-500/30 text-primary-300 px-2 py-1 rounded transition-all duration-200"
              >
                {t('toc.enrich')}
              </button>
            </div>
            {child.children.map((subChild, subChildIndex) => (
              <div key={subChildIndex} className="ml-4 mt-1">
                <div className="flex items-center group">
                  <button
                    onClick={() => onSectionClick(subChild.lineNumber)}
                    className="text-gray-500 hover:text-gray-400 text-sm flex-grow text-left"
                  >
                    {subChild.title}
                  </button>
                  <button
                    onClick={() => onEnrichClick(subChild)}
                    className="opacity-0 group-hover:opacity-100 text-xs bg-primary-500/20 hover:bg-primary-500/30 text-primary-300 px-2 py-1 rounded transition-all duration-200"
                  >
                    {t('toc.enrich')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-dark-300/80 rounded-xl shadow-card border border-dark-500/30 p-4">
      <h3 className="text-primary-300 font-semibold text-sm mb-4 border-b border-dark-500/30 pb-2">
        {t('toc.title')}
      </h3>
      <div className="space-y-1">
        {sections.map(renderSection)}
      </div>
    </div>
  );
};

export default TableOfContents; 