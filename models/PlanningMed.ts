import mongoose, { Model, Schema } from "mongoose";

export interface IPlanningMed extends Document {
    DateDebut: Date;
    DateFin: Date;
    DESCRIPTION: string;
    IDMEDECIN: Schema.Types.ObjectId;
    heureDebut: string;
    HeureFin: string;
    datedebutSys: Date;
    DateFinSys: Date;
    Dureconsul: number;
    TotalRDV: number;
    ResteRDV: number;
    SaisiLe: Date;
    Modifiele: Date;
    saisiepar: string;
    ModifierPar: string;
}

const PlanningMedSchema = new Schema<IPlanningMed>({
    DateDebut: Date,
    DateFin: Date,
    DESCRIPTION: String,
    IDMEDECIN: { type: Schema.Types.ObjectId, ref: "Medecin" },
    heureDebut: String,
    HeureFin: String,
    datedebutSys: Date,
    DateFinSys: Date,
    Dureconsul: Number,
    TotalRDV: Number,
    ResteRDV: Number,
    SaisiLe: Date,
    Modifiele: Date,
    saisiepar: String,
    ModifierPar: String,
}, { timestamps: true });
export const PlanningMed: Model<IPlanningMed> = mongoose.models.PlanningMed || mongoose.model<IPlanningMed>('PlanningMed', PlanningMedSchema);   