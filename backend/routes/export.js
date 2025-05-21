const express = require('express');
const router = express.Router();
const pool = require('../db');
const jwt = require('jsonwebtoken');
const { Document, Packer, Paragraph, TextRun, HeadingLevel, TableOfContents, PageBreak } = require('docx');
const PDFDocument = require('pdfkit');
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

// Middleware de vérification du token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: true, message: "Token d'authentification manquant" });
  }
  try {
    const decoded = jwt.verify(token, config.jwt_secret);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: true, message: 'Token invalide' });
  }
};

// Fonction utilitaire pour parser le contenu Markdown-like en blocs structurés
function parseMemoireContent(contenu) {
  const lines = contenu.split('\n');
  const blocks = [];
  let currentBlock = null;
  for (let line of lines) {
    if (/^# /.test(line)) {
      if (currentBlock) blocks.push(currentBlock);
      currentBlock = { type: 'h1', text: line.replace(/^# /, '').trim() };
      blocks.push(currentBlock);
      currentBlock = null;
    } else if (/^## /.test(line)) {
      if (currentBlock) blocks.push(currentBlock);
      currentBlock = { type: 'h2', text: line.replace(/^## /, '').trim() };
      blocks.push(currentBlock);
      currentBlock = null;
    } else if (/^### /.test(line)) {
      if (currentBlock) blocks.push(currentBlock);
      currentBlock = { type: 'h3', text: line.replace(/^### /, '').trim() };
      blocks.push(currentBlock);
      currentBlock = null;
    } else if (line.trim() === '') {
      if (currentBlock) blocks.push(currentBlock);
      currentBlock = null;
    } else {
      if (!currentBlock) currentBlock = { type: 'p', text: '' };
      currentBlock.text += (currentBlock.text ? '\n' : '') + line.trim();
    }
  }
  if (currentBlock) blocks.push(currentBlock);
  return blocks;
}

// Fonction pour créer un document Word structuré
const createWordDocument = (memoire) => {
  const blocks = parseMemoireContent(memoire.contenu);
  const children = [
    new Paragraph({
      text: memoire.sujet,
      heading: HeadingLevel.TITLE,
      alignment: 'center',
      spacing: { after: 400 }
    }),
    new Paragraph({ text: `Domaine: ${memoire.domaine}`, alignment: 'center' }),
    new Paragraph({ text: `Niveau: ${memoire.niveau}`, alignment: 'center', spacing: { after: 400 } }),
    new Paragraph({ text: '' }),
    new Paragraph({
      text: 'Table des matières',
      heading: HeadingLevel.HEADING_1,
      alignment: 'center',
      spacing: { after: 200 }
    }),
    new TableOfContents('Table des matières', {
      hyperlink: true,
      headingStyleRange: '1-3',
    }),
    new Paragraph({ text: '', spacing: { after: 400 } })
  ];
  // Ajout des blocs structurés
  for (const block of blocks) {
    if (block.type === 'h1') {
      children.push(new Paragraph({
        text: block.text,
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 }
      }));
      children.push(new Paragraph({ children: [new PageBreak()] }));
    } else if (block.type === 'h2') {
      children.push(new Paragraph({
        text: block.text,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 100 }
      }));
    } else if (block.type === 'h3') {
      children.push(new Paragraph({
        text: block.text,
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 200, after: 100 }
      }));
    } else if (block.type === 'p') {
      children.push(new Paragraph({
        text: block.text,
        spacing: { after: 200 }
      }));
    }
  }
  const doc = new Document({
    sections: [{
      properties: {},
      children
    }]
  });
  return doc;
};

// Fonction pour créer un document PDF structuré
const createPDFDocument = (memoire) => {
  const blocks = parseMemoireContent(memoire.contenu);
  const doc = new PDFDocument({ autoFirstPage: false });
  const chunks = [];
  let toc = [];
  let pageCount = 0;

  doc.on('data', chunk => chunks.push(chunk));
  doc.on('end', () => {});

  // 1. Page de titre
  doc.addPage();
  pageCount++;
  doc.fontSize(22).text(memoire.sujet, { align: 'center' });
  doc.moveDown();
  doc.fontSize(14).text(`Domaine: ${memoire.domaine}`, { align: 'center' });
  doc.fontSize(14).text(`Niveau: ${memoire.niveau}`, { align: 'center' });
  doc.moveDown(2);

  // 2. Table des matières sur une page dédiée
  doc.addPage();
  pageCount++;
  doc.fontSize(16).text('Table des matières', { align: 'center' });
  doc.moveDown();
  const tocItems = [];

  // 3. Corps du document
  for (const block of blocks) {
    if (block.type === 'h1') {
      doc.addPage();
      pageCount++;
      tocItems.push({ title: block.text, page: pageCount });
      doc.fontSize(16).fillColor('black').text(block.text, { align: 'left', underline: true });
      doc.moveDown();
    } else if (block.type === 'h2') {
      doc.fontSize(14).fillColor('black').text(block.text, { align: 'left', underline: false });
      doc.moveDown();
    } else if (block.type === 'h3') {
      doc.fontSize(12).fillColor('black').text(block.text, { align: 'left', underline: false });
      doc.moveDown();
    } else if (block.type === 'p') {
      doc.fontSize(12).fillColor('black').text(block.text, { align: 'justify' });
      doc.moveDown();
    }
  }

  // 4. Pagination sur toutes les pages
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    doc.fontSize(10).fillColor('gray').text(`Page ${i + 1}`, 0, doc.page.height - 40, {
      align: 'center'
    });
  }

  // 5. Remplir la table des matières (sur la 2e page) si elle existe
  if (range.count > 1) {
    doc.switchToPage(1); // 0 = titre, 1 = TDM
    doc.moveDown(2);
    doc.fontSize(12).fillColor('black');
    for (const item of tocItems) {
      doc.text(`${item.title} ............................................. ${item.page}`, {
        align: 'left'
      });
    }
  }

  doc.end();
  return new Promise((resolve, reject) => {
    doc.on('end', () => {
      const result = Buffer.concat(chunks);
      resolve(result);
    });
    doc.on('error', reject);
  });
};

// Route pour exporter un mémoire en Word
router.post('/word/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const memoire = await pool.query(
      'SELECT * FROM memoires WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    if (memoire.rows.length === 0) {
      return res.status(404).json({ error: true, message: 'Mémoire non trouvé' });
    }
    const doc = createWordDocument(memoire.rows[0]);
    const buffer = await Packer.toBuffer(doc);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename=memoire-${id}.docx`);
    res.send(buffer);
  } catch (error) {
    console.error('Erreur lors de l\'export en Word:', error);
    res.status(500).json({ error: true, message: 'Erreur lors de l\'export en Word' });
  }
});

// Route pour exporter un mémoire en PDF
router.post('/pdf/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const memoire = await pool.query(
      'SELECT * FROM memoires WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    if (memoire.rows.length === 0) {
      return res.status(404).json({ error: true, message: 'Mémoire non trouvé' });
    }
    const buffer = await createPDFDocument(memoire.rows[0]);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=memoire-${id}.pdf`);
    res.send(buffer);
  } catch (error) {
    console.error('Erreur lors de l\'export en PDF:', error);
    res.status(500).json({ error: true, message: 'Erreur lors de l\'export en PDF' });
  }
});

module.exports = router; 