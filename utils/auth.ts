import bcrypt from 'bcryptjs';

// Fonction pour hasher un mot de passe
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12; // Nombre de tours de hashage
  return await bcrypt.hash(password, saltRounds);
};

// Fonction pour vérifier un mot de passe
export const verifyPassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword);
};

// Fonction pour générer un UID local
export const generateLocalUID = (): string => {
  return `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};
