import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LanguageSwitcher from './LanguageSwitcher';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-glass shadow-glass backdrop-blur-md border-b border-dark-400/40 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2 select-none">
            <span className="text-2xl font-extrabold text-primary-400 tracking-tight drop-shadow">Memo AI</span>
          </Link>

          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <span className="text-primary-200 font-medium">Bienvenue, {user?.email}</span>
                {user?.role === 'admin' && (
                  <button
                    onClick={() => navigate('/admin')}
                    className="bg-gradient-to-r from-primary-400 to-primary-600 hover:from-primary-500 hover:to-primary-700 text-white px-4 py-2 rounded-xl font-semibold shadow-card transition-all duration-200"
                  >
                    Admin
                  </button>
                )}
                <button
                  onClick={handleLogout}
                  className="bg-gradient-to-r from-primary-500 to-primary-700 hover:from-primary-600 hover:to-primary-800 text-white px-4 py-2 rounded-xl font-semibold shadow-card transition-all duration-200"
                >
                  Déconnexion
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-primary-200 hover:text-primary-400 font-medium transition-colors"
                >
                  Connexion
                </Link>
                <Link
                  to="/register"
                  className="bg-gradient-to-r from-primary-500 to-primary-700 hover:from-primary-600 hover:to-primary-800 text-white px-4 py-2 rounded-xl font-semibold shadow-card transition-all duration-200"
                >
                  Inscription
                </Link>
              </>
            )}
            <Link
              to="/plans"
              className="text-primary-200 hover:text-primary-400 font-medium transition-colors"
            >
              Tarifs
            </Link>
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 