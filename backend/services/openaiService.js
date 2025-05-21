const fs = require('fs');
const path = require('path');
const axios = require('axios');
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

async function generateMemoireContent(sujet, domaine, niveau) {
  const prompt = `Tu es un expert en rédaction académique. Rédige un mémoire de fin d'études niveau ${niveau} dans le domaine ${domaine} sur le sujet suivant : ${sujet}. Structure-le avec une table des matières, introduction, développement, conclusion, bibliographie.`;

  const response = await axios.post('https://api.openai.com/v1/chat/completions', {
    model: "gpt-4",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7
  }, {
    headers: {
      'Authorization': `Bearer ${config.openai_api_key}`,
      'Content-Type': 'application/json'
    }
  });

  return response.data.choices[0].message.content;
}

module.exports = { generateMemoireContent };