export interface Entreprise {
    _id?: string;
    NomSociété?: string;
    AdresseSociété?: string;
    TelSociété?: string;
    VilleSociété?: string;
    EmailSociété?: string;
    LogoE?: string; // Buffer as base64 or url
    FaxSociete?: string;
    PAys?: string;
    Activité?: string;
    NCC?: string;
    SituationGéo?: string;
}
