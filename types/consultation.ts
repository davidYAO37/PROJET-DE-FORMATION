// types/consultation.ts
export interface ConsultationType {
    _id?: string;
    designationC: string;
    Prix_Assurance: number;
    PrixClinique: number;
    Restapayer: number;
    Code_dossier: string;
    Code_Prestation: string;
    Date_consulation: Date;
    Heure_Consultation: string;
    NCC?: string;

    StatutC: boolean;
    StatutPaiement: "Pas facturé" | "En cours de Paiement";
    Toutencaisse: boolean;

    montantapayer: number;
    ReliquatPatient: number;
    Recupar: string;
    IDACTE: string;
    tauxAssurance: number;
    PartAssurance: number;
    tiket_moderateur: number;
    numero_carte: string;
    NumBon: string;

    IdPatient: string;
    Souscripteur: string;
    PatientP: string;
    SOCIETE_PATIENT: string;
    IDSOCIETEASSURANCE: string;

    Medecin: string;
    IDMEDECIN: string;
    StatuPrescriptionMedecin: number;

    IDASSURANCE: string;
    assurance: string;
    Assuré: string;

    // Champs de transfert
    AncienMedecin?: string;
    datetransfert?: Date;
    TransfererPar?: string;

    Montantencaisse?: number;
    DateFacturation?: Date;
    Modepaiement?: string;
    FacturéPar?: string;

}
