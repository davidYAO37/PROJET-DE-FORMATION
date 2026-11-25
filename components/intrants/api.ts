// Helpers partagés du module intrants (côté client).

export const nomUtilisateur = () => {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("nom_utilisateur") || localStorage.getItem("userName") || "";
};

export async function apiIntrant(url: string, options: RequestInit = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-user-name": nomUtilisateur(),
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.success === false) {
    throw new Error(data?.error || data?.message || `Erreur ${res.status}`);
  }
  return data;
}

export interface Intrant {
  _id: string;
  reference: string;
  designation: string;
  categorie: string;
  sousCategorie?: string;
  uniteStock: string;
  conditionnement?: string;
  qteParConditionnement: number;
  qteEnStock: number;
  seuilMinimum: number;
  seuilMaximum: number;
  suiviLot: boolean;
  delaiApresOuvertureJours?: number;
  conservation?: string;
  fournisseur?: string;
  prixAchat: number;
  actif: boolean;
}

export interface Lot {
  _id: string;
  intrantId: string;
  numeroLot: string;
  qteInitiale: number;
  qteRestante: number;
  dateReception: string;
  datePeremption?: string;
  dateOuverture?: string;
  dateLimiteOuverture?: string;
  prixUnitaire: number;
  emplacement?: string;
  etat: "disponible" | "epuise" | "bloque" | "perime";
}

export const formatDate = (d?: string | Date | null) => (d ? new Date(d).toLocaleDateString("fr-FR") : "-");
export const formatQte = (n?: number) => Number(n || 0).toLocaleString("fr-FR", { maximumFractionDigits: 3 });
export const formatMontant = (n?: number) =>
  `${Number(n || 0).toLocaleString("fr-FR", { maximumFractionDigits: 0 })} FCFA`;
