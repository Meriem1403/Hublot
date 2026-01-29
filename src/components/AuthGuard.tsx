import { useEffect, useState } from 'react';
import { isAuthenticated, setAuthenticated, clearSession } from '../utils/security';
import { LoginPage } from './LoginPage';

interface AuthGuardProps {
  children: React.ReactNode;
}

/**
 * Composant de garde d'authentification
 * Protège l'application nécessitant une authentification
 */
export function AuthGuard({ children }: AuthGuardProps) {
  const [isAuth, setIsAuth] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Vérifier l'authentification au chargement
    const checkAuth = () => {
      const auth = isAuthenticated();
      setIsAuth(auth);
      setIsChecking(false);
    };

    checkAuth();
  }, []);

  const handleLoginSuccess = () => {
    setIsAuth(true);
  };

  const handleLogout = () => {
    clearSession();
    setIsAuth(false);
  };

  // Afficher un loader pendant la vérification
  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Vérification de l'accès...</p>
        </div>
      </div>
    );
  }

  // Afficher la page de login si non authentifié
  if (!isAuth) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  // Afficher l'application (le bouton de déconnexion est dans le header de App.tsx)
  return <>{children}</>;
}
