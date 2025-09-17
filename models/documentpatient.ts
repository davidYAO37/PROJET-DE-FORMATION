import mongoose, { Model, Schema } from "mongoose";

export interface IDocumentPatient extends Document {
    libeleDocument: string;
    document: Buffer;
    date: Date;
    heure: string;
    patient: mongoose.Types.ObjectId;
    typeDoc: string;
    ajouterPar: string;
    codeDossier: string;
    nPrestation: string;
    medecin?: mongoose.Types.ObjectId;
    prestationId?: number;
    extensionF?: string;
    interpretation?: string;
    consultation?: mongoose.Types.ObjectId;
}

const DocumentPatientSchema = new Schema<IDocumentPatient>({
    libeleDocument: String,
    document: Buffer,
    date: Date,
    heure: String,
    patient: { type: Schema.Types.ObjectId, ref: "Patient" },
    typeDoc: String,
    ajouterPar: String,
    codeDossier: String,
    nPrestation: String,
    medecin: { type: Schema.Types.ObjectId, ref: "Medecin" },
    prestationId: Number,
    extensionF: String,
    interpretation: String,
    consultation: { type: Schema.Types.ObjectId, ref: "Consultation" }
});
export const DocumentPatient: Model<IDocumentPatient> = mongoose.models.DocumentPatient || mongoose.model<IDocumentPatient>('DocumentPatient', DocumentPatientSchema);