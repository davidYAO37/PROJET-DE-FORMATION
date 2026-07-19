import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IHospitalisation extends Document {
    patientId: mongoose.Types.ObjectId | string;
    consultationId?: mongoose.Types.ObjectId | string;
    medecinId?: mongoose.Types.ObjectId | string;
    assuranceId?: mongoose.Types.ObjectId | string;
    chambreId?: mongoose.Types.ObjectId | string;
    litId?: mongoose.Types.ObjectId | string;
    avisHospitId?: mongoose.Types.ObjectId | string;
    sourceType?: 'avis_medecin' | 'manuel';
    numeroDossier?: string;
    diagnosticInitial?: string;
    motifHospitalisation?: string;
    service?: string;
    dateEntree: Date;
    heureEntree?: string;
    dateSortie?: Date;
    heureSortie?: string;
    statut: 'en_cours' | 'sortie' | 'transfere' | 'decede';
    montantChambre?: number;
    montantActes?: number;
    montantExamens?: number;
    montantMedicaments?: number;
    montantSoins?: number;
    montantHonoraires?: number;
    remise?: number;
    partAssurance?: number;
    partPatient?: number;
    resteAPayer?: number;
    observations?: string;
}

const HospitalisationSchema = new Schema<IHospitalisation>(
    {
        patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
        consultationId: { type: Schema.Types.ObjectId, ref: 'Consultation', index: true },
        medecinId: { type: Schema.Types.ObjectId, ref: 'Medecin', index: true },
        assuranceId: { type: Schema.Types.ObjectId, ref: 'Assurance', index: true },
        chambreId: { type: Schema.Types.ObjectId, ref: 'Chambre', index: true },
        litId: { type: Schema.Types.ObjectId, ref: 'Lit', index: true },
        avisHospitId: { type: Schema.Types.ObjectId, ref: 'AvisHospit', index: true },
        sourceType: { type: String, enum: ['avis_medecin', 'manuel'], default: 'manuel' },
        numeroDossier: { type: String, index: true },
        diagnosticInitial: { type: String },
        motifHospitalisation: { type: String },
        service: { type: String },
        dateEntree: { type: Date, required: true, default: Date.now },
        heureEntree: { type: String },
        dateSortie: { type: Date },
        heureSortie: { type: String },
        statut: { type: String, enum: ['en_cours', 'sortie', 'transfere', 'decede'], default: 'en_cours' },
        montantChambre: { type: Number, default: 0 },
        montantActes: { type: Number, default: 0 },
        montantExamens: { type: Number, default: 0 },
        montantMedicaments: { type: Number, default: 0 },
        montantSoins: { type: Number, default: 0 },
        montantHonoraires: { type: Number, default: 0 },
        remise: { type: Number, default: 0 },
        partAssurance: { type: Number, default: 0 },
        partPatient: { type: Number, default: 0 },
        resteAPayer: { type: Number, default: 0 },
        observations: { type: String }
    },
    { timestamps: true }
);

export const Hospitalisation: Model<IHospitalisation> =
    mongoose.models.Hospitalisation || mongoose.model<IHospitalisation>('Hospitalisation', HospitalisationSchema);
