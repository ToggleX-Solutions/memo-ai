const { generateMemoireContent } = require('../services/openaiService');

exports.generateMemoire = async (req, res) => {
  try {
    const { sujet, domaine, niveau } = req.body;
    const content = await generateMemoireContent(sujet, domaine, niveau);
    res.json({ success: true, content });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};