import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type LicenceOrderAction = "purchase" | "maintenance";
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
  items?: Array<{
    code?: string;
    name: string;
    qty: number;
    unit: number;
    total: number;
  }>;
  durationMonths?: number;
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
  cancelledBy?: Types.ObjectId;
  cancelledAt?: Date;
  orderFormUrl?: string;
  paymentReceiptUrl?: string;
  acquisitionContractUrl?: string;
  maintenanceContractUrl?: string;
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
      enum: ["purchase", "maintenance"],
      required: true,
    },
    planCode: { type: String },
    modules: { type: [String], default: [] },
    items: {
      type: [
        {
          code: { type: String },
          name: { type: String, required: true },
          qty: { type: Number, required: true, default: 1 },
          unit: { type: Number, required: true, default: 0 },
          total: { type: Number, required: true, default: 0 },
        },
      ],
      default: [],
    },
    // Informatif uniquement : 0 pour un achat (licence perpétuelle), 12 pour la maintenance annuelle.
    durationMonths: { type: Number, default: 0, min: 0 },
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
    cancelledBy: { type: Schema.Types.ObjectId, ref: "User" },
    cancelledAt: { type: Date },
    // Documents related to the order
    orderFormUrl: { type: String },
    paymentReceiptUrl: { type: String },
    acquisitionContractUrl: { type: String },
    maintenanceContractUrl: { type: String },
    notes: { type: String },
  },
  { timestamps: true, collection: "licenceorders" }
);

export const LicenceOrder: Model<ILicenceOrder> =
  mongoose.models.LicenceOrder ||
  mongoose.model<ILicenceOrder>("LicenceOrder", LicenceOrderSchema);
