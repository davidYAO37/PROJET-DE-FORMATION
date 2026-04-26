import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  nom: string;
  prenom: string;
  email: string;
  type: string;
  entrepriseId?: mongoose.Types.ObjectId;
  uid: string;
  password?: string;
  failedAttempts?: number;
  isLocked?: boolean;
  lockedUntil?: Date;
  remainingAttempts?: number;
}

const UserSchema = new Schema<IUser>({
  nom: { type: String, required: true },
  prenom: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  type: { type: String, required: true },
  entrepriseId: { type: Schema.Types.ObjectId, ref: 'Entreprise', required: false },
  uid: { type: String, required: true },
  password: { type: String, required: false },
  failedAttempts: { type: Number, default: 0 },
  isLocked: { type: Boolean, default: false },
  lockedUntil: { type: Date },
  remainingAttempts: { type: Number, default: 4 }
});

export const UserCollection = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
