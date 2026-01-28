export type Pharmacie = {
       _id?: string;
    Reference?: string;
    Designation: string;
    Prix?: number;
    PrixVente?: number;
    Ajouter?: Date;
    
}
export type Assurance = {
    assuranceId: string;
    type: string;
    taux: number;
    matricule: string;
    numeroBon: string;
    societe: string;
    numero: string;
    adherent: string;
};


export interface PrescriptionForm {
        _id?: string;
       Designation?: string;
       CodePrestation?: string;
       PatientP?: string;
       DatePres?: Date;
       SaisiPar?: string;
       Rclinique?: string;
       Montanttotal?: number;
       Taux?: number;
       PartAssurance?: number;
       PartAssure?: number;
       Remise?: number;
       MotifRemise?: string;
       Assurance?:Assurance;
       IDASSURANCE?:string;
       MontantRecu?:number;
       Restapayer?:number;
       idMedecin?:string;
       NomMed?:string;
       StatutFacture?:boolean;
       Numfacture?:string;
       NumBon?:string;
       Modepaiement?:string;
       Document?:string;
       ExtensionF?:string;
       Souscripteur?:string;
       StatutPaiement?:string;
       Ordonnerlannulation?:number;
       AnnulationOrdonneLe?:Date;
       AnnulationOrdonnePar?:string;
       IDSOCIETEASSURANCE?: string;
       SOCIETE_PATIENT?: string;
}
