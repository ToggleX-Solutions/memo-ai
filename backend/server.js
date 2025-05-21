const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const pool = require('./db');
let config;
try {
  config = require('../config/config.json');
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

// Import des routes
const { router: authRoutes } = require('./routes/auth');
const memoireRoutes = require('./routes/memoire');
const exportRoutes = require('./routes/export');
const adminRoutes = require('./routes/admin');

// Initialisation de l'application Express
const app = express();

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    const allowed = ['http://localhost:3000', 'http://localhost:3002'];
    if (!origin || allowed.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(bodyParser.json());

// Test de la connexion à la base de données
pool.connect((err, client, release) => {
  if (err) {
    return console.error('Erreur de connexion à la base de données:', err.stack);
  }
  console.log('Connecté à la base de données PostgreSQL');
  release();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/memoires', memoireRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/admin', adminRoutes);

// Route de test
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Le serveur fonctionne correctement' });
});

// Gestion des erreurs
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: true,
    message: 'Une erreur est survenue sur le serveur'
  });
});

// Démarrage du serveur
const PORT = config.port || 3001;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});

// Export pour les tests
module.exports = { app, pool };