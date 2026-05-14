import mongoose, { Schema, Document, Model } from "mongoose";
import {
  ARRET_TRAVAIL_TYPES,
  ARRET_TRAVAIL_STATUTS,
  ARRET_TRAVAIL_LABELS,
  ARRET_TRAVAIL_STATUT_LABELS,
  TypeArretTravail,
  StatutArretTravail,
} from '@/types/arretTravail';

export interface IArretTravail extends Document {
  patientId: mongoose.Types.ObjectId;
  patientNom?: string;
  patientPrenoms?: string;
  dateDebut: Date;
  dateFin: Date;
  motif: string;
  medecinTraitant: string;
  statut: StatutArretTravail;
  document?: Buffer;
  numeroDocument: string;
  dateCreation: Date;
  medecinId?: mongoose.Types.ObjectId;
  entrepriseId?: string;
  observations?: string;
  typeArret: TypeArretTravail;
  dureeJours: number;
  dateReprise?: Date;
  certificatMedical?: boolean;
  numeroCertificat?: string;
  medecinCertificat?: string;
  dateCertificat?: Date;
  dateAccident?: Date;
  termeGrossesse?: string;
  dateEntreeHospitalisation?: Date;
  dateSortieHospitalisation?: Date;
  interventionChirurgicale?: string;
  suiviPsychologique?: string;
  precisionsIsolement?: string;
}

const ArretTravailSchema: Schema<IArretTravail> = new Schema(
  {
    patientId: {
      type: Schema.Types.ObjectId,
      ref: "Patient",
      required: true
    },
    patientNom: {
      type: String,
      required: true
    },
    patientPrenoms: {
      type: String,
      required: true
    },
    dateDebut: {
      type: Date,
      required: true
    },
    dateFin: {
      type: Date,
      required: true
    },
    motif: {
      type: String,
      required: true
    },
    medecinTraitant: {
      type: String,
      required: true
    },
    statut: {
      type: String,
      enum: ARRET_TRAVAIL_STATUTS,
      default: 'en_cours'
    },
    document: {
      type: Buffer
    },
    numeroDocument: {
      type: String,
      required: true,
      unique: true
    },
    dateCreation: {
      type: Date,
      default: Date.now
    },
    medecinId: {
      type: Schema.Types.ObjectId,
      ref: "Medecin"
    },
    entrepriseId: {
      type: String
    },
    observations: {
      type: String
    },
    typeArret: {
      type: String,
      enum: [...ARRET_TRAVAIL_TYPES],
      default: 'maladie'
    },
    dureeJours: {
      type: Number,
      required: true
    },
    dateReprise: {
      type: Date
    },
    certificatMedical: {
      type: Boolean,
      default: true
    },
    numeroCertificat: {
      type: String
    },
    medecinCertificat: {
      type: String
    },
    dateCertificat: {
      type: Date
    },
    dateAccident: { type: Date },
    termeGrossesse: { type: String },
    dateEntreeHospitalisation: { type: Date },
    dateSortieHospitalisation: { type: Date },
    interventionChirurgicale: { type: String },
    suiviPsychologique: { type: String },
    precisionsIsolement: { type: String }
  },
  {
    timestamps: true,
    collection: "arrettravails"
  }
);

// Index pour optimiser les requêtes
ArretTravailSchema.index({ patientId: 1 });
// numeroDocument est déjà unique via la définition du schéma
ArretTravailSchema.index({ statut: 1 });
ArretTravailSchema.index({ dateCreation: -1 });
ArretTravailSchema.index({ entrepriseId: 1 });

// Middleware pour calculer automatiquement la durée et la date de reprise
ArretTravailSchema.pre('save', function (next) {
  if (this.dateDebut && this.dateFin) {
    // Calculer la durée en jours
    const debut = new Date(this.dateDebut);
    const fin = new Date(this.dateFin);
    const duree = Math.ceil((fin.getTime() - debut.getTime()) / (1000 * 60 * 60 * 24));
    this.dureeJours = Math.max(0, duree);

    // Calculer la date de reprise (lendemain de la fin)
    const reprise = new Date(fin);
    reprise.setDate(reprise.getDate() + 1);
    this.dateReprise = reprise;
  }

  // Générer un numéro de document si non fourni
  if (!this.numeroDocument) {
    const year = new Date().getFullYear();
    const random = Math.random().toString(36).substr(2, 9).toUpperCase();
    this.numeroDocument = `AT-${year}-${random}`;
  }

  next();
});

// Méthode virtuelle pour obtenir le libellé du statut
ArretTravailSchema.virtual('statutLibelle').get(function () {
  return ARRET_TRAVAIL_STATUT_LABELS[this.statut as StatutArretTravail] ?? this.statut;
});

// Méthode virtuelle pour obtenir le libellé du type d'arrêt
ArretTravailSchema.virtual('typeArretLibelle').get(function () {
  const t = this.typeArret as TypeArretTravail;
  return ARRET_TRAVAIL_LABELS[t] ?? this.typeArret;
});

// Méthode pour vérifier si l'arrêt est toujours valide
ArretTravailSchema.methods.estValide = function () {
  const aujourdHui = new Date();
  return this.statut === 'en_cours' &&
    aujourdHui >= this.dateDebut &&
    aujourdHui <= this.dateFin;
};

// Méthode pour prolonger un arrêt
ArretTravailSchema.methods.prolonger = function (nouvelleDateFin: Date, motifProlongation?: string) {
  this.dateFin = nouvelleDateFin;
  if (motifProlongation) {
    this.motif += `\n\nProlongation: ${motifProlongation}`;
  }
  return this.save();
};

// Méthode pour terminer un arrêt
ArretTravailSchema.methods.terminer = function (dateFinReelle?: Date) {
  this.statut = 'termine';
  if (dateFinReelle) {
    this.dateFin = dateFinReelle;
  }
  return this.save();
};

// Méthode pour annuler un arrêt
ArretTravailSchema.methods.annuler = function (motifAnnulation?: string) {
  this.statut = 'annule';
  if (motifAnnulation) {
    this.observations = (this.observations || '') + `\n\nAnnulation: ${motifAnnulation}`;
  }
  return this.save();
};

// Static method pour trouver les arrêts en cours pour un patient
ArretTravailSchema.statics.findEnCoursByPatient = function (patientId: string) {
  return this.find({
    patientId: patientId,
    statut: 'en_cours'
  }).sort({ dateCreation: -1 });
};

// Static method pour trouver les arrêts par période
ArretTravailSchema.statics.findByPeriode = function (dateDebut: Date, dateFin: Date) {
  return this.find({
    $or: [
      { dateDebut: { $gte: dateDebut, $lte: dateFin } },
      { dateFin: { $gte: dateDebut, $lte: dateFin } },
      { dateDebut: { $lte: dateDebut }, dateFin: { $gte: dateFin } }
    ]
  }).sort({ dateCreation: -1 });
};

// Static method pour obtenir les statistiques
ArretTravailSchema.statics.getStatistiques = function (entrepriseId?: string) {
  const match: any = {};
  if (entrepriseId) {
    match.entrepriseId = entrepriseId;
  }

  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$statut',
        count: { $sum: 1 },
        dureeTotale: { $sum: '$dureeJours' }
      }
    }
  ]);
};

const ArretTravail: Model<IArretTravail> = mongoose.models.ArretTravail || mongoose.model<IArretTravail>("ArretTravail", ArretTravailSchema);

export default ArretTravail;
