const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken } = require('./auth');

// Middleware pour vérifier le rôle admin
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ error: true, message: 'Accès réservé à l\'administrateur' });
};

// Liste tous les utilisateurs
router.get('/users', verifyToken, isAdmin, async (req, res) => {
  try {
    const users = await pool.query('SELECT id, email, full_name, role, plan, licence, created_at FROM users ORDER BY created_at DESC');
    res.json({ error: false, users: users.rows });
  } catch (error) {
    res.status(500).json({ error: true, message: 'Erreur lors de la récupération des utilisateurs' });
  }
});

// Liste tous les plans
router.get('/plans', verifyToken, isAdmin, async (req, res) => {
  try {
    const plans = await pool.query('SELECT * FROM plans ORDER BY price_usd');
    res.json({ error: false, plans: plans.rows });
  } catch (error) {
    res.status(500).json({ error: true, message: 'Erreur lors de la récupération des plans' });
  }
});

// Liste toutes les licences
router.get('/licences', verifyToken, isAdmin, async (req, res) => {
  try {
    const licences = await pool.query('SELECT * FROM licences ORDER BY issued_at DESC');
    res.json({ error: false, licences: licences.rows });
  } catch (error) {
    res.status(500).json({ error: true, message: 'Erreur lors de la récupération des licences' });
  }
});

// Génère une nouvelle licence
router.post('/licences', verifyToken, isAdmin, async (req, res) => {
  try {
    const { plan, expires_at } = req.body;
    // Générer une clé unique
    const key = 'LIC-' + Math.random().toString(36).substr(2, 12).toUpperCase();
    const newLicence = await pool.query(
      'INSERT INTO licences (key, plan, expires_at) VALUES ($1, $2, $3) RETURNING *',
      [key, plan, expires_at || null]
    );
    res.status(201).json({ error: false, licence: newLicence.rows[0] });
  } catch (error) {
    res.status(500).json({ error: true, message: 'Erreur lors de la génération de la licence' });
  }
});

module.exports = router; 