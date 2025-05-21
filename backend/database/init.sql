-- Création de la table users
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Création de la table memoires
CREATE TABLE IF NOT EXISTS memoires (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    sujet VARCHAR(255) NOT NULL,
    domaine VARCHAR(100) NOT NULL,
    niveau VARCHAR(50) NOT NULL,
    contenu TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Création d'index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_memoires_user_id ON memoires(user_id);
CREATE INDEX IF NOT EXISTS idx_memoires_created_at ON memoires(created_at);

-- Insertion d'un utilisateur de test (mot de passe: test123)
INSERT INTO users (email, password_hash) VALUES 
('test@example.com', '$2b$10$3euPcmQFCiblsZeEu5s7p.9BUe7Zfz3Uq3Uq3Uq3Uq3Uq3Uq3Uq3Uq3'); 