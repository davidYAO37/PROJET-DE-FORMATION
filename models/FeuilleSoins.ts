import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IFeuilleSoins extends Document {
  Patient:       mongoose.Types.ObjectId;
  Code_dossier?: string;
  DateSoin:      Date;
  Heure?:        string;
  TypeSoin:      string;
  Description?:  string;
  InfirmierNom?: string;
  entrepriseId?: string;
}

const FeuilleSoinsSchema = new Schema<IFeuilleSoins>(
  {
    Patient:       { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
    Code_dossier:  { type: String },
    DateSoin:      { type: Date, required: true },
    Heure:         { type: String, maxlength: 10 },
    TypeSoin:      { type: String, required: true },
    Description:   { type: String, maxlength: 500 },
    InfirmierNom:  { type: String, maxlength: 100 },
    entrepriseId:  { type: String },
  },
  { timestamps: true }
);

export const FeuilleSoins: Model<IFeuilleSoins> =
  mongoose.models.FeuilleSoins || mongoose.model<IFeuilleSoins>('FeuilleSoins', FeuilleSoinsSchema);
