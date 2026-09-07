/**
 * Mapping spécifique aux exports CSV WinDev fournis.
 *
 * Les fichiers ont été exportés avec ; comme séparateur et Windows-1252
 * comme encodage. La première colonne contient un chemin image.
 * Plusieurs champs texte (ExamenParaclinique, Traitement, Diagnostic...)
 * peuvent contenir des retours à la ligne non encapsulés ; ils sont
 * prétraités par import.js avant parsing.
 */

const { rtfToText } = require('./rtf');

function splitNomPrenoms(fullName) {
  if (!fullName) return { Nom: '', Prenoms: '' };
  const parts = String(fullName).trim().split(/\s+/);
  if (parts.length === 1) return { Nom: parts[0], Prenoms: '(non renseigné)' };
  return { Nom: parts.slice(0, -1).join(' '), Prenoms: parts[parts.length - 1] };
}

// Ordre exact des colonnes dans patient.csv
const patientColumns = [
  'image',
  'IDPARTIENT',
  'Nom',
  'Sexe',
  'Age_partient',
  'Date_naisse',
  'Code_dossier',
  'tranche_age',
  'SituationGeo',
  'Reçule',
  'GROUPSA',
  'Contact',
  'ProvisionClient',
  'DepenseProvision',
  'SocieteP',
  'Matricule',
  'AntecedentMedico',
  'AnteChirurgico',
  'AnteFamille',
  'AutreAnte',
  'Souscripteur',
  'AlergiePatient',
  'IDASSURANCE',
  'Assuance',
  'IDSOCIETEASSUANCE',
  'SOCIETE_PATIENT',
  'Taux',
  'TarifPatient',
  'PesoAcontacter',
];

// Ordre exact des colonnes dans consultation.csv
const consultationColumns = [
  'image',
  'IDCONSULTATION',
  'Code_Prestation',
  'designationC',
  'Motif_consultation',
  'PrixClinique',
  'Prix_Assurance',
  'Code_dossier',
  'montantapayer',
  'tiket_moderateur',
  'StatutC',
  'Date_consulation',
  'Heure_Consultation',
  'assurance',
  'numero_carte',
  'PartAssurance',
  'tauxAssurance',
  'Montantencaisse',
  'Restapayer',
  'IDPARTIENT',
  'IDMEDECIN',
  'Medecin',
  'Heure_Medecin',
  'IDACTE',
  'Heure_Facturation',
  'Temperature',
  'Tension',
  'Glycemie',
  'TailleCons',
  'Poids',
  'Assure',
  'ConstancePrisepar',
  'Recupar',
  'FacturePar',
  'EXAMENDEMANDE',
  'ExamenParaclinique',
  'Traitement',
  'ConclusionConsultation',
  'Diagnostic',
  'IDASSURANCE',
  'IDAPPORTEUR',
  'StatutFacture',
  'Numfacture',
  'NumBon',
  'MontantMedecin',
  'MontantApporteur',
  'Statumed',
  'BanqueC',
  'NumCheque',
  'Modepaiement',
  'ReliquatPatient',
  'DateFacturation',
  'CautionPatient',
  'StatutApporteur',
  'Document',
  'Souscripteur',
  'Heure_service',
  'NumCarteVisa',
  'NumCompteVisa',
  'AlergiePatient',
  'StatuPrescriptionMedecin',
  'MotifConsultation',
  'Ordonnerlannulation',
  'AnnulOrdonnerPar',
  'AnnulationOrdonneLe',
  'AnnulerPar',
  'Annulerle',
  'StatutPaiement',
  'NCC',
  'PatientP',
  'AttenteAccueil',
  'AttenteMedecin',
  'MotifAnnulationFacture',
  'REMISE',
  'MotifRemise',
  'Toutencaisse',
  'IDSOCIETEASSURANCE',
  'SOCIETE_PATIENT',
  'StactFacPatient',
  'StactFactAssurance',
];

function getField(row, columns, name) {
  const idx = columns.indexOf(name);
  if (idx === -1) return undefined;
  return typeof row[idx] === 'string' ? rtfToText(row[idx]) : row[idx];
}

function toNumber(value) {
  if (value === undefined || value === null || value === '') return 0;
  const cleaned = String(value)
    .replace(/\s/g, '')
    .replace(/,/g, '.');
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}

function toBoolean(value) {
  if (value === undefined || value === null || value === '') return false;
  const s = String(value).trim().toLowerCase();
  return s === 'true' || s === '1' || s === 'oui' || s === 'vrai' || s === 'yes';
}

function parseDate(value) {
  if (!value) return null;
  const s = String(value).trim();
  // Format ivoirien / WinDev : DD/MM/YYYY (prioritaire)
  const parts = s.split(/[\/\-\.]/);
  if (parts.length === 3) {
    const [d, m, y] = parts.map(Number);
    if (d >= 1 && d <= 31 && m >= 1 && m <= 12 && y > 1900) {
      const date = new Date(y, m - 1, d);
      if (!isNaN(date.getTime())) return date;
    }
  }
  // Fallback ISO / JS
  const iso = new Date(s);
  if (!isNaN(iso.getTime()) && iso.getFullYear() > 1900) return iso;
  return null;
}

function normalizeSexe(value) {
  const s = String(value || '').trim().toLowerCase();
  if (['m', 'masculin', 'homme', 'h'].includes(s)) return 'Masculin';
  if (['f', 'feminin', 'féminin', 'feminine', 'féminine', 'femme'].includes(s)) return 'Feminin';
  return String(value || '').toUpperCase();
}

function normalizeAssure(value) {
  const s = String(value || '').trim().toUpperCase();
  if (s.includes('MUTUAL')) return 'TARIF MUTUALISTE';
  if (s.includes('ASSURE') || s.includes('ASSURÉ') || s === 'OUI' || s === 'YES') return 'TARIF ASSURE';
  return 'NON ASSURE';
}

function mapPatient(row) {
  const nomComplet = getField(row, patientColumns, 'Nom');
  const { Nom, Prenoms } = splitNomPrenoms(nomComplet);

  return {
    _legacyId: toNumber(getField(row, patientColumns, 'IDPARTIENT')),
    Nom,
    Prenoms,
    sexe: normalizeSexe(getField(row, patientColumns, 'Sexe')),
    Age_partient: toNumber(getField(row, patientColumns, 'Age_partient')),
    Date_naisse: parseDate(getField(row, patientColumns, 'Date_naisse')) || new Date('1900-01-01'),
    Code_dossier: String(getField(row, patientColumns, 'Code_dossier') || '').trim(),
    Situationgeo: getField(row, patientColumns, 'SituationGeo'),
    Contact: getField(row, patientColumns, 'Contact'),
    AntecedentMedico: getField(row, patientColumns, 'AntecedentMedico'),
    AnteChirurgico: getField(row, patientColumns, 'AnteChirurgico'),
    AnteFamille: getField(row, patientColumns, 'AnteFamille'),
    AutreAnte: getField(row, patientColumns, 'AutreAnte'),
    Assurance: getField(row, patientColumns, 'Assuance'),
    SOCIETE_PATIENT: getField(row, patientColumns, 'SOCIETE_PATIENT'),
    Taux: toNumber(getField(row, patientColumns, 'Taux')),
    Matricule: getField(row, patientColumns, 'Matricule'),
    Souscripteur: getField(row, patientColumns, 'Souscripteur'),
    AlergiePatient: getField(row, patientColumns, 'AlergiePatient'),
    entrepriseId: process.env.ENTREPRISE_ID || undefined,
  };
}

function mapConsultation(row, maps) {
  const idPatientWinDev = String(getField(row, consultationColumns, 'IDPARTIENT') || '').trim();
  const codeDossier = String(getField(row, consultationColumns, 'Code_dossier') || '').trim();
  let patientId;
  if (maps && maps.patientByWinDevId) {
    patientId = maps.patientByWinDevId.get(idPatientWinDev) || maps.patientByCodeDossier.get(codeDossier);
  } else {
    patientId = maps.get(idPatientWinDev) || maps.get(codeDossier);
  }

  if (!patientId) {
    console.warn(`Consultation sans patient (IDPARTIENT=${idPatientWinDev})`);
    return null;
  }

  const dateConsult = parseDate(getField(row, consultationColumns, 'Date_consulation')) || new Date();

  return {
    _legacyId: toNumber(getField(row, consultationColumns, 'IDCONSULTATION')),
    designationC: getField(row, consultationColumns, 'designationC') || 'CONSULTATION',
    assurance: getField(row, consultationColumns, 'assurance') || '',
    Assure: normalizeAssure(getField(row, consultationColumns, 'Assure')),
    Prix_Assurance: toNumber(getField(row, consultationColumns, 'Prix_Assurance')),
    PrixClinique: toNumber(getField(row, consultationColumns, 'PrixClinique')),
    Restapayer: toNumber(getField(row, consultationColumns, 'Restapayer')),
    montantapayer: toNumber(getField(row, consultationColumns, 'montantapayer')),
    ReliquatPatient: toNumber(getField(row, consultationColumns, 'ReliquatPatient')),
    Code_dossier: codeDossier,
    CodePrestation: getField(row, consultationColumns, 'Code_Prestation'),
    Date_consulation: dateConsult,
    Heure_Consultation: getField(row, consultationColumns, 'Heure_Consultation') || '',
    StatutC: toBoolean(getField(row, consultationColumns, 'StatutC')),
    StatutPaiement: getField(row, consultationColumns, 'StatutPaiement') || 'En cours de Paiement',
    Toutencaisse: toBoolean(getField(row, consultationColumns, 'Toutencaisse')),
    tauxAssurance: toNumber(getField(row, consultationColumns, 'tauxAssurance')),
    PartAssurance: toNumber(getField(row, consultationColumns, 'PartAssurance')),
    tiket_moderateur: toNumber(getField(row, consultationColumns, 'tiket_moderateur')),
    numero_carte: getField(row, consultationColumns, 'numero_carte') || undefined,
    NumBon: getField(row, consultationColumns, 'NumBon') || undefined,
    Recupar: getField(row, consultationColumns, 'Recupar') || '',
    IDACTE: String(getField(row, consultationColumns, 'IDACTE') || ''),
    IdPatient: new (require('mongoose').Types.ObjectId)(patientId),
    Souscripteur: getField(row, consultationColumns, 'Souscripteur'),
    PatientP: getField(row, consultationColumns, 'PatientP'),
    SOCIETE_PATIENT: getField(row, consultationColumns, 'SOCIETE_PATIENT'),
    IDSOCIETEASSURANCE: getField(row, consultationColumns, 'IDSOCIETEASSURANCE'),
    Medecin: getField(row, consultationColumns, 'Medecin') || '',
    // Les identifiants numériques WinDev ne sont pas des ObjectId MongoDB.
    // On conserve uniquement le nom du médecin ; les tables liées (Médecin,
    // Assurance, Apporteur) pourront être importées plus tard.
    IDMEDECIN: undefined,
    MontantMedecin: toNumber(getField(row, consultationColumns, 'MontantMedecin')),
    Sexe: undefined,
    statutPrescriptionMedecin: toNumber(getField(row, consultationColumns, 'StatuPrescriptionMedecin')),
    Diagnostic: getField(row, consultationColumns, 'Diagnostic'),
    ExamenClinique: undefined,
    CodeAffection: undefined,
    MotifConsultation: getField(row, consultationColumns, 'Motif_consultation') || getField(row, consultationColumns, 'MotifConsultation'),
    ExamenParaclinique: getField(row, consultationColumns, 'ExamenParaclinique'),
    TraitementClinique: getField(row, consultationColumns, 'Traitement'),
    ConclusionClinique: getField(row, consultationColumns, 'ConclusionConsultation'),
    Temperature: getField(row, consultationColumns, 'Temperature'),
    Poids: getField(row, consultationColumns, 'Poids'),
    Tension: getField(row, consultationColumns, 'Tension'),
    Glycemie: getField(row, consultationColumns, 'Glycemie'),
    TailleCons: getField(row, consultationColumns, 'TailleCons'),
    AttenteAccueil: toNumber(getField(row, consultationColumns, 'AttenteAccueil')),
    attenteMedecin: toNumber(getField(row, consultationColumns, 'AttenteMedecin')),
    Montantencaisse: toNumber(getField(row, consultationColumns, 'Montantencaisse')),
    DateFacturation: parseDate(getField(row, consultationColumns, 'DateFacturation')) || dateConsult,
    Modepaiement: getField(row, consultationColumns, 'Modepaiement') || '',
    Caissiere: getField(row, consultationColumns, 'FacturePar') || '',
    entrepriseId: process.env.ENTREPRISE_ID || undefined,
    Statumed: toNumber(getField(row, consultationColumns, 'Statumed')),
    StatutFacturation: toBoolean(getField(row, consultationColumns, 'StatutFacture')),
    StatutFacture: toBoolean(getField(row, consultationColumns, 'StatutFacture')),
    Numfacture: getField(row, consultationColumns, 'Numfacture') || '',
    Ordonnerlannulation: toNumber(getField(row, consultationColumns, 'Ordonnerlannulation')),
    AnnulOrdonnerPar: getField(row, consultationColumns, 'AnnulOrdonnerPar') || '',
    AnnulationOrdonneLe: parseDate(getField(row, consultationColumns, 'AnnulationOrdonneLe')),
    StatutAnnulation: undefined,
    MotifAnnulationFacture: getField(row, consultationColumns, 'MotifAnnulationFacture'),
    Annulerle: parseDate(getField(row, consultationColumns, 'Annulerle')),
    AnnulerPar: getField(row, consultationColumns, 'AnnulerPar'),
  };
}

module.exports = {
  patientColumns,
  consultationColumns,
  mapPatient,
  mapConsultation,
  toNumber,
  toBoolean,
  parseDate,
  normalizeSexe,
  normalizeAssure,
};
