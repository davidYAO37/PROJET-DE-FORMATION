import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type LicenceOrderAction = "purchase" | "renewal" | "maintenance";
export type LicenceOrderStatus =
  | "pending"
  | "paid_awaiting_validation"
  | "validated"
  | "failed"
  | "cancelled";
export type LicencePaymentMethod = "wave" | "manual" | "bank_transfer";

export interface ILicenceOrder extends Document {
  entrepriseId: Types.ObjectId;
  initiatedBy: Types.ObjectId;
  action: LicenceOrderAction;
  planCode?: string;
  modules: string[];
  durationMonths: number;
  amount: number;
  currency: string;
  status: LicenceOrderStatus;
  paymentMethod: LicencePaymentMethod;
  waveCheckoutId?: string;
  wavePaymentUrl?: string;
  waveTransactionId?: string;
  paidAt?: Date;
  validatedBy?: Types.ObjectId;
  validatedAt?: Date;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const LicenceOrderSchema = new Schema<ILicenceOrder>(
  {
    entrepriseId: {
      type: Schema.Types.ObjectId,
      ref: "Entreprise",
      required: true,
      index: true,
    },
    initiatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    action: {
      type: String,
      enum: ["purchase", "renewal", "maintenance"],
      required: true,
    },
    planCode: { type: String },
    modules: { type: [String], default: [] },
    durationMonths: { type: Number, required: true, min: 1 },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, default: "XOF" },
    status: {
      type: String,
      enum: ["pending", "paid_awaiting_validation", "validated", "failed", "cancelled"],
      default: "pending",
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ["wave", "manual", "bank_transfer"],
      required: true,
    },
    waveCheckoutId: { type: String },
    wavePaymentUrl: { type: String },
    waveTransactionId: { type: String },
    paidAt: { type: Date },
    validatedBy: { type: Schema.Types.ObjectId, ref: "User" },
    validatedAt: { type: Date },
    notes: { type: String },
  },
  { timestamps: true, collection: "licenceorders" }
);

export const LicenceOrder: Model<ILicenceOrder> =
  mongoose.models.LicenceOrder ||
  mongoose.model<ILicenceOrder>("LicenceOrder", LicenceOrderSchema);
