export type HospitalisationStatus = 'en_cours' | 'sortie' | 'transfere' | 'decede';

// Ce type correspond maintenant à ExamenHospitalisation avec les champs d'hospitalisation
export interface HospitalisationRecord {
    _id?: string;
    IdPatient?: string;
    consultationId?: string;
    idMedecin?: string;
    IDASSURANCE?: string;
    IDCHAMBRE?: string;
    litId?: string;
    avisHospitId?: string;
    sourceType?: 'avis_medecin' | 'manuel';
    Code_dossier?: string;
    Rclinique?: string;
    motifHospitalisation?: string;
    service?: string;
    Entrele?: string;
    heureEntree?: string;
    SortieLe?: string;
    heureSortie?: string;
    statutHospitalisation?: HospitalisationStatus;
    montantChambre?: number;
    montantActes?: number;
    montantExamens?: number;
    montantMedicaments?: number;
    montantSoins?: number;
    montantHonoraires?: number;
    remise?: number;
    PartAssuranceP?: number;
    TotalapayerPatient?: number;
    Restapayer?: number;
    ObservationHospitalisation?: string;
    createdAt?: string;
    updatedAt?: string;
}
