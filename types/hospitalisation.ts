export type HospitalisationStatus = 'en_cours' | 'sortie' | 'transfere' | 'decede';

export interface HospitalisationRecord {
    _id?: string;
    patientId: string;
    consultationId?: string;
    medecinId?: string;
    assuranceId?: string;
    chambreId?: string;
    litId?: string;
    avisHospitId?: string;
    sourceType?: 'avis_medecin' | 'manuel';
    numeroDossier?: string;
    diagnosticInitial?: string;
    motifHospitalisation?: string;
    service?: string;
    dateEntree: string;
    heureEntree?: string;
    dateSortie?: string;
    heureSortie?: string;
    statut: HospitalisationStatus;
    montantChambre?: number;
    montantActes?: number;
    montantExamens?: number;
    montantMedicaments?: number;
    montantSoins?: number;
    montantHonoraires?: number;
    remise?: number;
    partAssurance?: number;
    partPatient?: number;
    resteAPayer?: number;
    observations?: string;
    createdAt?: string;
    updatedAt?: string;
}
