export interface DocumentPatient {
    libeleDocument: string;
    document: Buffer;
    date: Date;
    heure: string;
    patient: string; // ObjectId as string
    typeDoc: string;
    ajouterPar: string;
    codeDossier: string;
    nPrestation: string;
    medecin?: string; // ObjectId as string
    prestationId?: number;
    extensionF?: string;
    interpretation?: string;
    consultation?: string; // ObjectId as string
}
