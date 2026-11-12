import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { withTenant } from '@/lib/withTenant';
import { getTenantModel } from '@/lib/tenantModels';
import { IAvisHospit } from '@/models/AvisHospit';
import { IChambre } from '@/models/chambre';
import { ILit } from '@/models/lit';
import { IPatient } from '@/models/patient';
import { ITypeActe } from '@/models/TypeActe';
import { IConsultation } from '@/models/consultation';
import { IMedecin } from '@/models/medecin';
import { IMouvementHospitalisation } from '@/models/hospitalisation/MouvementHospitalisation';
import { IExamenHospitalisation } from '@/models/examenHospit';
import { ILignePrestation } from '@/models/lignePrestation';
import { IActeClinique } from '@/models/acteclinique';
import { IPatientPrescription } from '@/models/PatientPrescription';
import { IRapportHospitalisation } from '@/models/rapportHospitalisation';

const ADMISSION_ROLES = ['admin', 'accueil', 'infirmier'];

class AdmissionError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

function admissionNumber(value: unknown, label: string, minimum = 0) {
  if ((typeof value !== 'number' && typeof value !== 'string') || String(value).trim() === '') {
    throw new AdmissionError(`${label} invalide`);
  }
  const number = Number(value);
  if (!Number.isFinite(number) || number < minimum) throw new AdmissionError(`${label} invalide`);
  return number;
}

function ensurePopulateModels(connection: Parameters<typeof getTenantModel>[0]) {
  getTenantModel(connection, 'Patient');
  getTenantModel(connection, 'Consultation');
  getTenantModel(connection, 'Medecin');
  getTenantModel(connection, 'Assurance');
  getTenantModel(connection, 'Chambre');
  getTenantModel(connection, 'Lit');
  getTenantModel(connection, 'AvisHospit');
  getTenantModel(connection, 'TypeActe');
}

export async function GET(req: NextRequest) {
  const { context, response } = await withTenant(req, ['admin', 'medecin', 'accueil', 'infirmier']);
  if (!context) return response;
  const { connection } = context;

  try {
    const { searchParams } = new URL(req.url);
    const statut = searchParams.get('statut');
    const patientId = searchParams.get('patientId');
    const litId = searchParams.get('litId');

    const query: Record<string, any> = {};
    if (statut) query.statutHospitalisation = statut;
    if (patientId) query.IdPatient = patientId;
    if (litId) query.litId = litId;

    ensurePopulateModels(connection);
    const ExamenHospitalisation = getTenantModel<IExamenHospitalisation>(connection, 'ExamenHospitalisation');
    const hospitalisations = await ExamenHospitalisation.find(query)
      .populate('IdPatient', 'Nom Prenoms Code_dossier Assurance SOCIETE_PATIENT')
      .populate('IDCHAMBRE', 'numero type service tarifJournalier')
      .populate('litId', 'numero tarifJournalier etat')
      .populate('idMedecin', 'nom prenoms')
      .populate('IDASSURANCE', 'nom assureur taux')
      .populate('avisHospitId')
      .sort({ Entrele: -1 })
      .lean();

    return NextResponse.json(hospitalisations);
  } catch (error) {
    console.error('Erreur GET hospitalisations:', error);
    return NextResponse.json(
      { message: 'Erreur serveur', details: error instanceof Error ? error.message : '' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const { context, response } = await withTenant(req, ADMISSION_ROLES);
  if (!context) return response;
  const { connection, userObjectId } = context;
  let session: mongoose.ClientSession | undefined;

  try {
    const body = await req.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new AdmissionError('Données d’admission invalides');
    for (const field of ['patientId', 'avisHospitId', 'consultationId', 'medecinId', 'chambreId', 'litId', 'natureActeId', 'assuranceId', 'societeAssuranceId']) {
      if (body[field] !== undefined && body[field] !== '' &&
          (typeof body[field] !== 'string' || !mongoose.isObjectIdOrHexString(body[field]))) {
        throw new AdmissionError(`${field} invalide`);
      }
    }
    if (body.codePrestation !== undefined && (typeof body.codePrestation !== 'string' || body.codePrestation.length > 50)) {
      throw new AdmissionError('Code prestation invalide');
    }
    if (body.typeVisiteur && !['assure', 'non_assure', 'compte_client'].includes(body.typeVisiteur)) {
      throw new AdmissionError('Type de prise en charge invalide');
    }
    if (body.typePatient && !['non', 'mutualiste', 'preferentiel', 'assure'].includes(body.typePatient)) {
      throw new AdmissionError('Catégorie tarifaire invalide');
    }
    if (body.heureEntree && (typeof body.heureEntree !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(body.heureEntree))) {
      throw new AdmissionError('Heure d’entrée invalide');
    }
    if (body.taux !== undefined && admissionNumber(body.taux, 'Taux') > 100) throw new AdmissionError('Le taux doit être compris entre 0 et 100');
    for (const field of ['quantite', 'dureeHospit']) {
      if (body[field] !== undefined && body[field] !== '' && !Number.isSafeInteger(admissionNumber(body[field], 'Durée', 1))) {
        throw new AdmissionError('La durée doit être un nombre entier de jours');
      }
    }
    if (body.prixChambre !== undefined && body.prixChambre !== '') admissionNumber(body.prixChambre, 'Prix de chambre');
    for (const field of ['dateEntree', 'dateSortie']) {
      if (body[field] !== undefined && body[field] !== '' && typeof body[field] !== 'string') throw new AdmissionError(`${field} invalide`);
    }
    const providedCodePrestation = typeof body.codePrestation === 'string' ? body.codePrestation.trim() : '';
    const tenantFilter = context.isSharedConnection && context.entrepriseId ? { entrepriseId: context.entrepriseId } : {};
    if (context.isSharedConnection && context.entrepriseId) {
      throw new AdmissionError('Une base tenant dédiée est requise pour sécuriser les admissions et les lits', 503);
    }

    if (!body.chambreId || !body.litId) {
      return NextResponse.json(
        { message: 'La chambre et le lit sont requis pour l\'admission' },
        { status: 400 }
      );
    }

    ensurePopulateModels(connection);
    const AvisHospit = getTenantModel<IAvisHospit>(connection, 'AvisHospit');
    const Chambre = getTenantModel<IChambre>(connection, 'Chambre');
    const Lit = getTenantModel<ILit>(connection, 'Lit');
    const Patient = getTenantModel<IPatient>(connection, 'Patient');
    const TypeActe = getTenantModel<ITypeActe>(connection, 'TypeActe');
    const Consultation = getTenantModel<IConsultation>(connection, 'Consultation');
    const Medecin = getTenantModel<IMedecin>(connection, 'Medecin');
    const ExamenHospitalisation = getTenantModel<IExamenHospitalisation>(connection, 'ExamenHospitalisation');
    const LignePrestation = getTenantModel<ILignePrestation>(connection, 'LignePrestation');
    const ActeClinique = getTenantModel<IActeClinique>(connection, 'ActeClinique');
    const Assurance = getTenantModel<any>(connection, 'Assurance');
    const SocieteAssurance = getTenantModel<any>(connection, 'SocieteAssurance');
    const TarifAssurance = getTenantModel<any>(connection, 'TarifAssurance');
    const TarifSocieteAssurance = getTenantModel<any>(connection, 'TarifSocieteAssurance');
    const Mouvement = getTenantModel<IMouvementHospitalisation>(connection, 'MouvementHospitalisation');
    const RapportHospitalisation = getTenantModel<IRapportHospitalisation>(connection, 'RapportHospitalisation');
    const PatientPrescription = getTenantModel<IPatientPrescription>(connection, 'PatientPrescription');
    session = await connection.startSession();
    return await session.withTransaction(async () => {

    // Données d'admission
    let admissionData: Record<string, any> = {
      sourceType: 'manuel',
      statutHospitalisation: 'en_cours',
      heureEntree: body.heureEntree || new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    };
    const dateEntree = body.dateEntree ? new Date(body.dateEntree) : new Date();
    const dateSortie = body.dateSortie ? new Date(body.dateSortie) : undefined;
    if (!Number.isFinite(dateEntree.getTime()) || (dateSortie && (!Number.isFinite(dateSortie.getTime()) || dateSortie < dateEntree))) {
      throw new AdmissionError('Dates d’entrée ou de sortie invalides');
    }
    if (dateSortie) throw new AdmissionError('La sortie doit être enregistrée depuis le parcours de sortie, pas lors de l’admission');

    let avis: any = null;
    // Si l'admission démarre d'un avis médical
    if (body.avisHospitId) {
      avis = await AvisHospit.findById(body.avisHospitId).session(session!).lean();
      if (!avis) {
        return NextResponse.json({ message: 'Avis d\'hospitalisation introuvable' }, { status: 404 });
      }
      if (avis.statut !== 'en_attente') {
        throw new AdmissionError('Seul un avis en attente peut donner lieu à une admission', 409);
      }
      if (body.patientId && String(avis.IDPARTIENT) !== body.patientId) throw new AdmissionError('Le patient ne correspond pas à l’avis');
      if (body.consultationId && String(avis.IDCONSULTATION) !== body.consultationId) throw new AdmissionError('La consultation ne correspond pas à l’avis');

      const consultation = avis.IDCONSULTATION
        ? await Consultation.findById(avis.IDCONSULTATION).session(session!).lean()
        : null;
      if (avis.IDCONSULTATION && !consultation) throw new AdmissionError('Consultation de l’avis introuvable', 404);
      if (providedCodePrestation && consultation && consultation.CodePrestation !== providedCodePrestation) {
        throw new AdmissionError('Le code prestation ne correspond pas à la consultation de l’avis');
      }
      const codePrestation = providedCodePrestation || avis.codePrestation || consultation?.CodePrestation;

      admissionData = {
        ...admissionData,
        avisHospitId: avis._id,
        codePrestation,
        patientId: avis.IDPARTIENT.toString(),
        consultationId: avis.IDCONSULTATION ? avis.IDCONSULTATION.toString() : undefined,
        medecinId: avis.medecinId ? avis.medecinId.toString() : undefined,
        diagnosticInitial: avis.Diagnostic,
        motifHospitalisation: avis.Diagnostic,
        service: avis.serviceHospit,
        societe: avis.SocieteP || body.societe,
        souscripteur: avis.assurance || body.souscripteur,
        sourceType: 'avis_medecin',
      };
    } else {
      if (!body.patientId) {
        return NextResponse.json({ message: 'patientId est requis en l\'absence d\'avis' }, { status: 400 });
      }
      admissionData.patientId = body.patientId;
      admissionData.consultationId = body.consultationId;
      admissionData.codePrestation = providedCodePrestation || undefined;
      admissionData.medecinId = body.medecinId;
      admissionData.diagnosticInitial = body.diagnosticInitial;
      admissionData.motifHospitalisation = body.motifHospitalisation;
      admissionData.service = body.service;
      admissionData.societe = body.societe;
      admissionData.souscripteur = body.souscripteur;
    }

    // Vérifier patient
    const patient = await Patient.findOneAndUpdate(
      { _id: admissionData.patientId, ...tenantFilter },
      { $inc: { admissionVersion: 1 } },
      { new: true, session }
    ).lean();
    if (!patient) {
      return NextResponse.json({ message: 'Patient introuvable' }, { status: 404 });
    }

    if (await ExamenHospitalisation.exists({ IdPatient: patient!._id, statutHospitalisation: 'en_cours' }).session(session!)) {
      throw new AdmissionError('Le patient possède déjà un séjour actif', 409);
    }

    // Récupérer les informations de la consultation si disponible (comme dans examenhospitalisationMedecin)
    let consultationData: any = {};
    if (admissionData.consultationId || admissionData.codePrestation) {
      const consultationDoc = admissionData.consultationId
        ? await Consultation.findById(admissionData.consultationId).session(session!).lean()
        : await Consultation.findOne({ CodePrestation: admissionData.codePrestation }).session(session!).lean();
      if (!consultationDoc) throw new AdmissionError('Consultation introuvable', 404);
      if (String(consultationDoc.IdPatient) !== String(patient!._id)) throw new AdmissionError('La consultation appartient à un autre patient');
      if (admissionData.codePrestation && consultationDoc.CodePrestation !== admissionData.codePrestation) {
        throw new AdmissionError('Le code prestation ne correspond pas à la consultation');
      }
      consultationData = consultationDoc;
      admissionData.consultationId = consultationDoc._id;
    }
    const idMedecin = consultationData.IDMEDECIN || admissionData.medecinId || null;
    const medecin = idMedecin ? await Medecin.findById(idMedecin).session(session!).lean() : null;
    if (idMedecin && !medecin) throw new AdmissionError('Médecin introuvable', 404);
    const nomMedecin = consultationData.Medecin || (medecin ? `${medecin.nom || ''} ${medecin.prenoms || ''}`.trim() : '');
    const sejourId = new mongoose.Types.ObjectId();
    admissionData.codePrestation = `HOSP-${sejourId.toHexString()}`;

    // Nature d'acte
    let natureActeDesignation = body.natureActeDesignation || 'Hospitalisation';
    let natureActeId = body.natureActeId;
    if (body.natureActeId) {
      const typeActe = await TypeActe.findById(body.natureActeId).session(session!).lean();
      if (!typeActe) throw new AdmissionError('Nature d’acte introuvable', 404);
      natureActeDesignation = typeActe.Designation || 'Hospitalisation';
    }

    // Vérifier chambre et lit
    const chambre = await Chambre.findById(body.chambreId).session(session!).lean();
    if (!chambre) throw new AdmissionError('Chambre introuvable', 404);
    if (['maintenance', 'fermee', 'reservee'].includes(chambre.etat)) throw new AdmissionError('Chambre indisponible', 409);

    const lit = await Lit.findOneAndUpdate(
      { _id: body.litId, chambreId: chambre._id, etat: 'libre' },
      { $set: { etat: 'occupe', patientId: admissionData.patientId, dateOccupation: dateEntree }, $unset: { dateLiberation: 1 } },
      { new: true, session }
    ).lean();
    if (!lit) throw new AdmissionError('Lit indisponible ou ne correspondant pas à la chambre', 409);
    if (await ExamenHospitalisation.exists({ litId: lit._id, statutHospitalisation: 'en_cours' }).session(session!)) {
      throw new AdmissionError('Ce lit est déjà lié à un séjour actif', 409);
    }

    // Récupérer ou créer l'acte clinique correspondant à la chambre
    let acteChambreId = chambre.acteCliniqueId?.toString();
    let acteChambre: any = acteChambreId ? await ActeClinique.findById(acteChambreId).session(session!).lean() : null;

    if (!acteChambre) {
      const designationActe = `Chambre ${chambre.numero || 'inconnue'}`;
      acteChambre = await ActeClinique.findOne({ designationacte: designationActe }).session(session!).lean();
      if (!acteChambre) {
        acteChambre = await new ActeClinique({
          designationacte: designationActe,
          lettreCle: 'CH',
          coefficient: 1,
          prixClinique: Number(chambre.prixClinique || chambre.tarifJournalier || 0),
          prixMutuel: Number(chambre.prixMutuel || 0),
          prixPreferentiel: Number(chambre.prixPreferentiel || 0),
          consultationviste: false,
          ActeNonFacturable: false,
        }).save({ session });
      }
      // Lier l'acte clinique à la chambre pour les prochaines fois
      await Chambre.findByIdAndUpdate(chambre._id, { acteCliniqueId: acteChambre._id }, { session });
    }

    // Durée probable de l'hospitalisation (quantité de jours de chambre)
    const dureeHospit = admissionNumber(
      body.quantite !== undefined && body.quantite !== '' ? body.quantite : body.dureeHospit !== undefined && body.dureeHospit !== '' ? body.dureeHospit : avis?.DureHospit || 1,
      'Durée', 1
    );
    if (!Number.isSafeInteger(dureeHospit)) throw new AdmissionError('La durée doit être un nombre entier de jours');

    // Prix unitaire chambre selon le type patient (comme au flux accueil)
    // Déduire automatiquement du type de patient en base
    const typeVisiteur = body.typeVisiteur || (patient.IDASSURANCE ? 'assure' : 'non_assure');
    const typePatient = body.typePatient || (patient.TarifPatient === 'Mutualiste' ? 'mutualiste' : patient.TarifPatient === 'Préférentiel' ? 'preferentiel' : 'non');
    const assure = typeVisiteur === 'assure';
    const assuranceId = assure ? body.assuranceId || patient.IDASSURANCE : undefined;
    if (assure && !assuranceId) throw new AdmissionError('Une assurance est requise pour la prise en charge');
    if (!assure && (body.assuranceId || body.societeAssuranceId || Number(body.taux || 0) > 0)) {
      throw new AdmissionError('La couverture ne correspond pas au type de prise en charge');
    }
    const assurance = assuranceId ? await Assurance.findById(assuranceId).session(session!).lean() : null;
    if (assure && !assurance) throw new AdmissionError('Assurance introuvable', 404);
    const societeAssuranceId = assure ? body.societeAssuranceId || (String(assuranceId) === String(patient.IDASSURANCE) ? patient.IDSOCIETEASSURANCE : undefined) : undefined;
    const societeAssurance = societeAssuranceId ? await SocieteAssurance.findById(societeAssuranceId).session(session!).lean() : null;
    if (societeAssuranceId && !societeAssurance) throw new AdmissionError('Société d’assurance introuvable', 404);
    if (societeAssurance && String(societeAssurance.Assurance) !== String(assuranceId)) {
      throw new AdmissionError('La société n’appartient pas à l’assurance sélectionnée');
    }
    if (assure && String(assuranceId) !== String(patient.IDASSURANCE) && body.taux === undefined) {
      throw new AdmissionError('Le taux doit être précisé pour la nouvelle assurance');
    }
    const tauxAssurance = assure ? admissionNumber(body.taux ?? patient.Taux ?? 0, 'Taux') : 0;
    if (tauxAssurance > 100) throw new AdmissionError('Le taux doit être compris entre 0 et 100');
    const accepteSurplus = societeAssurance?.accepteSurplus ?? assurance?.accepteSurplus ?? true;
    const champPrix = typePatient === 'mutualiste' ? 'prixMutuel' : typePatient === 'preferentiel' || (assure && typePatient !== 'non') ? 'prixPreferentiel' : 'prixClinique';
    let prixUnitaireChambre = admissionNumber(
      body.prixChambre !== undefined && body.prixChambre !== '' ? body.prixChambre : acteChambre[champPrix] ?? chambre.tarifJournalier ?? 0,
      'Prix de chambre'
    );
    let coefficientChambre = admissionNumber(acteChambre.coefficient ?? 1, 'Coefficient clinique', 0.000001);
    let tarif: any = null;
    if (assure) {
      if (societeAssurance && societeAssurance.utiliseTarifsPropres !== false) {
        tarif = await TarifSocieteAssurance.findOne({ societeAssurance: societeAssurance._id, acteId: acteChambre._id }).session(session!).lean();
      }
      if (!tarif) tarif = await TarifAssurance.findOne({ assurance: assuranceId, acteId: acteChambre._id }).session(session!).lean();
    }
    const prixTarif = tarif ? admissionNumber(typePatient === 'mutualiste' ? tarif.prixmutuel : tarif.prixpreferenciel, 'Tarif assurance') : 0;
    const coefficientTarif = tarif ? admissionNumber(tarif.coefficient ?? 1, 'Coefficient assurance', 0.000001) : 0;
    const baseClinique = prixUnitaireChambre * coefficientChambre * dureeHospit;
    const baseAssurance = tarif ? prixTarif * coefficientTarif * dureeHospit : baseClinique;
    let prixTotalChambre = tarif ? accepteSurplus ? Math.max(baseClinique, baseAssurance) : baseAssurance : baseClinique;
    if (tarif && (accepteSurplus === false || baseAssurance > baseClinique)) {
      prixUnitaireChambre = prixTarif;
      coefficientChambre = coefficientTarif;
    }
    prixTotalChambre = Math.round(prixTotalChambre);
    if (!Number.isSafeInteger(prixTotalChambre)) throw new AdmissionError('Montant de chambre invalide');
    const partAssurance = Math.round(baseAssurance * tauxAssurance / 100);
    const reliquatPatient = Math.max(0, prixTotalChambre - Math.round(baseAssurance));
    const partAssure = prixTotalChambre - partAssurance - reliquatPatient;
    const totalPatient = prixTotalChambre - partAssurance;

    // Créer l'ExamenHospitalisation comme enregistrement unique d'hospitalisation
    const examenHospit = await new ExamenHospitalisation({
      _id: sejourId,
      CodePrestation: admissionData.codePrestation,
      PatientP: `${patient.Nom} ${patient.Prenoms}`.trim(),
      Code_dossier: patient.Code_dossier,
      NomMed: nomMedecin,
      idMedecin: idMedecin,
      DatePres: dateEntree,
      Rclinique: admissionData.diagnosticInitial || '',
      Montanttotal: prixTotalChambre,
      TotalPaye: 0,
      TotaleTaxe: 0,
      MontantRecu: 0,
      PartAssuranceP: partAssurance,
      Partassure: partAssure,
      TotalapayerPatient: totalPatient,
      Restapayer: totalPatient,
      TotalReliquatPatient: reliquatPatient,
      Assurance: assurance?.designationassurance || '',
      Assure: assure ? typePatient === 'mutualiste' ? 'TARIF MUTUALISTE' : 'TARIF ASSURE' : 'NON ASSURE',
      Taux: String(tauxAssurance),
      IDASSURANCE: assuranceId,
      IDSOCIETEASSURANCE: societeAssuranceId,
      accepteSurplus,
      CompteClient: typeVisiteur === 'compte_client',
      Numcarte: patient.Matricule || '',
      NumBon: '',
      Souscripteur: patient.Souscripteur || '',
      IdPatient: admissionData.patientId,
      Entrele: dateEntree,
      SortieLe: dateSortie,
      Chambre: chambre.numero,
      nombreDeJours: dureeHospit,
      IDTYPE_ACTE: natureActeDesignation,
      Designationtypeacte: natureActeDesignation,
      Modepaiement: undefined,
      StatutFacture: false,
      Payeoupas: false,
      IDCHAMBRE: chambre._id,
      SOCIETE_PATIENT: patient.SOCIETE_PATIENT || admissionData.societe || '',
      SocieteP: patient.SOCIETE_PATIENT || admissionData.societe || '',
      statutPrescriptionMedecin: 2,
      sexe: patient.sexe,
      SaisiPar: userObjectId.toString(),
      // Champs d'hospitalisation (anciennement dans le modèle Hospitalisation)
      consultationId: admissionData.consultationId,
      litId: lit._id,
      avisHospitId: admissionData.avisHospitId,
      sourceType: admissionData.sourceType,
      motifHospitalisation: admissionData.motifHospitalisation,
      service: admissionData.service,
      typeVisiteur,
      heureEntree: admissionData.heureEntree,
      statutHospitalisation: 'en_cours',
      montantChambre: prixTotalChambre,
      montantActes: 0,
      montantExamens: 0,
      montantMedicaments: 0,
      montantSoins: 0,
      montantHonoraires: 0,
      remise: 0,
      ObservationHospitalisation: body.observations || '',
    }).save({ session });

      await new LignePrestation({
        CodePrestation: admissionData.codePrestation,
        dateLignePrestation: dateEntree,
        prestation: acteChambre.designationacte || `${chambre.type}`,
        qte: dureeHospit,
        prix: prixUnitaireChambre,
        partAssurance,
        tauxAssurance,
        IdPatient: admissionData.patientId,
        idHospitalisation: examenHospit._id,
        partAssure,
        prixTotal: prixTotalChambre,
        coefficientActe: coefficientChambre,
        reliquatCoefAssurance: 0,
        lettreCle: acteChambre.lettreCle || '',
        taxe: 0,
        idTypeActe: natureActeId || acteChambre.IDTYPE_ACTE,
        idActe: acteChambre._id,
        prixClinique: acteChambre.prixClinique || prixUnitaireChambre,
        coefficientClinique: acteChambre.coefficient || 1,
        coefficientAssur: coefficientTarif,
        tarifAssurance: prixTarif,
        reliquatPatient,
        totalCoefficient: 0,
        totalSurplus: reliquatPatient,
        montantTotalAPayer: totalPatient,
        montantMedecinExecutant: 0,
        numMedecinExecutant: '',
        acteMedecin: 'NON',
        exclusionActe: 'Accepter',
        prixAccepte: prixTotalChambre,
        prixRefuse: 0,
        statutPrescriptionMedecin: 2,
        nomPatient: `${patient.Nom} ${patient.Prenoms}`.trim(),
        sexe: patient.sexe || '',
        agePatient: patient.Age_partient || 0,
        situationGeo: patient.Situationgeo || '',
        idMedecin: idMedecin,
        medecinPrescripteur: nomMedecin,
        Assurance: assurance?.designationassurance || '',
        SOCIETE_PATIENT: patient.SOCIETE_PATIENT || admissionData.societe || '',
        Code_dossier: patient.Code_dossier,
        ordonnancementAffichage: 0,
      }).save({ session });

    // Mettre à jour l'avis s'il existe
    if (body.avisHospitId) {
      const claimedAvis = await AvisHospit.findOneAndUpdate({ _id: body.avisHospitId, statut: 'en_attente' }, {
        statut: 'admis',
        hospitalisationId: examenHospit._id,
      }, { session, new: true });
      if (!claimedAvis) throw new AdmissionError('Cet avis n’est plus disponible pour une admission', 409);
    }

    // Occuper le lit et la chambre
    await Chambre.findByIdAndUpdate(body.chambreId, { etat: 'occupee' }, { session });

    // Enregistrer le mouvement d'admission
    await new Mouvement({
      hospitalisationId: examenHospit._id,
      patientId: admissionData.patientId,
      type: 'admission',
      date: dateEntree,
      heure: admissionData.heureEntree,
      chambreIdCible: body.chambreId,
      litIdCible: body.litId,
      auteurId: userObjectId,
      motif: body.motif,
      observation: body.observations,
    }).save({ session });

    // Création automatique d'un brouillon de rapport d'hospitalisation, pré-rempli
    // avec les données déjà disponibles au moment de l'admission (mêmes sources que
    // PrintFichePrescription : la consultation liée et ses lignes de prestation /
    // prescriptions). Le reste (évolution, traitement pendant le séjour, diagnostic
    // final, recommandations...) sera complété par le médecin pendant/à la fin du séjour.
      let examensParacliniquesText = '';
      let traitementAdministreText = '';

      if (consultationData.CodePrestation) {
        const lignesConsultation = await LignePrestation.find({ CodePrestation: consultationData.CodePrestation, IdPatient: patient._id }).session(session!).lean();
        const prescriptionsConsultation = await PatientPrescription.find({ CodePrestation: consultationData.CodePrestation, IdPatient: String(patient._id) }).session(session!).lean();

        const examensParacliniques = lignesConsultation
          .filter((ligne: any) => !!ligne.lettreCle && ['K', 'KC', 'B', 'Z', 'D'].includes(ligne.lettreCle))
          .sort((a: any, b: any) => (a.ordonnancementAffichage || 0) - (b.ordonnancementAffichage || 0));
        examensParacliniquesText = examensParacliniques.map((l: any) => l.prestation).join(' - ');

        traitementAdministreText = prescriptionsConsultation
          .map((p: any) => `- ${p.nomMedicament} ${p.posologie || ''} qté:${p.QteP}`)
          .join('\n');
      }

      await new RapportHospitalisation({
        patientId: admissionData.patientId,
        hospitalisationId: String(examenHospit._id),
        patientNom: patient.Nom,
        patientPrenoms: patient.Prenoms,
        dateEntree,
        dateSortie,
        service: admissionData.service || natureActeDesignation,
        motifHospitalisation: admissionData.motifHospitalisation || '',
        diagnosticAdmission: admissionData.diagnosticInitial || consultationData.Diagnostic || '',
        examenClinique: consultationData.ExamenClinique || '',
        examensParacliniques: examensParacliniquesText,
        traitementAdministre: traitementAdministreText,
        medecinTraitant: nomMedecin || '',
        dateRapport: dateEntree,
        auteurId: userObjectId.toString(),
        statut: 'brouillon',
      }).save({ session });

    return NextResponse.json(examenHospit, { status: 201 });
    }, { readConcern: { level: 'snapshot' }, writeConcern: { w: 'majority' } });
  } catch (error) {
    if (error instanceof AdmissionError) return NextResponse.json({ message: error.message }, { status: error.status });
    if (error instanceof SyntaxError || error instanceof mongoose.Error.CastError || error instanceof mongoose.Error.ValidationError) {
      return NextResponse.json({ message: 'Données d’admission invalides' }, { status: 400 });
    }
    if (error instanceof Error && /Transaction numbers are only allowed|does not support retryable writes|replica set/i.test(error.message)) {
      return NextResponse.json({ message: 'Les admissions nécessitent MongoDB Atlas ou un replica set pour garantir une transaction complète', code: 'TRANSACTIONS_REQUIRED' }, { status: 503 });
    }
    console.error('Erreur POST hospitalisation:', error);
    return NextResponse.json({ message: 'Erreur lors de la création de l’admission' }, { status: 500 });
  } finally {
    await session?.endSession();
  }
}
