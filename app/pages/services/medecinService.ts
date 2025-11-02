import { IMedecin } from "@/models/medecin";

export async function getMedecins(): Promise<IMedecin[]> {
  try {
    const response = await fetch('/api/medecins');
    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des médecins');
    }
    return await response.json();
  } catch (error) {
    console.error('Erreur:', error);
    return [];
  }
}
