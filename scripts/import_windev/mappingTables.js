/**
 * Mapping pour les tables WinDev supplémentaires.
 * Réutilise les helpers de mapping.js.
 */

const { toNumber, toBoolean, parseDate, normalizeAssure, normalizeSexe } = require('./mapping');
const { rtfToText } = require('./rtf');

function getField(row, columns, name) {
  const idx = columns.indexOf(name);
  if (idx === -1) return undefined;
  return typeof row[idx] === 'string' ? rtfToText(row[idx]) : row[idx];
}

function excelTimeToString(value) {
  if (value === undefined || value === null || value === '') return '';
  if (typeof value === 'string' && value.includes(':')) return value;
  const n = toNumber(value);
  if (n <= 0 || n >= 1) return String(value);
  const totalSeconds = Math.round(n * 86400);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function splitNomPrenoms(fullName) {
  if (!fullName) return { Nom: '', Prenoms: '(non renseigné)' };
  const parts = String(fullName).trim().split(/\s+/);
  if (parts.length === 1) return { Nom: parts[0], Prenoms: '(non renseigné)' };
  return { Nom: parts.slice(0, -1).join(' '), Prenoms: parts[parts.length - 1] };
}

// ============================================================================
// ASSURANCE
// ============================================================================
const assuranceColumns = ['image', 'IDASSURANCE', 'Designation', 'NCC'];

function mapAssurance(row) {
  const id = toNumber(getField(row, assuranceColumns, 'IDASSURANCE'));
  const designation = getField(row, assuranceColumns, 'Designation');
  if (!id && !designation) return null;

  return {
    _legacyId: id,
    designationassurance: designation || `Assurance ${id}`,
    codeassurance: String(id),
    telephone: '00000000',
    email: '',
    NCC: getField(row, assuranceColumns, 'NCC') || '',
    societes: [],
    entrepriseId: process.env.ENTREPRISE_ID || undefined,
  };
}

const acteColumns = [
  'image', 'IDACTEP', 'Designation', 'LettreCle', 'IDTYPE_ACTE',
  'CoefficientActe', 'Prix', 'montantacte', 'TYPEACTE', 'PrixMutualiste',
  'PrixAssure', 'MontantAuMed', 'resultatacte', 'IDFAMILLE_ACTE_BIOLOGIE',
  'TypeResultat', 'Interpretation', 'ORdonnacementAffichage',
  'MontantAnesthesiste', 'MontantAideOperatoire',
];

function mapActe(row, maps) {
  const legacyId = String(getField(row, acteColumns, 'IDACTEP') || '').trim();
  const designation = String(getField(row, acteColumns, 'Designation') || '').trim();
  if (!legacyId || !designation) return null;

  return {
    _legacyId: legacyId,
    designationacte: designation,
    lettreCle: String(getField(row, acteColumns, 'LettreCle') || ''),
    coefficient: toNumber(getField(row, acteColumns, 'CoefficientActe')),
    prixClinique: toNumber(getField(row, acteColumns, 'Prix')),
    prixMutuel: toNumber(getField(row, acteColumns, 'PrixMutualiste')),
    prixPreferentiel: toNumber(getField(row, acteColumns, 'PrixAssure')),
    IDTYPE_ACTE: toObjectIdOrUndefined(getField(row, acteColumns, 'IDTYPE_ACTE'), maps.typeActeById),
    montantacte: toNumber(getField(row, acteColumns, 'montantacte')),
    TYPEACTE: getField(row, acteColumns, 'TYPEACTE'),
    MontantAuMed: toNumber(getField(row, acteColumns, 'MontantAuMed')),
    resultatacte: getField(row, acteColumns, 'resultatacte'),
    IDFAMILLE_ACTE_BIOLOGIE: toObjectIdOrUndefined(getField(row, acteColumns, 'IDFAMILLE_ACTE_BIOLOGIE'), maps.familleActeById),
    TypeResultat: toNumber(getField(row, acteColumns, 'TypeResultat')),
    Interpretation: getField(row, acteColumns, 'Interpretation'),
    ORdonnacementAffichage: toNumber(getField(row, acteColumns, 'ORdonnacementAffichage')),
    MontantAnesthesiste: toNumber(getField(row, acteColumns, 'MontantAnesthesiste')),
    MontantAideOperatoire: toNumber(getField(row, acteColumns, 'MontantAideOperatoire')),
    entrepriseId: process.env.ENTREPRISE_ID || undefined,
  };
}

const tarifAssuranceColumns = [
  'image', 'IDACTARIF', 'Designation', 'LettreCle', 'CoefficientActe',
  'PrixMutualiste', 'PrixAssure', 'TYPEACTE', 'IDASSURANCE', 'Date', 'CreePar',
];

function mapTarifAssurance(row, maps) {
  const designation = String(getField(row, tarifAssuranceColumns, 'Designation') || '').trim();
  const assuranceId = maps.assuranceByWinDevId.get(String(getField(row, tarifAssuranceColumns, 'IDASSURANCE') || '').trim());
  const acteId = maps.acteByDesignation.get(designation.toLocaleLowerCase('fr'));
  if (!designation || !assuranceId || !acteId) return null;

  return {
    _legacyId: String(getField(row, tarifAssuranceColumns, 'IDACTARIF') || ''),
    acte: designation,
    acteId: new (require('mongoose').Types.ObjectId)(acteId),
    lettreCle: String(getField(row, tarifAssuranceColumns, 'LettreCle') || ''),
    coefficient: toNumber(getField(row, tarifAssuranceColumns, 'CoefficientActe')),
    prixmutuel: toNumber(getField(row, tarifAssuranceColumns, 'PrixMutualiste')),
    prixpreferenciel: toNumber(getField(row, tarifAssuranceColumns, 'PrixAssure')),
    assurance: new (require('mongoose').Types.ObjectId)(assuranceId),
    entrepriseId: process.env.ENTREPRISE_ID || undefined,
  };
}

// ============================================================================
// FACTURATION
// ============================================================================
const facturationColumns = [
  'image',
  'IDFACTURATION',
  'Code_Prestation',
  'NomMed',
  'PatientP',
  'DatePres',
  'SaisiPar',
  'Rclinique',
  'Montanttotal',
  'TotalPaye',
  'TotaleTaxe',
  'MontantRecu',
  'reduction',
  'tauxreduction',
  'MotifRemise',
  'Restapayer',
  'TotalapayerPatient',
  'SocieteP',
  'PartAssuranceP',
  'Partassuré',
  'Assuance',
  'Taux',
  'IDASSURANCE',
  'IDTYPE_ACTE',
  'FacturéPar',
  'IDPARTIENT',
  'CompteClient',
  'ModifierPar',
  'DateModif',
  'HeureModif',
  'IDAPPORTEUR',
  'Entrele',
  'SortieLe',
  'Chambre',
  'DureeE',
  'Numcarte',
  'Désignationtypeacte',
  'StatutFacture',
  'Numfacture',
  'NumBon',
  'MontantMedecin',
  'PartApporteur',
  'IDMEDECIN',
  'Statumed',
  'BanqueC',
  'NumChèque',
  'Modepaiement',
  'TotalReliquatPatient',
  'CautionPatient',
  'Assuré',
  'MontantMedecinExécutant',
  'NummedecinExécutant',
  'MedecinExécutant',
  'Payéoupas',
  'resultatacte',
  'StatutApporteur',
  'Statutexécutant',
  'StatutLaboratoire',
  'ObservationC',
  'Receptionnerpar',
  'Datetransferbiologiste',
  'Transferepar',
  'DATERECEPTIONNER',
  'Heurereception',
  'Heure_service',
  'dateretour',
  'Document',
  'ExtensionF',
  'Souscripteur',
  'Heure_Facturation',
  'CONCLUSIONGENE',
  'NumCarteVisa',
  'NumCompteVisa',
  'DateValidation',
  'IDSOCIETEPARTENAIRE',
  'ProvenanceExamen',
  'NIdentificationExamen',
  'Biologiste',
  'CachetBiologiste',
  'CachetMedecin',
  'Externe_Interne',
  'factureannule',
  'StatuPrescriptionMedecin',
  'Fichedesuivipatient',
  'Ordonnerlannulation',
  'AnnulOrdonnerPar',
  'AnnulationOrdonneLe',
  'AnnulerPar',
  'Annulerle',
  'StatutPaiement',
  'MotifRetour',
  'MotifAnnulationFacture',
  'DateFacturation',
  'IDHOSPITALISATION',
  'IDPRESCRIPTION',
  'typefacture',
  'IDSOCIETEASSUANCE',
  'SOCIETE_PATIENT',
  'StactFacPatient',
  'StactFactAssurance',
];

function toObjectIdOrUndefined(value, map) {
  if (!value) return undefined;
  if (map) {
    const mapped = map.get(String(value));
    if (mapped) return new (require('mongoose').Types.ObjectId)(mapped);
  }
  return undefined;
}

function mapFacturation(row, maps) {
  const idPatientWinDev = String(getField(row, facturationColumns, 'IDPARTIENT') || '').trim();
  const patientId = maps.patientByWinDevId.get(idPatientWinDev);
  if (!patientId) {
    console.warn(`Facturation sans patient (IDPARTIENT=${idPatientWinDev})`);
    return null;
  }

  const codePrestation = getField(row, facturationColumns, 'Code_Prestation');
  const idFacturation = String(getField(row, facturationColumns, 'IDFACTURATION') || '');
  maps.facturationPatientByWinDevId.set(idFacturation, patientId);
  const datePres = parseDate(getField(row, facturationColumns, 'DatePres'));

  const doc = {
    _legacyId: idFacturation,
    CodePrestation: codePrestation,
    NomMed: getField(row, facturationColumns, 'NomMed'),
    PatientP: getField(row, facturationColumns, 'PatientP'),
    Code_dossier: maps.patientCodeByWinDevId.get(idPatientWinDev) || '',
    DatePres: datePres,
    SaisiPar: getField(row, facturationColumns, 'SaisiPar'),
    Rclinique: getField(row, facturationColumns, 'Rclinique'),
    Montanttotal: toNumber(getField(row, facturationColumns, 'Montanttotal')),
    TotalPaye: toNumber(getField(row, facturationColumns, 'TotalPaye')),
    TotaleTaxe: toNumber(getField(row, facturationColumns, 'TotaleTaxe')),
    MontantRecu: toNumber(getField(row, facturationColumns, 'MontantRecu')),
    reduction: toNumber(getField(row, facturationColumns, 'reduction')),
    tauxreduction: toNumber(getField(row, facturationColumns, 'tauxreduction')),
    MotifRemise: getField(row, facturationColumns, 'MotifRemise'),
    Restapayer: toNumber(getField(row, facturationColumns, 'Restapayer')),
    TotalapayerPatient: toNumber(getField(row, facturationColumns, 'TotalapayerPatient')),
    SocieteP: getField(row, facturationColumns, 'SocieteP'),
    PartAssuranceP: toNumber(getField(row, facturationColumns, 'PartAssuranceP')),
    Partassure: toNumber(getField(row, facturationColumns, 'Partassuré')),
    Assurance: getField(row, facturationColumns, 'Assuance'),
    Taux: getField(row, facturationColumns, 'Taux'),
    IDASSURANCE: toObjectIdOrUndefined(getField(row, facturationColumns, 'IDASSURANCE'), maps.assuranceByWinDevId),
    IDTYPE_ACTE: getField(row, facturationColumns, 'IDTYPE_ACTE'),
    FacturePar: getField(row, facturationColumns, 'FacturéPar'),
    IdPatient: new (require('mongoose').Types.ObjectId)(patientId),
    CompteClient: toBoolean(getField(row, facturationColumns, 'CompteClient')),
    ModifierPar: getField(row, facturationColumns, 'ModifierPar'),
    DateModif: parseDate(getField(row, facturationColumns, 'DateModif')),
    HeureModif: excelTimeToString(getField(row, facturationColumns, 'HeureModif')),
    IDAPPORTEUR: toNumber(getField(row, facturationColumns, 'IDAPPORTEUR')) || undefined,
    Entrele: parseDate(getField(row, facturationColumns, 'Entrele')),
    SortieLe: parseDate(getField(row, facturationColumns, 'SortieLe')),
    Chambre: getField(row, facturationColumns, 'Chambre'),
    nombreDeJours: toNumber(getField(row, facturationColumns, 'DureeE')),
    Numcarte: getField(row, facturationColumns, 'Numcarte'),
    Designationtypeacte: getField(row, facturationColumns, 'Désignationtypeacte'),
    StatutFacture: toBoolean(getField(row, facturationColumns, 'StatutFacture')),
    Numfacture: getField(row, facturationColumns, 'Numfacture'),
    NumBon: getField(row, facturationColumns, 'NumBon'),
    MontantMedecin: toNumber(getField(row, facturationColumns, 'MontantMedecin')),
    PartApporteur: toNumber(getField(row, facturationColumns, 'PartApporteur')),
    Statumed: getField(row, facturationColumns, 'Statumed'),
    BanqueC: getField(row, facturationColumns, 'BanqueC'),
    NumCheque: getField(row, facturationColumns, 'NumChèque'),
    Modepaiement: getField(row, facturationColumns, 'Modepaiement'),
    TotalReliquatPatient: toNumber(getField(row, facturationColumns, 'TotalReliquatPatient')),
    CautionPatient: toNumber(getField(row, facturationColumns, 'CautionPatient')),
    Assure: normalizeAssure(getField(row, facturationColumns, 'Assuré')),
    MontantMedecinExécutant: toNumber(getField(row, facturationColumns, 'MontantMedecinExécutant')),
    NummedecinExécutant: getField(row, facturationColumns, 'NummedecinExécutant'),
    MedecinExécutant: getField(row, facturationColumns, 'MedecinExécutant'),
    Payeoupas: toBoolean(getField(row, facturationColumns, 'Payéoupas')),
    resultatacte: getField(row, facturationColumns, 'resultatacte'),
    StatutApporteur: getField(row, facturationColumns, 'StatutApporteur'),
    Statutexécutant: getField(row, facturationColumns, 'Statutexécutant'),
    StatutLaboratoire: toNumber(getField(row, facturationColumns, 'StatutLaboratoire')),
    ObservationC: getField(row, facturationColumns, 'ObservationC'),
    Receptionnerpar: getField(row, facturationColumns, 'Receptionnerpar'),
    Datetransferbiologiste: parseDate(getField(row, facturationColumns, 'Datetransferbiologiste')),
    Transferepar: getField(row, facturationColumns, 'Transferepar'),
    DATERECEPTIONNER: parseDate(getField(row, facturationColumns, 'DATERECEPTIONNER')),
    Heurereception: excelTimeToString(getField(row, facturationColumns, 'Heurereception')),
    Heure_service: excelTimeToString(getField(row, facturationColumns, 'Heure_service')),
    dateretour: parseDate(getField(row, facturationColumns, 'dateretour')),
    ExtensionF: getField(row, facturationColumns, 'ExtensionF'),
    Souscripteur: getField(row, facturationColumns, 'Souscripteur'),
    Heure_Facturation: excelTimeToString(getField(row, facturationColumns, 'Heure_Facturation')),
    CONCLUSIONGENE: getField(row, facturationColumns, 'CONCLUSIONGENE'),
    NumCarteVisa: getField(row, facturationColumns, 'NumCarteVisa'),
    NumCompteVisa: getField(row, facturationColumns, 'NumCompteVisa'),
    DateValidation: parseDate(getField(row, facturationColumns, 'DateValidation')),
    ProvenanceExamen: getField(row, facturationColumns, 'ProvenanceExamen'),
    NIdentificationExamen: getField(row, facturationColumns, 'NIdentificationExamen'),
    Biologiste: getField(row, facturationColumns, 'Biologiste'),
    Externe_Interne: getField(row, facturationColumns, 'Externe_Interne'),
    factureannule: toBoolean(getField(row, facturationColumns, 'factureannule')),
    StatutPrescriptionMedecin: toNumber(getField(row, facturationColumns, 'StatuPrescriptionMedecin')),
    Fichedesuivipatient: getField(row, facturationColumns, 'Fichedesuivipatient'),
    Ordonnerlannulation: toNumber(getField(row, facturationColumns, 'Ordonnerlannulation')),
    AnnulOrdonnerPar: getField(row, facturationColumns, 'AnnulOrdonnerPar'),
    AnnulationOrdonneLe: parseDate(getField(row, facturationColumns, 'AnnulationOrdonneLe')),
    AnnulerPar: getField(row, facturationColumns, 'AnnulerPar'),
    Annulerle: parseDate(getField(row, facturationColumns, 'Annulerle')),
    StatutPaiement: getField(row, facturationColumns, 'StatutPaiement'),
    MotifRetour: getField(row, facturationColumns, 'MotifRetour'),
    MotifAnnulationFacture: getField(row, facturationColumns, 'MotifAnnulationFacture'),
    DateFacturation: parseDate(getField(row, facturationColumns, 'DateFacturation')),
    typefacture: getField(row, facturationColumns, 'typefacture'),
    SOCIETE_PATIENT: getField(row, facturationColumns, 'SOCIETE_PATIENT'),
    IDSOCIETEASSURANCE: toObjectIdOrUndefined(getField(row, facturationColumns, 'IDSOCIETEASSUANCE'), maps.societeAssuranceById),
    StactFacPatient: toNumber(getField(row, facturationColumns, 'StactFacPatient')),
    StactFactAssurance: toNumber(getField(row, facturationColumns, 'StactFactAssurance')),
    entrepriseId: process.env.ENTREPRISE_ID || undefined,
  };

  return doc;
}

// ============================================================================
// ENCAISSEMENT CAISSE
// ============================================================================
const encaissementColumns = [
  'image',
  'IDPOINT_CAISSE',
  'DatePrest',
  'Patient',
  'assurance',
  'ACTE',
  'Totalacte',
  'Taux',
  'PartAssurance',
  'PartPatient',
  'REMISE',
  'TotalPaye',
  'Restapayer',
  'Medecin',
  'IDHOSPITALISATION',
  'Utilisateur',
  'DateEncaissement',
  'Montantencaisse',
  'HeureEncaissement',
  'Modepaiement',
  'BanqueC',
  'NumCarteVisa',
  'NCheque',
  'NumCompteVisa',
  'IDFACTURATION',
  'IDCONSULTATION',
  'restapayerBilan',
  'TotalapayerPatient',
  'Assuré',
  'IDPARTIENT',
  'AnnulationOrdonneLe',
  'annulationOrdonnepar',
  'Nompatient',
];

async function mapEncaissementCaisse(row, maps) {
  const mongoose = require('mongoose');
  const idPatientWinDev = String(getField(row, encaissementColumns, 'IDPARTIENT') || '').trim();
  let patientId = idPatientWinDev && idPatientWinDev !== '0' ? maps.patientByWinDevId.get(idPatientWinDev) : undefined;

  if (!patientId) {
    const idFacturation = String(getField(row, encaissementColumns, 'IDFACTURATION') || '').trim();
    if (idFacturation && idFacturation !== '0') {
      patientId = maps.facturationPatientByWinDevId.get(idFacturation);
      const factId = maps.facturationByWinDevId.get(idFacturation);
      if (!patientId && factId) {
        try {
          const fact = await mongoose.model('Facturation').findById(factId).select('IdPatient').lean();
          if (fact && fact.IdPatient) patientId = fact.IdPatient.toString();
        } catch (e) { /* ignore */ }
      }
    }
  }

  if (!patientId) {
    const idConsultation = String(getField(row, encaissementColumns, 'IDCONSULTATION') || '').trim();
    if (idConsultation && idConsultation !== '0') {
      patientId = maps.consultationPatientByWinDevId.get(idConsultation);
      const consultId = maps.consultationByWinDevId.get(idConsultation);
      if (!patientId && consultId) {
        try {
          const consult = await mongoose.model('Consultation').findById(consultId).select('IdPatient').lean();
          if (consult && consult.IdPatient) patientId = consult.IdPatient.toString();
        } catch (e) { /* ignore */ }
      }
    }
  }

  if (!patientId) {
    console.warn(`Encaissement sans patient (IDPARTIENT=${idPatientWinDev})`);
    return null;
  }

  return {
    DatePrest: parseDate(getField(row, encaissementColumns, 'DatePrest')),
    Patient: getField(row, encaissementColumns, 'Patient'),
    Assurance: getField(row, encaissementColumns, 'assurance'),
    Designation: getField(row, encaissementColumns, 'ACTE'),
    Totalacte: toNumber(getField(row, encaissementColumns, 'Totalacte')),
    Taux: toNumber(getField(row, encaissementColumns, 'Taux')),
    PartAssurance: toNumber(getField(row, encaissementColumns, 'PartAssurance')),
    Partassure: toNumber(getField(row, encaissementColumns, 'PartPatient')),
    REMISE: toNumber(getField(row, encaissementColumns, 'REMISE')),
    TotalPaye: toNumber(getField(row, encaissementColumns, 'TotalPaye')),
    Restapayer: toNumber(getField(row, encaissementColumns, 'Restapayer')),
    Medecin: getField(row, encaissementColumns, 'Medecin'),
    Utilisateur: getField(row, encaissementColumns, 'Utilisateur'),
    DateEncaissement: parseDate(getField(row, encaissementColumns, 'DateEncaissement')),
    Montantencaisse: toNumber(getField(row, encaissementColumns, 'Montantencaisse')),
    HeureEncaissement: excelTimeToString(getField(row, encaissementColumns, 'HeureEncaissement')),
    Modepaiement: getField(row, encaissementColumns, 'Modepaiement'),
    BanqueC: getField(row, encaissementColumns, 'BanqueC'),
    NumCarteVisa: getField(row, encaissementColumns, 'NumCarteVisa'),
    NumCheque: getField(row, encaissementColumns, 'NCheque'),
    NumCompteVisa: getField(row, encaissementColumns, 'NumCompteVisa'),
    IDFACTURATION: String(getField(row, encaissementColumns, 'IDFACTURATION') || ''),
    IDCONSULTATION: String(getField(row, encaissementColumns, 'IDCONSULTATION') || ''),
    restapayerBilan: String(getField(row, encaissementColumns, 'restapayerBilan') || ''),
    TotalapayerPatient: toNumber(getField(row, encaissementColumns, 'TotalapayerPatient')),
    Assure: normalizeAssure(getField(row, encaissementColumns, 'Assuré')),
    IdPatient: String(patientId),
    AnnulationOrdonneLe: parseDate(getField(row, encaissementColumns, 'AnnulationOrdonneLe')),
    annulationOrdonnepar: getField(row, encaissementColumns, 'annulationOrdonnepar'),
    IdPatientOriginal: new (require('mongoose').Types.ObjectId)(patientId),
    entrepriseId: process.env.ENTREPRISE_ID || undefined,
  };
}

// ============================================================================
// EXAMENS HOSPITALISATION
// ============================================================================
const examenHospitalisationColumns = [
  'image',
  'IDHOSPITALISATION',
  'Code_Prestation',
  'NomMed',
  'PatientP',
  'DatePres',
  'SaisiPar',
  'Rclinique',
  'Montanttotal',
  'TotalPaye',
  'TotaleTaxe',
  'MontantRecu',
  'reduction',
  'tauxreduction',
  'MotifRemise',
  'Restapayer',
  'DateEncaissement',
  'TotalapayerPatient',
  'SocieteP',
  'PartAssuranceP',
  'Partassuré',
  'Assuance',
  'Taux',
  'IDASSURANCE',
  'IDTYPE_ACTE',
  'FacturéPar',
  'IDPARTIENT',
  'CompteClient',
  'ModifierPar',
  'HeureModif',
  'IDAPPORTEUR',
  'Entrele',
  'SortieLe',
  'Chambre',
  'DureeE',
  'Numcarte',
  'Désignationtypeacte',
  'StatutFacture',
  'Numfacture',
  'NumBon',
  'MontantMedecin',
  'PartApporteur',
  'IDMEDECIN',
  'Statumed',
  'BanqueC',
  'NumChèque',
  'Modepaiement',
  'TotalReliquatPatient',
  'CautionPatient',
  'Assuré',
  'MontantMedecinExécutant',
  'NummedecinExécutant',
  'MedecinExécutant',
  'Payéoupas',
  'resultatacte',
  'StatutApporteur',
  'Statutexécutant',
  'StatutLaboratoire',
  'ObservationC',
  'Receptionnerpar',
  'Datetransferbiologiste',
  'Transferepar',
  'DATERECEPTIONNER',
  'Heurereception',
  'Heure_service',
  'dateretour',
  'Document',
  'ExtensionF',
  'Souscripteur',
  'Heure_Facturation',
  'CONCLUSIONGENE',
  'NumCarteVisa',
  'NumCompteVisa',
  'DateValidation',
  'IDSOCIETEPARTENAIRE',
  'ProvenanceExamen',
  'NIdentificationExamen',
  'Biologiste',
  'CachetBiologiste',
  'CachetMedecin',
  'Externe_Interne',
  'factureannule',
  'StatuPrescriptionMedecin',
  'Fichedesuivipatient',
  'Ordonnerlannulation',
  'AnnulOrdonnerPar',
  'AnnulationOrdonneLe',
  'AnnulerPar',
  'Annulerle',
  'StatutPaiement',
  'MotifRetour',
  'MotifAnnulationFacture',
  'PartenaireBilan',
  'ObservationHospitalisation',
  'IDCHAMBRE',
  'IDSOCIETEASSUANCE',
  'SOCIETE_PATIENT',
  'SignatureMed',
  'NomIntervention',
];

function mapExamenHospitalisation(row, maps) {
  const idPatientWinDev = String(getField(row, examenHospitalisationColumns, 'IDPARTIENT') || '').trim();
  const patientId = maps.patientByWinDevId.get(idPatientWinDev);
  if (!patientId) {
    console.warn(`ExamenHospitalisation sans patient (IDPARTIENT=${idPatientWinDev})`);
    return null;
  }

  const idHospit = String(getField(row, examenHospitalisationColumns, 'IDHOSPITALISATION') || '');
  const codePrestation = getField(row, examenHospitalisationColumns, 'Code_Prestation');

  const doc = {
    _legacyId: idHospit,
    CodePrestation: codePrestation,
    NomMed: getField(row, examenHospitalisationColumns, 'NomMed'),
    PatientP: getField(row, examenHospitalisationColumns, 'PatientP'),
    Code_dossier: maps.patientCodeByWinDevId.get(idPatientWinDev) || '',
    DatePres: parseDate(getField(row, examenHospitalisationColumns, 'DatePres')),
    SaisiPar: getField(row, examenHospitalisationColumns, 'SaisiPar'),
    Rclinique: getField(row, examenHospitalisationColumns, 'Rclinique'),
    Montanttotal: toNumber(getField(row, examenHospitalisationColumns, 'Montanttotal')),
    TotalPaye: toNumber(getField(row, examenHospitalisationColumns, 'TotalPaye')),
    TotaleTaxe: toNumber(getField(row, examenHospitalisationColumns, 'TotaleTaxe')),
    MontantRecu: toNumber(getField(row, examenHospitalisationColumns, 'MontantRecu')),
    reduction: toNumber(getField(row, examenHospitalisationColumns, 'reduction')),
    tauxreduction: toNumber(getField(row, examenHospitalisationColumns, 'tauxreduction')),
    MotifRemise: getField(row, examenHospitalisationColumns, 'MotifRemise'),
    Restapayer: toNumber(getField(row, examenHospitalisationColumns, 'Restapayer')),
    DateEncaissement: parseDate(getField(row, examenHospitalisationColumns, 'DateEncaissement')),
    TotalapayerPatient: toNumber(getField(row, examenHospitalisationColumns, 'TotalapayerPatient')),
    SocieteP: getField(row, examenHospitalisationColumns, 'SocieteP'),
    PartAssuranceP: toNumber(getField(row, examenHospitalisationColumns, 'PartAssuranceP')),
    Partassure: toNumber(getField(row, examenHospitalisationColumns, 'Partassuré')),
    Assurance: getField(row, examenHospitalisationColumns, 'Assuance'),
    Taux: getField(row, examenHospitalisationColumns, 'Taux'),
    IDASSURANCE: toObjectIdOrUndefined(getField(row, examenHospitalisationColumns, 'IDASSURANCE'), maps.assuranceByWinDevId),
    IDTYPE_ACTE: getField(row, examenHospitalisationColumns, 'IDTYPE_ACTE'),
    FacturePar: getField(row, examenHospitalisationColumns, 'FacturéPar'),
    IdPatient: new (require('mongoose').Types.ObjectId)(patientId),
    CompteClient: toBoolean(getField(row, examenHospitalisationColumns, 'CompteClient')),
    ModifierPar: getField(row, examenHospitalisationColumns, 'ModifierPar'),
    HeureModif: excelTimeToString(getField(row, examenHospitalisationColumns, 'HeureModif')),
    IDAPPORTEUR: toNumber(getField(row, examenHospitalisationColumns, 'IDAPPORTEUR')) || undefined,
    Entrele: parseDate(getField(row, examenHospitalisationColumns, 'Entrele')),
    SortieLe: parseDate(getField(row, examenHospitalisationColumns, 'SortieLe')),
    Chambre: getField(row, examenHospitalisationColumns, 'Chambre'),
    nombreDeJours: toNumber(getField(row, examenHospitalisationColumns, 'DureeE')),
    Numcarte: getField(row, examenHospitalisationColumns, 'Numcarte'),
    Designationtypeacte: getField(row, examenHospitalisationColumns, 'Désignationtypeacte'),
    StatutFacture: toBoolean(getField(row, examenHospitalisationColumns, 'StatutFacture')),
    Numfacture: getField(row, examenHospitalisationColumns, 'Numfacture'),
    NumBon: getField(row, examenHospitalisationColumns, 'NumBon'),
    MontantMedecin: toNumber(getField(row, examenHospitalisationColumns, 'MontantMedecin')),
    PartApporteur: toNumber(getField(row, examenHospitalisationColumns, 'PartApporteur')),
    Statumed: getField(row, examenHospitalisationColumns, 'Statumed'),
    BanqueC: getField(row, examenHospitalisationColumns, 'BanqueC'),
    NumCheque: getField(row, examenHospitalisationColumns, 'NumChèque'),
    Modepaiement: getField(row, examenHospitalisationColumns, 'Modepaiement'),
    TotalReliquatPatient: toNumber(getField(row, examenHospitalisationColumns, 'TotalReliquatPatient')),
    CautionPatient: toNumber(getField(row, examenHospitalisationColumns, 'CautionPatient')),
    Assure: normalizeAssure(getField(row, examenHospitalisationColumns, 'Assuré')),
    MontantMedecinExécutant: toNumber(getField(row, examenHospitalisationColumns, 'MontantMedecinExécutant')),
    NummedecinExécutant: getField(row, examenHospitalisationColumns, 'NummedecinExécutant'),
    MedecinExécutant: getField(row, examenHospitalisationColumns, 'MedecinExécutant'),
    Payeoupas: toBoolean(getField(row, examenHospitalisationColumns, 'Payéoupas')),
    resultatacte: getField(row, examenHospitalisationColumns, 'resultatacte'),
    StatutApporteur: getField(row, examenHospitalisationColumns, 'StatutApporteur'),
    Statutexécutant: getField(row, examenHospitalisationColumns, 'Statutexécutant'),
    StatutLaboratoire: toNumber(getField(row, examenHospitalisationColumns, 'StatutLaboratoire')),
    ObservationC: getField(row, examenHospitalisationColumns, 'ObservationC'),
    Receptionnerpar: getField(row, examenHospitalisationColumns, 'Receptionnerpar'),
    Datetransferbiologiste: parseDate(getField(row, examenHospitalisationColumns, 'Datetransferbiologiste')),
    Transferepar: getField(row, examenHospitalisationColumns, 'Transferepar'),
    DATERECEPTIONNER: parseDate(getField(row, examenHospitalisationColumns, 'DATERECEPTIONNER')),
    Heurereception: excelTimeToString(getField(row, examenHospitalisationColumns, 'Heurereception')),
    Heure_service: excelTimeToString(getField(row, examenHospitalisationColumns, 'Heure_service')),
    dateretour: parseDate(getField(row, examenHospitalisationColumns, 'dateretour')),
    ExtensionF: getField(row, examenHospitalisationColumns, 'ExtensionF'),
    Souscripteur: getField(row, examenHospitalisationColumns, 'Souscripteur'),
    Heure_Facturation: excelTimeToString(getField(row, examenHospitalisationColumns, 'Heure_Facturation')),
    CONCLUSIONGENE: getField(row, examenHospitalisationColumns, 'CONCLUSIONGENE'),
    NumCarteVisa: getField(row, examenHospitalisationColumns, 'NumCarteVisa'),
    NumCompteVisa: getField(row, examenHospitalisationColumns, 'NumCompteVisa'),
    DateValidation: parseDate(getField(row, examenHospitalisationColumns, 'DateValidation')),
    ProvenanceExamen: getField(row, examenHospitalisationColumns, 'ProvenanceExamen'),
    NIdentificationExamen: getField(row, examenHospitalisationColumns, 'NIdentificationExamen'),
    Biologiste: getField(row, examenHospitalisationColumns, 'Biologiste'),
    Externe_Interne: getField(row, examenHospitalisationColumns, 'Externe_Interne'),
    factureannule: toBoolean(getField(row, examenHospitalisationColumns, 'factureannule')),
    statutPrescriptionMedecin: toNumber(getField(row, examenHospitalisationColumns, 'StatuPrescriptionMedecin')),
    Fichedesuivipatient: getField(row, examenHospitalisationColumns, 'Fichedesuivipatient'),
    Ordonnerlannulation: toNumber(getField(row, examenHospitalisationColumns, 'Ordonnerlannulation')),
    AnnulOrdonnerPar: getField(row, examenHospitalisationColumns, 'AnnulOrdonnerPar'),
    AnnulationOrdonneLe: parseDate(getField(row, examenHospitalisationColumns, 'AnnulationOrdonneLe')),
    AnnulerPar: getField(row, examenHospitalisationColumns, 'AnnulerPar'),
    Annulerle: parseDate(getField(row, examenHospitalisationColumns, 'Annulerle')),
    StatutPaiement: getField(row, examenHospitalisationColumns, 'StatutPaiement'),
    MotifRetour: getField(row, examenHospitalisationColumns, 'MotifRetour'),
    MotifAnnulationFacture: getField(row, examenHospitalisationColumns, 'MotifAnnulationFacture'),
    PartenaireBilan: getField(row, examenHospitalisationColumns, 'PartenaireBilan'),
    ObservationHospitalisation: getField(row, examenHospitalisationColumns, 'ObservationHospitalisation'),
    SOCIETE_PATIENT: getField(row, examenHospitalisationColumns, 'SOCIETE_PATIENT'),
    IDSOCIETEASSURANCE: toObjectIdOrUndefined(getField(row, examenHospitalisationColumns, 'IDSOCIETEASSUANCE'), maps.societeAssuranceById),
    NomIntervention: getField(row, examenHospitalisationColumns, 'NomIntervention'),
    entrepriseId: process.env.ENTREPRISE_ID || undefined,
  };

  return doc;
}

// ============================================================================
// LIGNE PRESTATION
// ============================================================================
const lignePrestationColumns = [
  'image',
  'IDLIGNE_PRESTATION',
  'Code_Prestation',
  'Date_ligne_prestaion',
  'Prestation',
  'Qte',
  'Prix',
  'PartAssurance',
  'tauxAssurance',
  'IDPARTIENT',
  'IDHOSPITALISATION',
  'Partassuré',
  'PrixTotal',
  'CoefficientActe',
  'ReliquatCoefAssurance',
  'LettreCle',
  'TAXE',
  'IDTYPE_ACTE',
  'IDACTEP',
  'IDAPPORTEUR',
  'ReliquatPatient',
  'TotalCefficient',
  'PrixClinique',
  'NummedecinExécutant',
  'MontantMedecinExécutant',
  'IDMEDECIN',
  'ActeMedecin',
  'resultatacte',
  'ObservationExame',
  'ExclusionActae',
  'tarifAssurance',
  'coefficientAssur',
  'Coefficientclinique',
  'MontanttotalApayer',
  'totalsurplus',
  'Statutexécutant',
  'Nompatient',
  'DatesaisieResultat',
  'Sexe',
  'Age_partient',
  'SituationGéo',
  'Résultatsaisiepar',
  'MedecinPrescripteur',
  'IDFAMILLE_ACTE_BIOLOGIE',
  'FamilleActe',
  'PrixAccepté',
  'PrixRefusé',
  'Biologiste',
  'Validerle',
  'ProvenanceExamen',
  'Externe_Interne',
  'NIdentificationExamen',
  'Acte_Exécuter',
  'StatuPrescriptionMedecin',
  'ActeFacturé',
  'resultatManuel',
  'StatutHonoraireMedecin',
  'TypeResultat',
  'ACTEPAYECAISSE',
  'Datepaiementcaisse',
  'HeurePaiement',
  'PayéPar',
  'CompterenduValidépar',
  'CompteRenduValidéA',
  'compterenduValidéLe',
  'MedecinExécutant',
  'IDFACTURATION',
  'IDSOCIETEASSUANCE',
  'SOCIETE_PATIENT',
  'ORdonnacementAffichage',
  'IDSOCIETEPARTENAIRE',
  'IDmedecinAideOperatoire',
  'StatutMedecinAideOperatoire',
  'MedecinAideOperatoire',
  'MedecinAnesthesiste',
  'StatutMedecinAnesthesiste',
  'IDAnesthesiste',
  'MedecinAffiché',
  'AnesthesistePaye',
  'AideOperatoirePaye',
];

function mapLignePrestation(row, maps) {
  const idPatientWinDev = String(getField(row, lignePrestationColumns, 'IDPARTIENT') || '').trim();
  const patientId = maps.patientByWinDevId.get(idPatientWinDev);
  if (!patientId) {
    console.warn(`LignePrestation sans patient (IDPARTIENT=${idPatientWinDev})`);
    return null;
  }

  const codePrestation = getField(row, lignePrestationColumns, 'Code_Prestation');
  const idHospitalisation = String(getField(row, lignePrestationColumns, 'IDHOSPITALISATION') || '');
  const idFacturation = String(getField(row, lignePrestationColumns, 'IDFACTURATION') || '');

  return {
    CodePrestation: codePrestation,
    codeConsultation: codePrestation,
    dateLignePrestation: parseDate(getField(row, lignePrestationColumns, 'Date_ligne_prestaion')),
    prestation: getField(row, lignePrestationColumns, 'Prestation'),
    qte: toNumber(getField(row, lignePrestationColumns, 'Qte')),
    prix: toNumber(getField(row, lignePrestationColumns, 'Prix')),
    partAssurance: toNumber(getField(row, lignePrestationColumns, 'PartAssurance')),
    tauxAssurance: toNumber(getField(row, lignePrestationColumns, 'tauxAssurance')),
    IdPatient: new (require('mongoose').Types.ObjectId)(patientId),
    idHospitalisation: toObjectIdOrUndefined(idHospitalisation, maps.hospitalisationByWinDevId),
    partAssure: toNumber(getField(row, lignePrestationColumns, 'Partassuré')),
    prixTotal: toNumber(getField(row, lignePrestationColumns, 'PrixTotal')),
    coefficientActe: toNumber(getField(row, lignePrestationColumns, 'CoefficientActe')),
    reliquatCoefAssurance: toNumber(getField(row, lignePrestationColumns, 'ReliquatCoefAssurance')),
    lettreCle: getField(row, lignePrestationColumns, 'LettreCle') || '',
    taxe: toNumber(getField(row, lignePrestationColumns, 'TAXE')),
    idTypeActe: toObjectIdOrUndefined(getField(row, lignePrestationColumns, 'IDTYPE_ACTE'), maps.typeActeById),
    idActe: toObjectIdOrUndefined(getField(row, lignePrestationColumns, 'IDACTEP'), maps.acteByWinDevId),
    idApporteur: toObjectIdOrUndefined(getField(row, lignePrestationColumns, 'IDAPPORTEUR'), maps.apporteurById),
    reliquatPatient: toNumber(getField(row, lignePrestationColumns, 'ReliquatPatient')),
    totalCoefficient: toNumber(getField(row, lignePrestationColumns, 'TotalCefficient')),
    prixClinique: toNumber(getField(row, lignePrestationColumns, 'PrixClinique')),
    numMedecinExecutant: getField(row, lignePrestationColumns, 'NummedecinExécutant'),
    montantMedecinExecutant: toNumber(getField(row, lignePrestationColumns, 'MontantMedecinExécutant')),
    idMedecin: toObjectIdOrUndefined(getField(row, lignePrestationColumns, 'IDMEDECIN'), maps.medecinById),
    acteMedecin: getField(row, lignePrestationColumns, 'ActeMedecin'),
    resultatActe: getField(row, lignePrestationColumns, 'resultatacte'),
    observationExamen: getField(row, lignePrestationColumns, 'ObservationExame'),
    exclusionActe: getField(row, lignePrestationColumns, 'ExclusionActae'),
    tarifAssurance: toNumber(getField(row, lignePrestationColumns, 'tarifAssurance')),
    coefficientAssur: toNumber(getField(row, lignePrestationColumns, 'coefficientAssur')),
    coefficientClinique: toNumber(getField(row, lignePrestationColumns, 'Coefficientclinique')),
    montantTotalAPayer: toNumber(getField(row, lignePrestationColumns, 'MontanttotalApayer')),
    totalSurplus: toNumber(getField(row, lignePrestationColumns, 'totalsurplus')),
    statutExecutant: getField(row, lignePrestationColumns, 'Statutexécutant'),
    nomPatient: getField(row, lignePrestationColumns, 'Nompatient'),
    dateSaisieResultat: parseDate(getField(row, lignePrestationColumns, 'DatesaisieResultat')),
    sexe: normalizeSexe(getField(row, lignePrestationColumns, 'Sexe')),
    agePatient: toNumber(getField(row, lignePrestationColumns, 'Age_partient')),
    situationGeo: getField(row, lignePrestationColumns, 'SituationGéo'),
    resultatSaisiePar: getField(row, lignePrestationColumns, 'Résultatsaisiepar'),
    medecinPrescripteur: getField(row, lignePrestationColumns, 'MedecinPrescripteur'),
    idFamilleActeBiologie: toObjectIdOrUndefined(getField(row, lignePrestationColumns, 'IDFAMILLE_ACTE_BIOLOGIE'), maps.familleActeById),
    familleActe: getField(row, lignePrestationColumns, 'FamilleActe'),
    prixAccepte: toNumber(getField(row, lignePrestationColumns, 'PrixAccepté')),
    prixRefuse: toNumber(getField(row, lignePrestationColumns, 'PrixRefusé')),
    biologiste: getField(row, lignePrestationColumns, 'Biologiste'),
    validerLe: parseDate(getField(row, lignePrestationColumns, 'Validerle')),
    provenanceExamen: getField(row, lignePrestationColumns, 'ProvenanceExamen'),
    externeInterne: getField(row, lignePrestationColumns, 'Externe_Interne'),
    nIdentificationExamen: getField(row, lignePrestationColumns, 'NIdentificationExamen'),
    acteExecuter: toBoolean(getField(row, lignePrestationColumns, 'Acte_Exécuter')),
    statutPrescriptionMedecin: toNumber(getField(row, lignePrestationColumns, 'StatuPrescriptionMedecin')),
    acteFacture: toBoolean(getField(row, lignePrestationColumns, 'ActeFacturé')),
    resultatManuel: getField(row, lignePrestationColumns, 'resultatManuel'),
    statutHonoraireMedecin: toNumber(getField(row, lignePrestationColumns, 'StatutHonoraireMedecin')),
    typeResultat: toNumber(getField(row, lignePrestationColumns, 'TypeResultat')),
    actePayeCaisse: getField(row, lignePrestationColumns, 'ACTEPAYECAISSE'),
    datePaiementCaisse: parseDate(getField(row, lignePrestationColumns, 'Datepaiementcaisse')),
    heurePaiement: excelTimeToString(getField(row, lignePrestationColumns, 'HeurePaiement')),
    payePar: getField(row, lignePrestationColumns, 'PayéPar'),
    compteRenduValidePar: getField(row, lignePrestationColumns, 'CompterenduValidépar'),
    compteRenduValideA: getField(row, lignePrestationColumns, 'CompteRenduValidéA'),
    compteRenduValideLe: parseDate(getField(row, lignePrestationColumns, 'compterenduValidéLe')),
    medecinExecutant: getField(row, lignePrestationColumns, 'MedecinExécutant'),
    idFacturation: toObjectIdOrUndefined(idFacturation, maps.facturationByWinDevId),
    SOCIETE_PATIENT: getField(row, lignePrestationColumns, 'SOCIETE_PATIENT'),
    IDSOCIETEPARTENAIRE: toObjectIdOrUndefined(getField(row, lignePrestationColumns, 'IDSOCIETEPARTENAIRE'), maps.societePartenaireById),
    ordonnancementAffichage: toNumber(getField(row, lignePrestationColumns, 'ORdonnacementAffichage')),
    IDmedecinAideOperatoire: getField(row, lignePrestationColumns, 'IDmedecinAideOperatoire'),
    StatutMedecinAideOperatoire: getField(row, lignePrestationColumns, 'StatutMedecinAideOperatoire'),
    MedecinAideOperatoire: getField(row, lignePrestationColumns, 'MedecinAideOperatoire'),
    MedecinAnesthesiste: getField(row, lignePrestationColumns, 'MedecinAnesthesiste'),
    StatutMedecinAnesthesiste: getField(row, lignePrestationColumns, 'StatutMedecinAnesthesiste'),
    IDAnesthesiste: getField(row, lignePrestationColumns, 'IDAnesthesiste'),
    MedecinAffiche: getField(row, lignePrestationColumns, 'MedecinAffiché'),
    AnesthesistePaye: toNumber(getField(row, lignePrestationColumns, 'AnesthesistePaye')),
    AideOperatoirePaye: toNumber(getField(row, lignePrestationColumns, 'AideOperatoirePaye')),
    entrepriseId: process.env.ENTREPRISE_ID || undefined,
  };
}

module.exports = {
  assuranceColumns,
  mapAssurance,
  acteColumns,
  mapActe,
  tarifAssuranceColumns,
  mapTarifAssurance,
  facturationColumns,
  mapFacturation,
  encaissementColumns,
  mapEncaissementCaisse,
  examenHospitalisationColumns,
  mapExamenHospitalisation,
  lignePrestationColumns,
  mapLignePrestation,
  getField,
  excelTimeToString,
  toObjectIdOrUndefined,
};
