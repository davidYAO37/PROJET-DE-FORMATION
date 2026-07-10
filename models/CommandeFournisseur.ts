import mongoose, { Model, Schema, Types } from "mongoose";

export type StatutCommande = "BROUILLON" | "ENVOYEE" | "RECEPTION_PARTIELLE" | "SOLDEE" | "ANNULEE";

export type TypeArticle = "PHARMACIE" | "LABORATOIRE";

export interface ILigneCommande {
    _id?: string;
    IDMEDICAMENT?: Types.ObjectId | string;
    Medicament?: string;
    Reference?: string;
    TypeArticle?: TypeArticle;
    QteCommandee: number;
    QteRecue: number;
    PrixAchat: number;
    PrixVente?: number;
    TVA?: number;
    TotalHT?: number;
    TotalTTC?: number;
}

export interface ICommandeFournisseur {
    _id?: string;
    NumeroCommande?: string;
    DateCommande?: Date;
    DateLivraisonPrevue?: Date;
    IDFournisseur?: Types.ObjectId | string | null;
    NomFournisseur?: string;
    Statut?: StatutCommande;
    Observations?: string;
    SaisiPar?: string;
    SaisiLe?: Date;
    PrixHT?: number;
    TotalTVA?: number;
    MontantTTC?: number;
    IDApprovisionnement?: Types.ObjectId | string | null;
    entrepriseId?: string;
    lignes?: ILigneCommande[];
}

const LigneCommandeSchema = new Schema<ILigneCommande>({
    IDMEDICAMENT:  { type: Schema.Types.ObjectId, ref: "Pharmacie" },
    Medicament:    { type: String, maxlength: 250 },
    Reference:     { type: String, maxlength: 100 },
    TypeArticle:   { type: String, enum: ["PHARMACIE", "LABORATOIRE"], default: "PHARMACIE" },
    QteCommandee:  { type: Number, default: 0 },
    QteRecue:      { type: Number, default: 0 },
    PrixAchat:     { type: Number, default: 0 },
    PrixVente:     { type: Number, default: 0 },
    TVA:           { type: Number, default: 0 },
    TotalHT:       { type: Number, default: 0 },
    TotalTTC:      { type: Number, default: 0 },
}, { _id: true });

const CommandeFournisseurSchema = new Schema<ICommandeFournisseur>({
    NumeroCommande:      { type: String, maxlength: 60 },
    DateCommande:        { type: Date, default: Date.now },
    DateLivraisonPrevue: { type: Date },
    IDFournisseur:       { type: Schema.Types.ObjectId, ref: "Fournisseur", required: false },
    NomFournisseur:      { type: String, maxlength: 120 },
    Statut:              { type: String, enum: ["BROUILLON","ENVOYEE","RECEPTION_PARTIELLE","SOLDEE","ANNULEE"], default: "BROUILLON" },
    Observations:        { type: String, maxlength: 500 },
    SaisiPar:            { type: String, maxlength: 40 },
    SaisiLe:             { type: Date },
    PrixHT:              { type: Number, default: 0 },
    TotalTVA:            { type: Number, default: 0 },
    MontantTTC:          { type: Number, default: 0 },
    IDApprovisionnement: { type: Schema.Types.ObjectId, ref: "Approvisionnement", required: false },
    entrepriseId:        { type: String },
    lignes:              { type: [LigneCommandeSchema], default: [] },
}, { timestamps: true });

export const CommandeFournisseur: Model<ICommandeFournisseur> =
    mongoose.models.CommandeFournisseur ||
    mongoose.model<ICommandeFournisseur>("CommandeFournisseur", CommandeFournisseurSchema);
