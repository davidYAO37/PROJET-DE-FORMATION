export interface DocumentPatient {
    _id: string;
    libeleDocument: string;
    document?: string; // base64
    date: string | Date;
    heure?: string;
    patient?: string; // ObjectId as string
    idPatient?: string;
    patientP?: string;
    typeDoc?: string;
    ajouterPar?: string;
    codeDossier?: string;
    nPrestation?: string;
    medecin?: string; // ObjectId as string
    idMedecin?: string;
    medecinNom?: string;
    prestationId?: number;
    idprestation?: string;
    extensionF?: string;
    interpretation?: string;
    consultation?: string; // ObjectId as string
}
