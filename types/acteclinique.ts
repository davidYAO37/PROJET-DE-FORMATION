export interface ActeClinique {
    _id: string;
    designationacte: string;
    lettreCle: string;
    prixClinique: number;
    prixMutuel: number;
    prixPreferentiel: number;
    coefficient: number;
    montantAuMed: boolean;
    idFamille?: string;
}
/* export interface ActeClinique {
    _id: string;
    designationacte: string;
    lettreCle: string;
    prix: number;
    prixMutualiste: number;
    prixAssure: number;
    coefficientActe: number;
    montantAuMed: boolean;
    idFamille?: string;
} */

export interface ActeSelectionne {
    _id: string;
    designation: string;
    lettreCle: string;
    quantite: number;
    coefficient: number;
    prixTotal: number;
    tarifAssurance?: number;
    surplus?: number;
    reliquat?: number;
    montantMedecin?: number;
}

// Fonction principale : ajoute un acte et calcule toutes les valeurs
export function ajouterActe(
    acte: ActeClinique,
    assuranceId: number,
    selAssure: number,
    tarifAssurance?: number
): ActeSelectionne {
    const quantite = 1;
    const coefficient = acte.coefficient || 1;

    // Prix unitaire selon assurance et forfait
    let prixUnitaire = calculerPrixUnitaire(acte, assuranceId, selAssure, tarifAssurance);

    // Calcul surplus / reliquat selon la logique WinDev
    const { surplus, reliquat } = calculerSurplusReliquat(acte, prixUnitaire, coefficient, quantite);

    // Prix total
    const prixTotal = prixUnitaire * coefficient * quantite;

    // Montant pour médecin
    const montantMedecin = acte.montantAuMed ? prixTotal : 0;

    return {
        _id: acte._id,
        designation: acte.designationacte,
        lettreCle: acte.lettreCle,
        quantite,
        coefficient,
        prixTotal,
        tarifAssurance: prixUnitaire,
        surplus,
        reliquat,
        montantMedecin,
    };
}

// Calcule le prix unitaire selon type d'assurance
function calculerPrixUnitaire(
    acte: ActeClinique,
    assuranceId: number,
    selAssure: number,
    tarifAssurance?: number
): number {
    if (assuranceId === 1) {
        // Clinique
        return tarifActeClinique(acte, selAssure);
    } else {
        // Assurance
        return tarifActeAssurance(acte, selAssure, tarifAssurance);
    }
}

function tarifActeClinique(acte: ActeClinique, selAssure: number): number {
    switch (selAssure) {
        case 1: return acte.prixClinique;
        case 2: return acte.prixMutuel;
        case 3: return acte.prixPreferentiel;
        default: return acte.prixClinique;
    }
}

function tarifActeAssurance(
    acte: ActeClinique,
    selAssure: number,
    tarifAssurance?: number
): number {
    if (!tarifAssurance) tarifAssurance = acte.prixClinique;
    // Ici tu peux intégrer les conditions de Forfait et Comparaison comme en WinDev
    switch (selAssure) {
        case 1: return acte.prixClinique;
        case 2: return Math.min(acte.prixMutuel, tarifAssurance);
        case 3: return Math.min(acte.prixPreferentiel, tarifAssurance);
        default: return acte.prixClinique;
    }
}

// Calcul du surplus et reliquat selon WinDev
function calculerSurplusReliquat(
    acte: ActeClinique,
    prixUnitaire: number,
    coefficient: number,
    quantite: number
) {
    let surplus = 0;
    let reliquat = 0;

    // Surplus = différence entre prix clinique * coef - prix assurance
    const prixClinique = acte.prixClinique * coefficient;
    if (prixUnitaire < prixClinique) {
        surplus = prixClinique - prixUnitaire;
        reliquat = surplus * quantite;
    }

    return { surplus, reliquat };
}
