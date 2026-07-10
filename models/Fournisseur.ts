import mongoose, { Model, Schema } from "mongoose";

export interface IFournisseur {
    _id?: string;
    Nom?: string;
    Contact?: string;
    Telephone?: string;
    Email?: string;
    Adresse?: string;
    Ville?: string;
    NIF?: string;
    Observations?: string;
    Actif?: boolean;
    entrepriseId?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

const FournisseurSchema = new Schema<IFournisseur>({
    Nom:          { type: String, maxlength: 120 },
    Contact:      { type: String, maxlength: 80 },
    Telephone:    { type: String, maxlength: 30 },
    Email:        { type: String, maxlength: 100 },
    Adresse:      { type: String, maxlength: 200 },
    Ville:        { type: String, maxlength: 80 },
    NIF:          { type: String, maxlength: 40 },
    Observations: { type: String, maxlength: 250 },
    Actif:        { type: Boolean, default: true },
    entrepriseId: { type: String },
}, { timestamps: true });

export const Fournisseur: Model<IFournisseur> =
    mongoose.models.Fournisseur ||
    mongoose.model<IFournisseur>("Fournisseur", FournisseurSchema);
