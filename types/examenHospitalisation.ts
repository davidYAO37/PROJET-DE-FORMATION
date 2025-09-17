

export interface ExamenHospitalisation {
    _id?: string;
    Code_Prestation?: string;
    NomMed?: string;
    PatientP?: string;
    DatePres?: Date;
    SaisiPar?: string;
    Rclinique?: string;
    Montanttotal?: number;
    TotalPaye?: number;
    TotaleTaxe?: number;
    MontantRecu?: number;
    reduction?: number;
    tauxreduction?: number;
    MotifRemise?: string;
    Restapayer?: number;
    DateEncaissement?: Date;
    TotalapayerPatient?: number;
    SocieteP?: string;
    PartAssuranceP?: number;
    Partassure?: number;
    Assuance?: string;
    Taux?: string;
    IDASSURANCE?: string;
    IDTYPE_ACTE?: number;
    FacturePar?: string;
    Patient?: string;
    CompteClient?: boolean;
    ModifierPar?: string;
    HeureModif?: string;
    IDAPPORTEUR?: number;
    Entrele?: Date;
    SortieLe?: Date;
    Chambre?: string;
    DureeE?: number;
    Numcarte?: string;
    Designationtypeacte?: string;
    StatutFacture?: boolean;
    Numfacture?: string;
    NumBon?: string;
    MontantMedecin?: number;
    PartApporteur?: number;
    Medecin?: string;
    Statumed?: string;
    BanqueC?: string;
    NumChèque?: string;
    Modepaiement?: string;
    TotalReliquatPatient?: number;
    CautionPatient?: number;
    Assure?: string;
    MontantMedecinExécutant?: number;
    NummedecinExécutant?: number;
    MedecinExécutant?: string;
    Payeoupas?: boolean;
    resultatacte?: string;
    StatutApporteur?: string;
    Statutexécutant?: string;
    ObservationC?: string;
    Receptionnerpar?: string;
    Datetransferbiologiste?: Date;
    Transferepar?: string;
    DATERECEPTIONNER?: Date;
    Heurereception?: string;
    Heure_service?: string;
    dateretour?: Date;
    Document?: string;
    ExtensionF?: string;
    Souscripteur?: string;
    Heure_Facturation?: string;
    CONCLUSIONGENE?: string;
    NumCarteVisa?: string;
    NumCompteVisa?: string;
    DateValidation?: Date;
    IDSOCIETEPARTENAIRE?: string;
    ProvenanceExamen?: string;
    NIdentificationExamen?: string;
    Biologiste?: string;
    CachetBiologiste?: string;
    CachetMedecin?: string;
    Externe_Interne?: string;
    factureannule?: boolean;
    StatutLaboratoire?: number;
    ObservationHospitalisation?: string;
    IDCHAMBRE?: string;
    IDSOCIETEASSUANCE?: string;
    SOCIETE_PATIENT?: string;
}



// Représente une ligne du tableau des actes
export type Acte = {
    date: string; // ex: "2025-09-16"
    designation: string; // Acte médical (ex: "Consultation")
    lettreCle: string; // Lettre clé
    coef: number; // Coefficient
    quantite: number; // Quantité
    coefAssur: number; // Coef assurance
    surplus: number; // Surplus
    prixUnitaire: number; // Prix unitaire
    taxe: number; // Taxe
    prixTotal: number; // Prix total (calculé)
    partAssurance: number; // Part assurance
    partAssure: number; // Part assuré
    idType: string; // Identifiant type
    reliquat: number; // Reliquat
    totalRelicatCoefAssur: number; // Total reliquat coef assur
    montantMedExecutant: number; // Montant médecin exécutant
};

// Représente tout le formulaire d’examen / hospitalisation
export type ExamenHospitalisationForm = {
    patientId: string; // Identifiant du patient
    medecinId: string; // Identifiant du médecin
    dateEntree: string; // Date d’entrée
    dateSortie: string; // Date de sortie
    nombreDeJours: number; // Durée du séjour
    diagnostic: string; // Texte du diagnostic
    observations: string; // Observations
    actes: Acte[]; // ✅ tableau des actes (comme ton tableau)

    // Ajout pour compatibilité avec AssuranceInfo
    assurance: {
        type: string;
        taux: number;
        matricule: string;
        numeroBon: string;
        societe: string;
        numero: string;
        adherent: string;
    };
    medecinPrescripteur: string;
    renseignementclinique?: string; // Renseignement clinique (optionnel)
    // Ajout pour PaiementInfo
    factureTotal?: number;
    resteAPayer?: number;
    assurancePart?: number;
    partPatient?: number;
    surplus?: number;
};
