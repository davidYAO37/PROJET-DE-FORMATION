import mongoose, { Schema, model, Document, Model } from "mongoose";

export interface IBiochimieTraitement extends Document {
    type_echantillon: string;
    cdbar: string;
    service: string;
    Sexe: string;
    Age_partient: number;
    date_analyse: string;
    Diagnostic: string;
    id_patient: string;
    date_naissance: Date;
    IDMEDECIN?: string;
    chim: string;
    resultat: string;
    unite: string;
    marque: string;
    plage: string;
    data: string;
    id_biochimie: string;
    CodePrestation: string;
}

const BiochimieTraitementSchema = new Schema<IBiochimieTraitement>({
    type_echantillon: String,
    cdbar: String,
    service: String,
    Sexe: String,
    Age_partient: Number,
    date_analyse: String,
    Diagnostic: String,
    id_patient: String,
    date_naissance: Date,
    IDMEDECIN: { type: Schema.Types.ObjectId, ref: "Medecin" },
    chim: String,
    resultat: String,
    unite: String,
    marque: String,
    plage: String,
    data: String,
    id_biochimie: String,
    CodePrestation: String,
}, { timestamps: true });

export const BiochimieTraitement: Model<IBiochimieTraitement> = mongoose.models.BiochimieTraitement || model<IBiochimieTraitement>("BiochimieTraitement", BiochimieTraitementSchema); 