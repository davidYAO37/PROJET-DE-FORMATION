import mongoose, { Model, Schema, Types } from "mongoose";

export interface IHonoraireMed extends Document {
    legacyId?: number;
    date?: Date;
    Heure?: string;
    Montanttotal?: number;
    MontantJour?: number;
    MontantPayé?: number;
    Restapayer?: number;
    Medecin?: Types.ObjectId | null;
    DEBUTD?: Date;
    FIND?: Date;
    NBHONRAIRE?: number;
    montanttotalhono?: number;
    parthonoraire?: number;
    NBPRESCRIPTION?: number;
    montanttaotalPrescrip?: number;
    partpres?: number;
    NBEXECUTANT?: number;
    MontanttotalExeut?: number;
    partexcu?: number;
    Totalnetapayer?: number;
    Totalretenue?: number;
    createdAt?: Date;
    updatedAt?: Date;
}


const HonoraireMedSchema = new Schema<IHonoraireMed>({
    legacyId: { type: Number },
    date: { type: Date },
    Heure: { type: String, maxlength: 10 },
    Montanttotal: { type: Number },
    MontantJour: { type: Number },
    MontantPayé: { type: Number },
    Restapayer: { type: Number },
    Medecin: { type: Schema.Types.ObjectId, ref: 'Medecin' },
    DEBUTD: { type: Date },
    FIND: { type: Date },
    NBHONRAIRE: { type: Number },
    montanttotalhono: { type: Number },
    parthonoraire: { type: Number },
    NBPRESCRIPTION: { type: Number },
    montanttaotalPrescrip: { type: Number },
    partpres: { type: Number },
    NBEXECUTANT: { type: Number },
    MontanttotalExeut: { type: Number },
    partexcu: { type: Number },
    Totalnetapayer: { type: Number },
    Totalretenue: { type: Number },
}, { timestamps: true });
export const HonraireMed: Model<IHonoraireMed> = mongoose.models.HonoraireMed || mongoose.model<IHonoraireMed>("HonoraireMed", HonoraireMedSchema);