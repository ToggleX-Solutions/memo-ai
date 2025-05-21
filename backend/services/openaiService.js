const fs = require('fs');
const path = require('path');
const axios = require('axios');
const config = require('../../config/config.json');

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