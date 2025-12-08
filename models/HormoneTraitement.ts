import mongoose, { Model, Schema } from "mongoose";

export interface IHormoneTraitement extends Document {
    status: string;
    donnees: string;
    dateHormone: Date;
    id: string;
    numPatient: string;
    article: string;
    echantillon: string;
    CodePrestation: string;
    IDFAMILLE_ACTE_BIOLOGIE?: Schema.Types.ObjectId;
    plagehormone: string;
    resultathor: string;
    Param_designation: string;
    unitehorm: string;
    CodeAscii: number;
    ValeurMinNormale: number;
    ValeurMaxNormale: number;
    DejaUtilise: boolean;
}

const HormoneTraitementSchema = new Schema<IHormoneTraitement>({
    status: String,
    donnees: String,
    dateHormone: Date,
    id: String,
    numPatient: String,
    article: String,
    echantillon: String,
    CodePrestation: String,
    IDFAMILLE_ACTE_BIOLOGIE: { type: Schema.Types.ObjectId, ref: "FamilleActeBiologie" },
    plagehormone: String,
    resultathor: String,
    Param_designation: String,
    unitehorm: String,
    CodeAscii: Number,
    ValeurMinNormale: Number,
    ValeurMaxNormale: Number,
    DejaUtilise: Boolean,
}, { timestamps: true });
export const HonoraireTraitement: Model<IHormoneTraitement> = mongoose.models.HormoneTraitement || mongoose.model<IHormoneTraitement>("HormoneTraitement", HormoneTraitementSchema);