import mongoose, { Schema, model, Document, Types, Model } from 'mongoose';

export interface IObservationHospit extends Document {
    Date?: Date;
    Heure?: string;
    Medecin?: Types.ObjectId;
    ObservationC?: string;
    Patient?: Types.ObjectId;
    Hospitalisation?: Types.ObjectId;
    Poids?: string;
    Temperature?: string;
    Tension?: string;
    Glycemie?: string;
    TailleCons?: string;
    Code_dossier?: string;
    Code_Prestation?: string;
}

const ObservationHospitSchema = new Schema<IObservationHospit>(
    {
        Date: { type: Date },
        Heure: { type: String, maxlength: 10 },
        Medecin: { type: Schema.Types.ObjectId, ref: 'Medecin' },
        ObservationC: { type: String, maxlength: 1000 },
        Patient: { type: Schema.Types.ObjectId, ref: 'Patient' },
        Hospitalisation: { type: Schema.Types.ObjectId, ref: 'ExamenHospitalisation' },
        Poids: { type: String, maxlength: 10 },
        Temperature: { type: String, maxlength: 12 },
        Tension: { type: String, maxlength: 12 },
        Glycemie: { type: String, maxlength: 12 },
        TailleCons: { type: String, maxlength: 10 },
        Code_dossier: { type: String, maxlength: 50 },
        Code_Prestation: { type: String, maxlength: 50 },
    },
    { timestamps: true }
);
export const ObservationHospit: Model<IObservationHospit> = mongoose.models.ObservationHospit || mongoose.model<IObservationHospit>('ObservationHospit', ObservationHospitSchema);