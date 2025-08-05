import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  nom: string;
  prenom: string;
  email: string;
  type: string;
  uid: string;
}

const UserSchema = new Schema<IUser>({
  nom: { type: String, required: true },
  prenom: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  type: { type: String, required: true },
  uid: { type: String, required: true },
});

export const UserCollection = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
