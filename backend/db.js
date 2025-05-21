const { Pool } = require('pg');
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

const pool = new Pool({
  connectionString: config.database_url
});

module.exports = pool; 