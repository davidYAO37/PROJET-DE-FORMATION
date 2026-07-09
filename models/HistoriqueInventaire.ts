import mongoose, { Model, Schema } from "mongoose";

export interface ILigneInventaire {
    IDMEDICAMENT?: string;
    Medicament?: string;
    Reference?: string;
    QteTheorique?: number;
    QtePhysique?: number;
    Ecart?: number;
}

export interface IHistoriqueInventaire {
    _id?: string;
    DateInventaire?: Date;
    SaisiPar?: string;
    Observations?: string;
    NbLignes?: number;
    Lignes?: ILigneInventaire[];
    entrepriseId?: string;
    createdAt?: Date;
}

const LigneSchema = new Schema<ILigneInventaire>({
    IDMEDICAMENT: { type: String },
    Medicament:   { type: String },
    Reference:    { type: String },
    QteTheorique: { type: Number },
    QtePhysique:  { type: Number },
    Ecart:        { type: Number },
}, { _id: false });

const HistoriqueInventaireSchema = new Schema<IHistoriqueInventaire>({
    DateInventaire: { type: Date, default: Date.now },
    SaisiPar:       { type: String, maxlength: 60 },
    Observations:   { type: String, maxlength: 200 },
    NbLignes:       { type: Number, default: 0 },
    Lignes:         { type: [LigneSchema], default: [] },
    entrepriseId:   { type: String },
}, { timestamps: true });

export const HistoriqueInventaire: Model<IHistoriqueInventaire> =
    mongoose.models.HistoriqueInventaire ||
    mongoose.model<IHistoriqueInventaire>("HistoriqueInventaire", HistoriqueInventaireSchema);
