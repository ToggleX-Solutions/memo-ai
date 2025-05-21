const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const config = require('../../config/config.json');

// Route d'inscription
router.post('/register', async (req, res) => {
  try {
    const { email, password, full_name, plan } = req.body;

    // Vérification si l'utilisateur existe déjà
    const userExists = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (userExists.rows.length > 0) {
      return res.status(400).json({
        error: true,
        message: 'Un utilisateur avec cet email existe déjà'
      });
    }

    // Détermination du rôle
    let role = 'user';
    if (email === 'toggleinc.rdc@gmail.com') {
      role = 'admin';
    }

    // Plan choisi ou free par défaut
    const selectedPlan = plan || 'free';

    // Hashage du mot de passe
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Création de l'utilisateur
    const newUser = await pool.query(
      'INSERT INTO users (email, password_hash, full_name, role, plan, licence, created_at) VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING id, email, full_name, role, plan, licence, created_at',
      [email, hashedPassword, full_name, role, selectedPlan, null]
    );

    // Génération du token JWT
    const token = jwt.sign(
      { id: newUser.rows[0].id, email: newUser.rows[0].email, role: newUser.rows[0].role, plan: newUser.rows[0].plan },
      config.jwt_secret,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      error: false,
      message: 'Utilisateur créé avec succès',
      user: {
        id: newUser.rows[0].id,
        email: newUser.rows[0].email,
        full_name: newUser.rows[0].full_name,
        role: newUser.rows[0].role,
        plan: newUser.rows[0].plan,
        licence: newUser.rows[0].licence,
        created_at: newUser.rows[0].created_at
      },
      token
    });
  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    res.status(500).json({
      error: true,
      message: 'Erreur lors de l\'inscription'
    });
  }
});

// Route de connexion
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Vérification si l'utilisateur existe
    const user = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (user.rows.length === 0) {
      return res.status(401).json({
        error: true,
        message: 'Email ou mot de passe incorrect'
      });
    }

    // Vérification du mot de passe
    const validPassword = await bcrypt.compare(password, user.rows[0].password_hash);
    if (!validPassword) {
      return res.status(401).json({
        error: true,
        message: 'Email ou mot de passe incorrect'
      });
    }

    // Génération du token JWT
    const token = jwt.sign(
      { id: user.rows[0].id, email: user.rows[0].email, role: user.rows[0].role, plan: user.rows[0].plan },
      config.jwt_secret,
      { expiresIn: '24h' }
    );

    res.json({
      error: false,
      message: 'Connexion réussie',
      user: {
        id: user.rows[0].id,
        email: user.rows[0].email,
        full_name: user.rows[0].full_name,
        role: user.rows[0].role,
        plan: user.rows[0].plan,
        licence: user.rows[0].licence,
        created_at: user.rows[0].created_at
      },
      token
    });
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    res.status(500).json({
      error: true,
      message: 'Erreur lors de la connexion'
    });
  }
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

// Route pour obtenir les informations de l'utilisateur connecté
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await pool.query(
      'SELECT id, email, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (user.rows.length === 0) {
      return res.status(404).json({
        error: true,
        message: 'Utilisateur non trouvé'
      });
    }

    res.json({
      error: false,
      user: user.rows[0]
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des informations utilisateur:', error);
    res.status(500).json({
      error: true,
      message: 'Erreur lors de la récupération des informations utilisateur'
    });
  }
});

module.exports = {
  router,
  verifyToken
}; 