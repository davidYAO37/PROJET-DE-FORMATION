import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IOperation extends Document {
    Libeleo?: string;
    TYPEOP?: string;
}

const OperationSchema = new Schema<IOperation>({
    Libeleo: { type: String, maxlength: 50 },
    TYPEOP: { type: String, maxlength: 60 },
}, { timestamps: true });

export const Operation: Model<IOperation> = mongoose.models.Operation || mongoose.model<IOperation>('Operation', OperationSchema);