import { useState, useEffect } from "react";

interface User {
  _id: string;
  nom: string;
  prenom: string;
  email: string;
  type: string;
  entrepriseId?: string;
  uid: string;
  permissions?: {
    services?: string[];
    actions?: string[];
    customized?: boolean;
  };
}

export const useAuthUser = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const response = await fetch('/api/me', { cache: 'no-store' });
        if (!response.ok) {
          localStorage.removeItem('profil');
          localStorage.removeItem('IdEntreprise');
          setUser(null);
          if (response.status === 401 && window.location.pathname !== '/connexion') {
            window.location.replace('/connexion');
          }
          return;
        }
        const data = await response.json();
        setUser(data.user || null);
        if (data.user) localStorage.setItem('profil', JSON.stringify(data.user));
      } catch (error) {
        console.error('Erreur lors de la récupération de l\'utilisateur:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkUser();

    // Écouter les changements dans localStorage (au cas où l'utilisateur se connecte/déconnecte dans un autre onglet)
    const handleStorageChange = () => {
      checkUser();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('profilUpdated', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('profilUpdated', handleStorageChange);
    };
  }, []);

  return { user, loading };
};
