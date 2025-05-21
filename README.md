# Memo AI - Générateur de Mémoires Académiques avec IA

Memo AI est une application SaaS permettant aux étudiants de générer automatiquement des mémoires de fin d'études (TFC, rapports, mémoires de Master, etc.) avec l'aide de l'intelligence artificielle (GPT-4).

## 🚀 Fonctionnalités

- **Génération automatique de mémoires académiques** avec structure complète
- **Interface utilisateur moderne** avec thème sombre élégant
- **Authentification** des utilisateurs
- **Export** en formats Word (.docx) et PDF
- **Historique** des projets générés
- **Éditeur de texte** avec sauvegarde automatique
- **Prévisualisation** en temps réel

## 🛠️ Technologies utilisées

- **Frontend**: React, Tailwind CSS
- **Backend**: Node.js, Express
- **Base de données**: PostgreSQL
- **IA**: OpenAI GPT-4
- **Export**: docx, pdfkit

## 📋 Prérequis

- Node.js (v14+)
- PostgreSQL
- Compte OpenAI avec clé API

## 🔧 Installation

1. **Cloner le dépôt**
   ```bash
   git clone https://github.com/votre-username/memo-ai.git
   cd memo-ai
   ```

2. **Configurer la base de données**
   - Créer une base de données PostgreSQL nommée `memo_ai`
   - Mettre à jour les informations de connexion dans `config/config.json`

3. **Configurer l'API OpenAI**
   - Obtenir une clé API sur [OpenAI](https://platform.openai.com/)
   - Ajouter la clé dans `config/config.json`

4. **Installer les dépendances**
   ```bash
   # Backend
   cd backend
   npm install
   
   # Frontend
   cd ../frontend
   npm install
   ```

5. **Lancer l'application**
   ```bash
   # Backend (depuis le dossier backend)
   npm start
   
   # Frontend (depuis le dossier frontend)
   npm start
   ```

## 📁 Structure du projet

```
/memo-ai
├── /backend
│   ├── /controllers
│   ├── /routes
│   ├── /services
│   └── server.js
├── /frontend
│   ├── /components
│   ├── /pages
│   ├── /styles
│   └── App.js
├── /config
│   └── config.json
└── README.md
```

## 🔐 Configuration

Le fichier `config/config.json` contient toutes les configurations nécessaires :

```json
{
  "openai_api_key": "YOUR_API_KEY_HERE",
  "port": 3001,
  "database_url": "postgresql://user:password@localhost:5432/memo_ai",
  "jwt_secret": "memo_ai_secret_key_change_in_production",
  "cors_origin": "http://localhost:3000",
  "openai_model": "gpt-4",
  "max_tokens": 4000
}
```

## 📝 Utilisation

1. **Créer un compte** ou se connecter
2. **Remplir le formulaire** avec :
   - Domaine d'études
   - Sujet du mémoire
   - Niveau académique
3. **Générer le mémoire** en cliquant sur le bouton "Générer"
4. **Modifier** le contenu généré si nécessaire
5. **Exporter** en format Word ou PDF

## 🔄 API Endpoints

- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `POST /api/generate` - Génération de mémoire
- `GET /api/memoires/:userId` - Liste des mémoires
- `POST /api/export/:format` - Export en Word ou PDF

## 📄 Licence

MIT

## 👥 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou à soumettre une pull request.
