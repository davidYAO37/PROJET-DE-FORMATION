// Types génériques
type Acte = {
    _id: string;
    designation: string;
    lettreCle: string;
    coefficientActe: number;
    prixClinique: number;
    prixMutuel: number;
    prixAssure: number;
    montantAuMed: number; // 1 = montant pour médecin
    idFamille?: string;
};

type TarifAssurance = {
    designation: string;
    idAssurance: number;
    prixMutualiste: number;
    prixAssure: number;
    coefficientActe: number;
};

type Prestation = {
    designation: string;
    lettreCle: string;
    coefficient: number;
    quantite: number;
    prixUnitaire: number;
    prixTotal: number;
    partAssurance: number;
    partAssure: number;
    coefAssur: number;
    reliquat: number;
    totalRelicatCoefAssur: number;
    montantMedExecutant: number;
    tarifAssurance?: number;
    coefClinique?: number;
    forfaitClinique?: number;
};

// 1️⃣ Fonction TarifActeClinique
function tarifActeClinique(acte: Acte, prestation: Prestation, selAssure: number) {
    prestation.coefficient = acte.coefficientActe || 1;

    switch (selAssure) {
        case 1: // Non Assure
            prestation.prixUnitaire = prestation.prixTotal = acte.prixClinique;
            prestation.reliquat = prestation.partAssurance = 0;
            break;
        case 2: // Tarif mutualiste
            prestation.prixUnitaire = prestation.prixTotal = acte.prixMutuel;
            prestation.reliquat = prestation.partAssurance = 0;
            break;
        case 3: // Tarif Assure
            prestation.prixUnitaire = prestation.prixTotal = acte.prixAssure;
            prestation.reliquat = prestation.partAssurance = 0;
            break;
    }
}

// 2️⃣ Fonction TarifActeAssurance
function tarifActeAssurance(
    acte: Acte,
    prestation: Prestation,
    selAssure: number,
    idAssurance: number,
    tarifsAssurance: TarifAssurance[]
) {
    const tarif = tarifsAssurance.find(
        (t) => t.designation === acte.designation && t.idAssurance === idAssurance
    );

    if (!tarif) {
        throw new Error(
            `Merci d'ajouter cet acte à la liste des actes de l'assurance avant cette opération`
        );
    }

    // Calcul du montant selon coefficients
    if (tarif.coefficientActe === 1 && acte.coefficientActe !== 1) {
        montantForfaitAssurance(acte, prestation, selAssure, tarif);
    } else if (tarif.coefficientActe !== 1 && acte.coefficientActe === 1) {
        montantForfaitClinique(acte, prestation, selAssure, tarif);
    } else {
        montantSansForfait(acte, prestation, selAssure, tarif);
    }
}

// 3️⃣ Fonction PrixActe
function prixActe(prestation: Prestation, acte: Acte, selAssure: number, sAiTaux = 0) {
    prestation.prixTotal = prestation.prixUnitaire * prestation.coefficient * prestation.quantite;

    if (selAssure !== 1) {
        // Avec assurance
        prestation.partAssurance = (sAiTaux * (prestation.tarifAssurance || prestation.prixUnitaire) * prestation.quantite) / 100;
        prestation.partAssure = prestation.prixTotal - prestation.partAssurance;
    } else {
        prestation.partAssurance = 0;
        prestation.partAssure = prestation.prixTotal;
    }

    // Montant pour le médecin
    prestation.montantMedExecutant = acte.montantAuMed ? prestation.prixTotal : 0;
}

// 4️⃣ Fonction FacturePharmacie
function facturePharmacie(prestations: Prestation[]) {
    let total = 0,
        partAssurance = 0,
        partAssure = 0,
        totalSurplus = 0,
        montantMed = 0;

    for (const p of prestations) {
        total += p.prixTotal;
        partAssurance += p.partAssurance;
        partAssure += p.partAssure;
        totalSurplus += p.reliquat + p.totalRelicatCoefAssur;
        montantMed += p.montantMedExecutant;
    }

    return {
        total,
        partAssurance,
        partAssure,
        totalSurplus,
        montantMed,
        montantARegler: partAssure + totalSurplus,
    };
}

// 5️⃣ Fonction MontantForfaitAssurance
function montantForfaitAssurance(
    acte: Acte,
    prestation: Prestation,
    selAssure: number,
    tarifAssurance: TarifAssurance
) {
    prestation.coefficient = acte.coefficientActe;
    prestation.coefAssur = 0;
    prestation.coefClinique = prestation.coefficient;

    switch (selAssure) {
        case 1:
            tarifActeClinique(acte, prestation, selAssure);
            break;
        case 2:
            prestation.prixUnitaire = prestation.prixTotal = tarifAssurance.prixMutualiste;
            prestation.reliquat = (acte.prixMutuel * prestation.coefficient - tarifAssurance.prixMutualiste) * prestation.quantite;
            prestation.coefClinique = tarifAssurance.coefficientActe;
            break;
        case 3:
            prestation.prixUnitaire = prestation.prixTotal = tarifAssurance.prixAssure;
            prestation.reliquat = (acte.prixAssure * prestation.coefficient - tarifAssurance.prixAssure) * prestation.quantite;
            prestation.coefClinique = tarifAssurance.coefficientActe;
            break;
    }
}

// 6️⃣ Fonction MontantForfaitClinique
function montantForfaitClinique(
    acte: Acte,
    prestation: Prestation,
    selAssure: number,
    tarifAssurance: TarifAssurance
) {
    prestation.coefficient = acte.coefficientActe;
    prestation.coefAssur = 0;
    prestation.coefClinique = prestation.coefficient;
    prestation.forfaitClinique = 0;

    switch (selAssure) {
        case 1:
            tarifActeClinique(acte, prestation, selAssure);
            break;
        case 2:
            prestation.prixUnitaire = prestation.prixTotal = acte.prixMutuel;
            prestation.reliquat = acte.prixMutuel - tarifAssurance.prixMutualiste;
            prestation.forfaitClinique = 1;
            prestation.coefClinique = tarifAssurance.coefficientActe;
            break;
        case 3:
            prestation.prixUnitaire = prestation.prixTotal = acte.prixAssure;
            prestation.reliquat = acte.prixAssure - tarifAssurance.prixAssure;
            prestation.forfaitClinique = 1;
            prestation.coefClinique = tarifAssurance.coefficientActe;
            break;
    }
}

// 7️⃣ Fonction MontantSansForfait
function montantSansForfait(
    acte: Acte,
    prestation: Prestation,
    selAssure: number,
    tarifAssurance: TarifAssurance
) {
    if (tarifAssurance.coefficientActe < acte.coefficientActe) {
        prestation.coefAssur = acte.coefficientActe - tarifAssurance.coefficientActe;
    } else if (tarifAssurance.coefficientActe > acte.coefficientActe) {
        prestation.coefficient = tarifAssurance.coefficientActe;
        prestation.coefAssur = 0;
    } else {
        prestation.coefAssur = 0;
    }

    prestation.coefClinique = prestation.coefficient;

    switch (selAssure) {
        case 1:
            tarifActeClinique(acte, prestation, selAssure);
            break;
        case 2:
            prestation.prixUnitaire = prestation.prixTotal = acte.prixMutuel;
            prestation.reliquat = acte.prixMutuel - tarifAssurance.prixMutualiste;
            prestation.coefClinique = tarifAssurance.coefficientActe;
            break;
        case 3:
            prestation.prixUnitaire = prestation.prixTotal = acte.prixAssure;
            prestation.reliquat = acte.prixAssure - tarifAssurance.prixAssure;
            prestation.coefClinique = tarifAssurance.coefficientActe;
            break;
    }
}
