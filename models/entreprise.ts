import mongoose, { Schema, Document, Model } from "mongoose";
import { ALL_MODULE_CODES, LicenceModuleCode } from "@/lib/licenceModules";

export type EntrepriseStatut = "active" | "suspendue" | "resiliee";
export type LicenceType = "trial" | "paid" | "maintenance_overdue";
export type LicenceStatus = "active" | "suspended" | "resiliated";

export interface IEntreprise extends Document {
  NomSociete?: string;
  nomSociete?: string;
  EnteteSociete?: string;
  enteteSociete?: string;
  LogoE?: string;
  logo?: string;
  PiedPageSociete?: string;
  piedPageSociete?: string;
  NCC?: string;
  ncc?: string;
  adresse?: string;
  contact?: string;
  email?: string;
  mongoUri?: string;
  dbName?: string;
  statut?: EntrepriseStatut;
  isActive?: boolean;

  // Licence
  licenceType?: LicenceType;
  licencePlan?: string;
  licenceStatus?: LicenceStatus;
  licenceStartDate?: Date;
  licenceEndDate?: Date;
  maintenanceDueDate?: Date;
  gracePeriodDays?: number;
  modules?: LicenceModuleCode[];
  licenceKey?: string;

  // Champ historique conservé pour compatibilité, synchronisé avec licenceEndDate
  dateExpiration?: Date;
  lastAlertShownAt?: Date;
}

const EntrepriseSchema = new Schema<IEntreprise>(
  {
    NomSociete: { type: String, alias: "nomSociete", maxlength: 1000 },
    EnteteSociete: { type: String, alias: "enteteSociete", maxlength: 10000 },
    LogoE: { type: String, alias: "logo" },
    PiedPageSociete: { type: String, alias: "piedPageSociete", maxlength: 10000 },
    NCC: { type: String, alias: "ncc", maxlength: 50 },
    adresse: { type: String, maxlength: 500 },
    contact: { type: String, maxlength: 100 },
    email: { type: String, maxlength: 200, lowercase: true },
    mongoUri: { type: String, maxlength: 1000 },
    dbName: { type: String, maxlength: 200, unique: true, sparse: true },
    statut: {
      type: String,
      enum: ["active", "suspendue", "resiliee"],
      default: "active",
    },
    isActive: { type: Boolean, default: true },

    // Licence
    licenceType: {
      type: String,
      enum: ["trial", "paid", "maintenance_overdue"],
    },
    licencePlan: { type: String },
    licenceStatus: {
      type: String,
      enum: ["active", "suspended", "resiliated"],
      default: "active",
    },
    licenceStartDate: { type: Date },
    licenceEndDate: { type: Date },
    maintenanceDueDate: { type: Date },
    gracePeriodDays: { type: Number, default: 15, min: 0 },
    modules: {
      type: [String],
      enum: ALL_MODULE_CODES,
      default: [],
    },
    licenceKey: { type: String, maxlength: 2000 },

    // Compatibilité
    dateExpiration: { type: Date },
    lastAlertShownAt: { type: Date },
  },
  { timestamps: true, collection: "entreprises" }
);

export const Entreprise: Model<IEntreprise> =
  mongoose.models.Entreprise ||
  mongoose.model<IEntreprise>("Entreprise", EntrepriseSchema);
