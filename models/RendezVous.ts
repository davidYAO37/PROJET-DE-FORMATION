import mongoose, { Model, Schema } from "mongoose";

export interface IRendezVous extends Document {
    LibelleRDV: string;
    PatientR: string;
    Medecinr: string;
    IDPARTIENT: Schema.Types.ObjectId;
    IDMEDECIN: Schema.Types.ObjectId;
    StatutRdv: string;
    DisponibiliteSaisiePar: string;
    DateDisponinibilite: string;
    DatePlanning: Date;
    IDPLANNING_MED: Schema.Types.ObjectId;
    RendezVousPrisPar: string;
    RENDEZVOUSLE: Date;
    DESCRIPTION: string;
    Statutrdvpris: boolean;
    Contact: string;
}

const RendezVousSchema = new Schema<IRendezVous>({
    LibelleRDV: String,
    PatientR: String,
    Medecinr: String,
    IDPARTIENT: { type: Schema.Types.ObjectId, ref: "Patient" },
    IDMEDECIN: { type: Schema.Types.ObjectId, ref: "Medecin" },
    StatutRdv: String,
    DisponibiliteSaisiePar: String,
    DateDisponinibilite: String,
    DatePlanning: Date,
    IDPLANNING_MED: { type: Schema.Types.ObjectId, ref: "PlanningMed" },
    RendezVousPrisPar: String,
    RENDEZVOUSLE: Date,
    DESCRIPTION: String,
    Statutrdvpris: Boolean,
    Contact: String,
}, { timestamps: true });
export const RendezVous: Model<IRendezVous> = mongoose.models.RendezVous || mongoose.model<IRendezVous>('RendezVous', RendezVousSchema);