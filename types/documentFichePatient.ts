export interface DocumentFichePatient {
    _id?: string;
    LibeleDocument?: string;
    Document?: string; // Buffer as base64 or url
    Date?: Date;
    Heure?: string;
    PatientP?: string;
    AjouterPar?: string;
    CODEDOSSIER?: string;
    Patient?: string;
    ExtensionF?: string;
}
