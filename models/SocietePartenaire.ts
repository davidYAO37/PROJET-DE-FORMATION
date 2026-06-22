import mongoose, { Schema, Model, Types } from 'mongoose';

export interface ISocietePartenaire {
    _id?: Types.ObjectId;
    Designation: string;
}

const SocietePartenaireSchema = new Schema<ISocietePartenaire>(
    {
        Designation: { type: String, required: true },
    },
    { timestamps: true }
);

export const SocietePartenaire: Model<ISocietePartenaire> = mongoose.models.SocietePartenaire || mongoose.model<ISocietePartenaire>("SocietePartenaire", SocietePartenaireSchema);