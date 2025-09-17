export interface HonoraireMed {
    legacyId?: number;
    date?: Date;
    Heure?: string;
    Montanttotal?: number;
    MontantJour?: number;
    MontantPayé?: number;
    Restapayer?: number;
    Medecin?: string | null;
    DEBUTD?: Date;
    FIND?: Date;
    NBHONRAIRE?: number;
    montanttotalhono?: number;
    parthonoraire?: number;
    NBPRESCRIPTION?: number;
    montanttaotalPrescrip?: number;
    partpres?: number;
    NBEXECUTANT?: number;
    MontanttotalExeut?: number;
    partexcu?: number;
    Totalnetapayer?: number;
    Totalretenue?: number;
    createdAt?: Date;
    updatedAt?: Date;
}
