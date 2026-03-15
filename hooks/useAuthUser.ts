import { useState, useEffect } from "react";

interface User {
  _id: string;
  nom: string;
  prenom: string;
  email: string;
  type: string;
  entrepriseId?: string;
  uid: string;
}

export const useAuthUser = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = () => {
      try {
        // Récupérer le profil depuis localStorage
        const profilStr = localStorage.getItem('profil');
        
        if (profilStr) {
          const profil = JSON.parse(profilStr);
          setUser(profil);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération de l\'utilisateur:', error);
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
