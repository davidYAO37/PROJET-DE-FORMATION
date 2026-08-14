import mongoose, { Schema, Document, Model } from "mongoose";

export type LicencePlanCode = "trial" | "annual" | "custom";

export interface ILicencePlan extends Document {
  code: LicencePlanCode;
  name: string;
  description?: string;
  durationMonths: number;
  defaultModules: string[];
  defaultPrice: number;
  currency: string;
  isActive: boolean;
  allowModuleSelection: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const LicencePlanSchema = new Schema<ILicencePlan>(
  {
    code: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    description: { type: String },
    durationMonths: { type: Number, required: true, min: 1 },
    defaultModules: { type: [String], default: [] },
    defaultPrice: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, default: "XOF" },
    isActive: { type: Boolean, default: true },
    allowModuleSelection: { type: Boolean, default: false },
  },
  { timestamps: true, collection: "licenceplans" }
);

export const LicencePlan: Model<ILicencePlan> =
  mongoose.models.LicencePlan ||
  mongoose.model<ILicencePlan>("LicencePlan", LicencePlanSchema);
