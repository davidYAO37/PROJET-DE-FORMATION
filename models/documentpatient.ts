import mongoose, { Model, Schema } from "mongoose";

export interface IDocumentPatient extends Document {
    libeleDocument: string;
    document: Buffer;
    date: Date;
    heure: string;
    patient: mongoose.Types.ObjectId;
    idPatient?: string;
    patientP?: string;
    typeDoc: string;
    ajouterPar: string;
    codeDossier: string;
    nPrestation: string;
    medecin?: mongoose.Types.ObjectId;
    idMedecin?: string;
    medecinNom?: string;
    prestationId?: number;
    idprestation?: string;
    extensionF?: string;
    interpretation?: string;
    consultation?: mongoose.Types.ObjectId;
    entrepriseId?: string;
}

const DocumentPatientSchema = new Schema<IDocumentPatient>({
    libeleDocument: { type: String, required: true },
    document: { type: Buffer },
    date: { type: Date, default: Date.now },
    heure: { type: String },
    patient: { type: Schema.Types.ObjectId, ref: "Patient" },
    idPatient: { type: String },
    patientP: { type: String },
    typeDoc: { type: String },
    ajouterPar: { type: String },
    codeDossier: { type: String },
    nPrestation: { type: String },
    medecin: { type: Schema.Types.ObjectId, ref: "Medecin" },
    idMedecin: { type: String },
    medecinNom: { type: String },
    prestationId: { type: Number },
    idprestation: { type: String, index: true },
    extensionF: { type: String },
    interpretation: { type: String },
    consultation: { type: Schema.Types.ObjectId, ref: "Consultation" },
    entrepriseId: { type: String },
});
export const DocumentPatient: Model<IDocumentPatient> = mongoose.models.DocumentPatient || mongoose.model<IDocumentPatient>('DocumentPatient', DocumentPatientSchema);