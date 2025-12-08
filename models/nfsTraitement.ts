import mongoose, { Schema, Document, Types, Model } from 'mongoose';

export interface INfsTraitement extends Document {
    Patient_Nom?: string;
    Patient_prenom?: string;
    PatientP?: string;
    Patient_ages?: string;
    Patient_Sexe?: string;
    Patient_numDossier?: string;
    NumNFs?: string;
    NFS_dateAnalyse?: Date;
    NFS_service?: string;
    NFS_idEchantillon?: string;
    diagnostiQ?: string;
    NFS_status?: string;
    NFS_unite?: string;
    NFS_parametres?: string;
    NFS_resultat?: string;
    NFS_plageRef?: string;
    NFS_id?: number;
    CodePrestation?: string;
    IDFAMILLE_ACTE_BIOLOGIE?: Types.ObjectId;
    CodeAscii?: number;
    ValeurMaxNormale?: number;
    ValeurMinNormale?: number;
    DejaUtilise?: boolean;
}

const NfsTraitementSchema = new Schema<INfsTraitement>({
    Patient_Nom: { type: String, maxlength: 50 },
    Patient_prenom: { type: String, maxlength: 50 },
    PatientP: { type: String, maxlength: 60 },
    Patient_ages: { type: String, maxlength: 50 },
    Patient_Sexe: { type: String, maxlength: 10 },
    Patient_numDossier: { type: String, maxlength: 50 },
    NumNFs: { type: String, maxlength: 50 },
    NFS_dateAnalyse: { type: Date },
    NFS_service: { type: String, maxlength: 50 },
    NFS_idEchantillon: { type: String, maxlength: 50 },
    diagnostiQ: { type: String, maxlength: 50 },
    NFS_status: { type: String, maxlength: 50 },
    NFS_unite: { type: String, maxlength: 50 },
    NFS_parametres: { type: String, maxlength: 50 },
    NFS_resultat: { type: String, maxlength: 50 },
    NFS_plageRef: { type: String, maxlength: 50 },
    NFS_id: { type: Number },
    CodePrestation: { type: String, maxlength: 50 },
    IDFAMILLE_ACTE_BIOLOGIE: { type: Schema.Types.ObjectId, ref: 'FamilleActe' },
    CodeAscii: { type: Number },
    ValeurMaxNormale: { type: Number },
    ValeurMinNormale: { type: Number },
    DejaUtilise: { type: Boolean, default: false },
}, { timestamps: true });
export const NfsTraitement: Model<INfsTraitement> = mongoose.models.NfsTraitement || mongoose.model<INfsTraitement>('NfsTraitement', NfsTraitementSchema);