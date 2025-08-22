import mongoose, { Schema, Document, Model } from "mongoose";

export interface IConsultation extends Document {
  designationC: string;
  assurance: string;
  Assuré: string;                       // "NON ASSURE" | "TARIF MUTUALISTE" | "TARIF ASSURE"
  IDASSURANCE?: mongoose.Types.ObjectId;

  Prix_Assurance: number;
  PrixClinique: number;
  Restapayer: number;
  montantapayer: number;
  ReliquatPatient: number;

  Code_dossier: string;
  Code_Prestation: string;
  Date_consulation: Date;
  Heure_Consultation: string;

  StatutC: boolean;
  StatutPaiement: string;
  Toutencaisse: boolean;

  tauxAssurance: number;
  PartAssurance: number;
  tiket_moderateur: number;
  numero_carte?: string;
  NumBon?: string;

  Recupar: string;
  IDACTE: string;

  IDPARTIENT?: mongoose.Types.ObjectId;
  Souscripteur?: string;
  PatientP?: string;
  SOCIETE_PATIENT?: string;
  IDSOCIETEASSUANCE?: string;

  Medecin?: string;
  IDMEDECIN?: mongoose.Types.ObjectId;
  MontantMedecin: number;

  IDAPPORTEUR?: string;
  StatuPrescriptionMedecin: number;
}

const ConsultationSchema: Schema<IConsultation> = new Schema(
  {
    designationC: { type: String, required: true },
    assurance: { type: String, required: true },
    Assuré: { type: String, required: true },
    IDASSURANCE: { type: Schema.Types.ObjectId, ref: "Assurance" },

    Prix_Assurance: { type: Number, default: 0 },
    PrixClinique: { type: Number, default: 0 },
    Restapayer: { type: Number, default: 0 },
    montantapayer: { type: Number, default: 0 },
    ReliquatPatient: { type: Number, default: 0 },

    Code_dossier: { type: String, required: false },
    Code_Prestation: { type: String, required: false },
    Date_consulation: { type: Date, default: Date.now },
    Heure_Consultation: { type: String },

    StatutC: { type: Boolean, default: false },
    StatutPaiement: { type: String, default: "En cours de Paiement" },
    Toutencaisse: { type: Boolean, default: false },

    tauxAssurance: { type: Number, default: 0 },
    PartAssurance: { type: Number, default: 0 },
    tiket_moderateur: { type: Number, default: 0 },
    numero_carte: { type: String },
    NumBon: { type: String },

    Recupar: { type: String, required: true },
    IDACTE: { type: String, required: true },

    IDPARTIENT: { type: Schema.Types.ObjectId, ref: "Patient" },
    Souscripteur: { type: String },
    PatientP: { type: String },
    SOCIETE_PATIENT: { type: String },
    IDSOCIETEASSUANCE: { type: String },

    Medecin: { type: String },
    IDMEDECIN: { type: Schema.Types.ObjectId, ref: "Medecin" },
    MontantMedecin: { type: Number, default: 0 },
    StatuPrescriptionMedecin: { type: Number, default: 2 },
  },
  { timestamps: true }
);

// ---------------------------
// 🔹 Génération automatique Code_Prestation
// ---------------------------
ConsultationSchema.pre<IConsultation>("save", async function (next) {
  if (!this.isNew) return next(); // Ne régénère pas en modification

  try {
    // Récupérer le patient lié
    const PatientModel = mongoose.model("Patient");
    const patient: any = await PatientModel.findById(this.IDPARTIENT).lean();

    if (!patient) {
      return next(new Error("Patient introuvable pour générer le Code_Prestation"));
    }

    // Compter toutes les consultations déjà enregistrées pout tous les patients
    const countConsultations = await mongoose.model("Consultation").countDocuments();



    // Générer les initiales du patient
    const initialNom = patient.nom ? patient.nom.substring(0, 1).toUpperCase() : "X";
    const initialPrenom = patient.prenoms ? patient.prenoms.substring(0, 1).toUpperCase() : "X";
    const initials = `${initialNom}${initialPrenom}`;

    // Générer le code prestation (ex: AB001)
    const numero = (countConsultations + 1).toString().padStart(3, "0");

    this.Code_Prestation = `${initials}${numero}`;

    next();
  } catch (err) {
    next(err as any);
  }
});


export const Consultation: Model<IConsultation> =
  mongoose.models.Consultation ||
  mongoose.model<IConsultation>("Consultation", ConsultationSchema);
