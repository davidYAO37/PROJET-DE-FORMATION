import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type LicenceHistoryAction =
  | "trial_started"
  | "trial_converted"
  | "order_created"
  | "order_paid"
  | "order_validated"
  | "purchased"
  | "renewed"
  | "maintenance_paid"
  | "modules_changed"
  | "suspended"
  | "resumed"
  | "resiliated";

export interface ILicenceHistory extends Document {
  entrepriseId: Types.ObjectId;
  orderId?: Types.ObjectId;
  action: LicenceHistoryAction;
  previousEndDate?: Date;
  newEndDate?: Date;
  previousMaintenanceDueDate?: Date;
  newMaintenanceDueDate?: Date;
  modules?: string[];
  price?: number;
  currency?: string;
  validatedBy?: Types.ObjectId;
  notes?: string;
  createdBy?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

const LicenceHistorySchema = new Schema<ILicenceHistory>(
  {
    entrepriseId: {
      type: Schema.Types.ObjectId,
      ref: "Entreprise",
      required: true,
      index: true,
    },
    orderId: { type: Schema.Types.ObjectId, ref: "LicenceOrder", index: true },
    action: {
      type: String,
      enum: [
        "trial_started",
        "trial_converted",
        "order_created",
        "order_paid",
        "order_validated",
        "purchased",
        "renewed",
        "maintenance_paid",
        "modules_changed",
        "suspended",
        "resumed",
        "resiliated",
      ],
      required: true,
    },
    previousEndDate: { type: Date },
    newEndDate: { type: Date },
    previousMaintenanceDueDate: { type: Date },
    newMaintenanceDueDate: { type: Date },
    modules: { type: [String], default: [] },
    price: { type: Number },
    currency: { type: String },
    validatedBy: { type: Schema.Types.ObjectId, ref: "User" },
    notes: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true, collection: "licencehistories" }
);

export const LicenceHistory: Model<ILicenceHistory> =
  mongoose.models.LicenceHistory ||
  mongoose.model<ILicenceHistory>("LicenceHistory", LicenceHistorySchema);
