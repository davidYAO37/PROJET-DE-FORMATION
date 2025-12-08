import mongoose, { Model, Schema } from "mongoose";

export interface IVitesseTraitement extends Document {
    parametres: string;
    resultat: string;
    id: string;
    unite: string;
    dateVitesse: Date;
    status: string;
    CodePrestation: string;
    IDFAMILLE_ACTE_BIOLOGIE: Schema.Types.ObjectId;
    CodeAscii: number;
    ValeurMaxNormale: number;
    ValeurMinNormale: number;
    DejaUtilise: boolean;
}

const VitesseTraitementSchema = new Schema<IVitesseTraitement>({
    parametres: String,
    resultat: String,
    id: String,
    unite: String,
    dateVitesse: Date,
    status: String,
    CodePrestation: String,
    IDFAMILLE_ACTE_BIOLOGIE: { type: Schema.Types.ObjectId, ref: "FamilleActeBiologie" },
    CodeAscii: Number,
    ValeurMaxNormale: Number,
    ValeurMinNormale: Number,
    DejaUtilise: Boolean,
}, { timestamps: true });
export const VitesseTraitement: Model<IVitesseTraitement> = mongoose.models.VitesseTraitement || mongoose.model<IVitesseTraitement>('VitesseTraitement', VitesseTraitementSchema);