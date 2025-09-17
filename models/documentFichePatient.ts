import mongoose, { Schema, model, Document, Types, Model } from 'mongoose';

export interface IDocumentFichePatient extends Document {
    LibeleDocument?: string;
    Document?: Buffer | string;
    Date?: Date;
    Heure?: string;
    PatientP?: string;
    AjouterPar?: string;
    CODEDOSSIER?: string;
    Patient?: Types.ObjectId;
    ExtensionF?: string;
}

const DocumentFichePatientSchema = new Schema<IDocumentFichePatient>(
    {
        LibeleDocument: { type: String, maxlength: 50 },
        Document: { type: Buffer },
        Date: { type: Date },
        Heure: { type: String, maxlength: 10 },
        PatientP: { type: String, maxlength: 50 },
        AjouterPar: { type: String, maxlength: 60 },
        CODEDOSSIER: { type: String, maxlength: 50 },
        Patient: { type: Schema.Types.ObjectId, ref: 'Patient' },
        ExtensionF: { type: String, maxlength: 50 },
    },
    { timestamps: true }
);
export const DocumentFichePatient: Model<IDocumentFichePatient> = mongoose.models.DocumentFichePatient || mongoose.model<IDocumentFichePatient>('DocumentFichePatient', DocumentFichePatientSchema);