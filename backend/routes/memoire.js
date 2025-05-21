const express = require('express');
const router = express.Router();
const pool = require('../db');
const { OpenAI } = require('openai');
let config;
try {
  config = require('../../config/config.json');
} catch (e) {
  config = {
    openai_api_key: process.env.OPENAI_API_KEY,
    port: process.env.PORT || 3001,
    database_url: process.env.DATABASE_URL,
    jwt_secret: process.env.JWT_SECRET,
    cors_origin: process.env.CORS_ORIGIN,
    openai_model: process.env.OPENAI_MODEL,
    max_tokens: process.env.MAX_TOKENS ? parseInt(process.env.MAX_TOKENS) : 4000
  };
}
const jwt = require('jsonwebtoken');

// Initialisation de l'API OpenAI
const openai = new OpenAI({
  apiKey: config.openai_api_key
});

// Middleware de vérification du token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      error: true,
      message: 'Token d\'authentification manquant'
    });
  }

  try {
    const decoded = jwt.verify(token, config.jwt_secret);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      error: true,
      message: 'Token invalide'
    });
  }
};

// Middleware de limitation selon le plan
const limitGeneration = async (req, res, next) => {
  try {
    // Si admin et userId fourni dans le body, vérifier la limite pour cet utilisateur
    let userId = req.user.id;
    if (req.user.role === 'admin' && req.body.userId) {
      userId = parseInt(req.body.userId, 10);
    }
    // Récupérer l'utilisateur
    const userRes = await pool.query('SELECT plan, licence FROM users WHERE id = $1', [userId]);
    if (userRes.rows.length === 0) {
      return res.status(403).json({ error: true, message: 'Utilisateur non trouvé' });
    }
    const user = userRes.rows[0];
    // Récupérer le plan
    const planRes = await pool.query('SELECT * FROM plans WHERE name = $1', [user.plan]);
    const plan = planRes.rows[0];
    // Compter le nombre de mémoires générés
    const memCountRes = await pool.query('SELECT COUNT(*) FROM memoires WHERE user_id = $1', [userId]);
    const memCount = parseInt(memCountRes.rows[0].count, 10);
    // Limite selon le plan
    if (plan && plan.page_limit && memCount >= plan.page_limit) {
      return res.status(403).json({ error: true, message: `Limite atteinte pour le plan ${plan.name}. Veuillez passer à un plan supérieur.` });
    }
    next();
  } catch (error) {
    return res.status(500).json({ error: true, message: 'Erreur lors de la vérification du plan' });
  }
};

// Route pour générer un nouveau mémoire
router.post('/generate', verifyToken, async (req, res) => {
  try {
    const { domaine, sujet, niveau } = req.body;
    const userId = req.user.id;

    // Vérification des champs requis
    if (!domaine || !sujet || !niveau) {
      return res.status(400).json({
        error: true,
        message: 'Tous les champs sont requis (domaine, sujet, niveau)'
      });
    }

    // Construction du prompt pour l'IA
    const prompt = `
Tu es un assistant académique expert. Rédige un mémoire complet, long et détaillé de niveau ${niveau} dans le domaine ${domaine} sur le sujet : "${sujet}".

Contraintes :
- Utilise la structure académique classique : introduction, plusieurs chapitres détaillés (avec sous-parties), conclusion, bibliographie (APA), annexes.
- Chaque chapitre doit faire au moins 2 pages Word, avec des sous-parties, des exemples, des citations, des arguments, des transitions.
- Génère une table des matières en début de document.
- Utilise la syntaxe Markdown pour la structure :
  - # pour les titres de chapitres
  - ## pour les sous-parties
  - ### pour les sous-sous-parties
  - Texte normal pour les paragraphes
- Ajoute des sauts de page logiques (un chapitre = une page Word minimum)
- La bibliographie doit être au format APA.
- Les annexes doivent être à la fin.
- Le texte doit être long, argumenté, académique, sans répétition inutile.

Exemple de structure attendue :

# Introduction
(paragraphe long...)
# Chapitre 1 : ...
## 1.1 ...
(paragraphe...)
## 1.2 ...
(paragraphe...)
# Chapitre 2 : ...
# Conclusion
# Bibliographie
# Annexes

Commence par la table des matières, puis rédige chaque section en respectant la structure ci-dessus.
`;

    // Appel à l'API OpenAI
    const completion = await openai.chat.completions.create({
      model: config.openai_model,
      messages: [
        { role: "system", content: "Tu es un assistant académique spécialisé dans la rédaction de mémoires et travaux de fin d'études." },
        { role: "user", content: prompt }
      ],
      max_tokens: config.max_tokens
    });

    const contenu = completion.choices[0].message.content;

    // Sauvegarde du mémoire dans la base de données
    const newMemoire = await pool.query(
      'INSERT INTO memoires (user_id, sujet, domaine, niveau, contenu, created_at) VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING id, sujet, domaine, niveau, created_at',
      [userId, sujet, domaine, niveau, contenu]
    );

    res.status(201).json({
      error: false,
      message: 'Mémoire généré avec succès',
      memoire: {
        id: newMemoire.rows[0].id,
        sujet: newMemoire.rows[0].sujet,
        domaine: newMemoire.rows[0].domaine,
        niveau: newMemoire.rows[0].niveau,
        contenu,
        created_at: newMemoire.rows[0].created_at
      }
    });
  } catch (error) {
    console.error('Erreur lors de la génération du mémoire:', error);
    res.status(500).json({
      error: true,
      message: 'Erreur lors de la génération du mémoire'
    });
  }
});

// Nouvelle route pour génération avancée par étapes
router.post('/generate-advanced', verifyToken, limitGeneration, async (req, res) => {
  try {
    const { type = 'Mémoire', domaine, sujet, niveau, userId: userIdBody, lang = 'fr' } = req.body;
    // Si admin et userId fourni, générer pour cet utilisateur, sinon pour soi-même
    let userId = req.user.id;
    if (req.user.role === 'admin' && userIdBody) {
      userId = parseInt(userIdBody, 10);
    }
    if (!domaine || !sujet || !niveau) {
      return res.status(400).json({ error: true, message: 'Tous les champs sont requis (domaine, sujet, niveau)' });
    }

    // Traduction dynamique type/niveau
    let typeTr = type;
    let niveauTr = niveau;
    if (lang === 'en') {
      if (/^mémoire$/i.test(type)) typeTr = 'Thesis';
      if (/^tfc$/i.test(type)) typeTr = 'TFC';
      if (/^rapport( de stage)?$/i.test(type)) typeTr = 'Internship report';
      if (/^tp$/i.test(type)) typeTr = 'Lab work';
      if (/^licence$/i.test(niveau)) niveauTr = 'Bachelor';
      if (/^master$/i.test(niveau)) niveauTr = 'Master';
      if (/^doctorat$/i.test(niveau)) niveauTr = 'PhD';
    } else {
      if (/^thesis$/i.test(type)) typeTr = 'Mémoire';
      if (/^internship report$/i.test(type)) typeTr = 'Rapport de stage';
      if (/^lab work$/i.test(type)) typeTr = 'TP';
      if (/^bachelor$/i.test(niveau)) niveauTr = 'Licence';
      if (/^phd$/i.test(niveau)) niveauTr = 'Doctorat';
    }

    // Prompts multilingues
    const isEn = lang === 'en';

    // 1. Générer la table des matières
    const promptTDM = isEn ?
      `You are an academic assistant. Propose a detailed and academic table of contents for a ${typeTr.toLowerCase()} at the ${niveauTr} level in the field of ${domaine} on the topic: "${sujet}".
Structure the table of contents with chapters (#), sub-sections (##), sub-sub-sections (###) in Markdown.
Example:
# Introduction
# Chapter 1: ...
## 1.1 ...
## 1.2 ...
# Chapter 2: ...
# Conclusion
# Bibliography
# Appendices
` :
      `Tu es un assistant académique. Propose une table des matières détaillée et académique pour un ${typeTr.toLowerCase()} de niveau ${niveauTr} dans le domaine ${domaine} sur le sujet : "${sujet}".
Structure la table des matières avec des chapitres (#), sous-parties (##), sous-sous-parties (###) en Markdown.
Exemple :
# Introduction
# Chapitre 1 : ...
## 1.1 ...
## 1.2 ...
# Chapitre 2 : ...
# Conclusion
# Bibliographie
# Annexes
`;
    const tdmCompletion = await openai.chat.completions.create({
      model: config.openai_model,
      messages: [
        { role: "system", content: "Tu es un assistant académique spécialisé dans la rédaction de mémoires et travaux de fin d'études." },
        { role: "user", content: promptTDM }
      ],
      max_tokens: 800
    });
    const tableDesMatieres = tdmCompletion.choices[0].message.content;

    // 2. Extraire les titres de chapitres à partir de la TDM
    const chapitreRegex = /^# (.+)$/gm;
    const chapitres = [];
    let match;
    while ((match = chapitreRegex.exec(tableDesMatieres)) !== null) {
      const titre = match[1].trim();
      if (!/introduction|conclusion|bibliographie|annexes/i.test(titre)) {
        chapitres.push(titre);
      }
    }

    // 3. Générer chaque chapitre séparément
    let contenu = `# Table des matières\n${tableDesMatieres}\n`;
    // Introduction
    const introPrompt = isEn ?
      `Write a long and detailed academic introduction for a ${typeTr.toLowerCase()} at the ${niveauTr} level in the field of ${domaine} on the topic: "${sujet}". Use Markdown syntax (# Introduction).` :
      `Rédige une introduction académique longue et détaillée pour un ${typeTr.toLowerCase()} de niveau ${niveauTr} dans le domaine ${domaine} sur le sujet : "${sujet}". Utilise la syntaxe Markdown (# Introduction).`;
    const introCompletion = await openai.chat.completions.create({
      model: config.openai_model,
      messages: [
        { role: "system", content: "Tu es un assistant académique spécialisé dans la rédaction de mémoires et travaux de fin d'études." },
        { role: "user", content: introPrompt }
      ],
      max_tokens: 1200
    });
    contenu += `\n${introCompletion.choices[0].message.content}\n`;
    // Chapitres principaux
    for (const chapitre of chapitres) {
      const chapitrePrompt = isEn ?
        `Write the chapter titled "${chapitre}" for a ${typeTr.toLowerCase()} at the ${niveauTr} level in the field of ${domaine} on the topic: "${sujet}". The chapter should be long, structured in sub-sections (##, ###), with examples, citations, arguments, and be at least 2 Word pages. Use Markdown syntax.` :
        `Rédige le chapitre intitulé "${chapitre}" pour un ${typeTr.toLowerCase()} de niveau ${niveauTr} dans le domaine ${domaine} sur le sujet : "${sujet}". Le chapitre doit être long, structuré en sous-parties (##, ###), avec des exemples, des citations, des arguments, et faire au moins 2 pages Word. Utilise la syntaxe Markdown.`;
      const chapitreCompletion = await openai.chat.completions.create({
        model: config.openai_model,
        messages: [
          { role: "system", content: "Tu es un assistant académique spécialisé dans la rédaction de mémoires et travaux de fin d'études." },
          { role: "user", content: chapitrePrompt }
        ],
        max_tokens: 2000
      });
      contenu += `\n${chapitreCompletion.choices[0].message.content}\n`;
    }
    // Conclusion
    const conclusionPrompt = isEn ?
      `Write a long and synthetic academic conclusion for this ${typeTr.toLowerCase()}. Use Markdown syntax (# Conclusion).` :
      `Rédige une conclusion académique longue et synthétique pour ce ${typeTr.toLowerCase()}. Utilise la syntaxe Markdown (# Conclusion).`;
    const conclusionCompletion = await openai.chat.completions.create({
      model: config.openai_model,
      messages: [
        { role: "system", content: "Tu es un assistant académique spécialisé dans la rédaction de mémoires et travaux de fin d'études." },
        { role: "user", content: conclusionPrompt }
      ],
      max_tokens: 800
    });
    contenu += `\n${conclusionCompletion.choices[0].message.content}\n`;
    // Bibliographie
    const biblioPrompt = isEn ?
      `Generate an academic bibliography in APA format for this ${typeTr.toLowerCase()}. Use Markdown syntax (# Bibliography).` :
      `Génère une bibliographie académique au format APA pour ce ${typeTr.toLowerCase()}. Utilise la syntaxe Markdown (# Bibliographie).`;
    const biblioCompletion = await openai.chat.completions.create({
      model: config.openai_model,
      messages: [
        { role: "system", content: "Tu es un assistant académique spécialisé dans la rédaction de mémoires et travaux de fin d'études." },
        { role: "user", content: biblioPrompt }
      ],
      max_tokens: 600
    });
    contenu += `\n${biblioCompletion.choices[0].message.content}\n`;
    // Annexes
    const annexesPrompt = isEn ?
      `Generate relevant appendices for this ${typeTr.toLowerCase()}. Use Markdown syntax (# Appendices).` :
      `Génère des annexes pertinentes pour ce ${typeTr.toLowerCase()}. Utilise la syntaxe Markdown (# Annexes).`;
    const annexesCompletion = await openai.chat.completions.create({
      model: config.openai_model,
      messages: [
        { role: "system", content: "Tu es un assistant académique spécialisé dans la rédaction de mémoires et travaux de fin d'études." },
        { role: "user", content: annexesPrompt }
      ],
      max_tokens: 600
    });
    contenu += `\n${annexesCompletion.choices[0].message.content}\n`;

    // 4. Sauvegarde du mémoire dans la base de données
    const newMemoire = await pool.query(
      'INSERT INTO memoires (user_id, sujet, domaine, niveau, contenu, created_at, type) VALUES ($1, $2, $3, $4, $5, NOW(), $6) RETURNING id, sujet, domaine, niveau, type, created_at',
      [userId, sujet, domaine, niveauTr, contenu, typeTr]
    );

    res.status(201).json({
      error: false,
      message: 'Mémoire généré avec succès (avancé)',
      memoire: {
        id: newMemoire.rows[0].id,
        sujet: newMemoire.rows[0].sujet,
        domaine: newMemoire.rows[0].domaine,
        niveau: newMemoire.rows[0].niveau,
        type: newMemoire.rows[0].type,
        contenu,
        created_at: newMemoire.rows[0].created_at
      }
    });
  } catch (error) {
    console.error('Erreur lors de la génération avancée du mémoire:', error);
    res.status(500).json({ error: true, message: 'Erreur lors de la génération avancée du mémoire' });
  }
});

// Route pour obtenir tous les mémoires d'un utilisateur
router.get('/user/:userId', verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;

    // Vérification que l'utilisateur demande ses propres mémoires
    if (req.user.id !== parseInt(userId)) {
      return res.status(403).json({
        error: true,
        message: 'Accès non autorisé'
      });
    }

    const memoires = await pool.query(
      'SELECT id, sujet, domaine, niveau, created_at FROM memoires WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );

    res.json({
      error: false,
      memoires: memoires.rows
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des mémoires:', error);
    res.status(500).json({
      error: true,
      message: 'Erreur lors de la récupération des mémoires'
    });
  }
});

// Route pour obtenir un mémoire spécifique
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const memoire = await pool.query(
      'SELECT * FROM memoires WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (memoire.rows.length === 0) {
      return res.status(404).json({
        error: true,
        message: 'Mémoire non trouvé'
      });
    }

    res.json({
      error: false,
      memoire: memoire.rows[0]
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du mémoire:', error);
    res.status(500).json({
      error: true,
      message: 'Erreur lors de la récupération du mémoire'
    });
  }
});

// Route pour mettre à jour un mémoire
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { contenu } = req.body;

    if (!contenu) {
      return res.status(400).json({
        error: true,
        message: 'Le contenu est requis'
      });
    }

    const updatedMemoire = await pool.query(
      'UPDATE memoires SET contenu = $1 WHERE id = $2 AND user_id = $3 RETURNING id, sujet, domaine, niveau, created_at',
      [contenu, id, userId]
    );

    if (updatedMemoire.rows.length === 0) {
      return res.status(404).json({
        error: true,
        message: 'Mémoire non trouvé'
      });
    }

    res.json({
      error: false,
      message: 'Mémoire mis à jour avec succès',
      memoire: {
        ...updatedMemoire.rows[0],
        contenu
      }
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du mémoire:', error);
    res.status(500).json({
      error: true,
      message: 'Erreur lors de la mise à jour du mémoire'
    });
  }
});

// Route pour supprimer un mémoire
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const deletedMemoire = await pool.query(
      'DELETE FROM memoires WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );

    if (deletedMemoire.rows.length === 0) {
      return res.status(404).json({
        error: true,
        message: 'Mémoire non trouvé'
      });
    }

    res.json({
      error: false,
      message: 'Mémoire supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression du mémoire:', error);
    res.status(500).json({
      error: true,
      message: 'Erreur lors de la suppression du mémoire'
    });
  }
});

// Route pour enrichir une section spécifique
router.post('/:id/enrich', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { section, prompt, lineNumber } = req.body;
    const userId = req.user.id;

    // Vérifier que le mémoire existe et appartient à l'utilisateur
    const memoire = await pool.query(
      'SELECT * FROM memoires WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (memoire.rows.length === 0) {
      return res.status(404).json({
        error: true,
        message: 'Mémoire non trouvé'
      });
    }

    // Extraire le contenu actuel
    const contenu = memoire.rows[0].contenu;
    const lines = contenu.split('\n');

    // Trouver la section à enrichir
    let sectionStart = lineNumber;
    let sectionEnd = lines.length;
    let currentLevel = lines[lineNumber].match(/^#+/)[0].length;

    // Trouver la fin de la section (prochain titre de même niveau ou supérieur)
    for (let i = lineNumber + 1; i < lines.length; i++) {
      const match = lines[i].match(/^(#+)\s/);
      if (match && match[1].length <= currentLevel) {
        sectionEnd = i;
        break;
      }
    }

    // Extraire le contenu de la section
    const sectionContent = lines.slice(sectionStart, sectionEnd).join('\n');

    // Construire le prompt pour l'IA
    const enrichPrompt = `
Tu es un assistant académique expert. Enrichis la section suivante d'un mémoire en suivant ces instructions : "${prompt}"

Section à enrichir :
${sectionContent}

Contraintes :
- Garde la même structure et le même niveau de détail
- Conserve le style académique
- Ajoute des exemples, citations ou arguments pertinents
- Assure-toi que le contenu enrichi s'intègre naturellement
- Utilise la même syntaxe Markdown
- Ne modifie pas les titres ou la structure des sous-sections
`;

    // Appel à l'API OpenAI
    const completion = await openai.chat.completions.create({
      model: config.openai_model,
      messages: [
        { role: "system", content: "Tu es un assistant académique spécialisé dans la rédaction de mémoires et travaux de fin d'études." },
        { role: "user", content: enrichPrompt }
      ],
      max_tokens: 2000
    });

    // Remplacer la section par la version enrichie
    const enrichedContent = completion.choices[0].message.content;
    const newContent = [
      ...lines.slice(0, sectionStart),
      enrichedContent,
      ...lines.slice(sectionEnd)
    ].join('\n');

    // Mettre à jour le mémoire
    await pool.query(
      'UPDATE memoires SET contenu = $1 WHERE id = $2',
      [newContent, id]
    );

    res.json({
      error: false,
      message: 'Section enrichie avec succès',
      contenu: newContent
    });
  } catch (error) {
    console.error('Erreur lors de l\'enrichissement de la section:', error);
    res.status(500).json({
      error: true,
      message: 'Erreur lors de l\'enrichissement de la section'
    });
  }
});

module.exports = router;