export interface PatientPrescription {
    IDPRESCRIPTION: number;
    patient: string;
    quantite: number;
    posologie: string;
    datePres: Date;
    heureFacturation?: string;
    prixUnitaire: number;
    prixTotal: number;
    nomMedicament: string;
    partAssurance: number;
    partAssure: number;
    codePrestation: string;
    medicament: string;
    priseCharge?: number;
    reference?: string;
    exclusionActe?: string;
    statutPrescriptionMedecin?: number;
    actePayeCaisse?: string;
    payeLe?: Date;
    payePar?: string;
    datePaiement?: Date;
    heure?: string;
    facturation?: string;
    societeAssurance?: string;
    societePatient?: string;
}
