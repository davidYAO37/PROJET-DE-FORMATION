export interface EncaissementCaisse {
    DatePrest: Date;
    Patient: string;
    Assurance: string;
    Designation: string;
    Totalacte: number;
    Taux: number;
    PartAssurance: number;
    Partassure: number;
    REMISE: number;
    TotalPaye: number;
    Restapayer: number;
    Medecin: string;
    IDHOSPITALISATION: string;
    Utilisateur: string;
    DateEncaissement: Date;
    Montantencaisse: number;
    HeureEncaissement: string;
    Modepaiement: string;
    IDFACTURATION: string;
    IDCONSULTATION: string;
    restapayerBilan: string;
    TotalapayerPatient: number;
    Assure: string;
    IdPatient: string;
    AnnulationOrdonneLe: Date;
    annulationOrdonnepar: string;
    Ordonnerlannulation:boolean;
}
