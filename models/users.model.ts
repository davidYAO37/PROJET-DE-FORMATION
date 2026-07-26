import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IUser extends Document {
  nom?: string;
  prenom?: string;
  name?: string;
  email: string;
  password?: string;
  type?: string;
  uid?: string;
  entrepriseId?: Types.ObjectId;
  failedAttempts?: number;
  remainingAttempts?: number;
  isLocked?: boolean;
  lockedUntil?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const UserSchema = new Schema<IUser>(
  {
    nom: { type: String },
    prenom: { type: String },
    name: { type: String },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String },
    type: { type: String, default: "medecin" },
    uid: { type: String, unique: true, sparse: true },
    entrepriseId: { type: Schema.Types.ObjectId, ref: "Entreprise" },
    failedAttempts: { type: Number, default: 0 },
    remainingAttempts: { type: Number, default: 4 },
    isLocked: { type: Boolean, default: false },
    lockedUntil: { type: Date },
  },
  { timestamps: true, collection: "users" }
);

export const User: Model<IUser> =
  (mongoose.models.User as Model<IUser>) ||
  mongoose.model<IUser>("User", UserSchema);

export const UserCollection = User;
