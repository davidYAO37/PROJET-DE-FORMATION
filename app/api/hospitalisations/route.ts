import { NextRequest, NextResponse } from 'next/server';
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

    const query: Record<string, any> = {};
    if (statut) query.statutHospitalisation = statut;
    if (patientId) query.IdPatient = patientId;

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

  try {
    const body = await req.json();
    const providedCodePrestation = typeof body.codePrestation === 'string' ? body.codePrestation.trim() : '';

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

    // Données d'admission
    let admissionData: Record<string, any> = {
      sourceType: 'manuel',
      statutHospitalisation: 'en_cours',
      heureEntree: body.heureEntree || new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    };
    const dateEntree = body.dateEntree ? new Date(body.dateEntree) : new Date();
    const dateSortie = body.dateSortie ? new Date(body.dateSortie) : undefined;

    let avis: any = null;
    // Si l'admission démarre d'un avis médical
    if (body.avisHospitId) {
      avis = await AvisHospit.findById(body.avisHospitId).lean();
      if (!avis) {
        return NextResponse.json({ message: 'Avis d\'hospitalisation introuvable' }, { status: 404 });
      }
      if (avis.statut === 'admis') {
        return NextResponse.json({ message: 'Cet avis a déjà donné lieu à une admission' }, { status: 409 });
      }

      const consultation = !providedCodePrestation && avis.IDCONSULTATION
        ? await Consultation.findById(avis.IDCONSULTATION).select('CodePrestation').lean()
        : null;
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
    const patient = await Patient.findById(admissionData.patientId).lean();
    if (!patient) {
      return NextResponse.json({ message: 'Patient introuvable' }, { status: 404 });
    }

    // Récupérer les informations de la consultation si disponible (comme dans examenhospitalisationMedecin)
    let consultationData: any = {};
    if (admissionData.codePrestation) {
      const consultationDoc = await Consultation.findOne({ CodePrestation: admissionData.codePrestation }).lean();
      if (consultationDoc) {
        consultationData = consultationDoc;
      }
    }
    const nomMedecin = consultationData.Medecin || '';
    const idMedecin = consultationData.IDMEDECIN || admissionData.medecinId || null;

    // Nature d'acte
    let natureActeDesignation = body.natureActeDesignation || 'Hospitalisation';
    let natureActeId = body.natureActeId;
    if (body.natureActeId) {
      const typeActe = await TypeActe.findById(body.natureActeId).lean();
      natureActeDesignation = typeActe?.Designation || body.natureActeDesignation || 'Hospitalisation';
    }

    // Vérifier chambre et lit
    const chambre = await Chambre.findById(body.chambreId).lean();
    if (!chambre) {
      return NextResponse.json({ message: 'Chambre introuvable' }, { status: 404 });
    }

    const lit = await Lit.findById(body.litId).lean();
    if (!lit) {
      return NextResponse.json({ message: 'Lit introuvable' }, { status: 404 });
    }
    if (lit.etat !== 'libre') {
      return NextResponse.json({ message: 'Le lit n\'est pas disponible' }, { status: 409 });
    }

    if (!admissionData.codePrestation) {
      return NextResponse.json(
        { message: 'Le code prestation est requis pour créer la prestation de chambre' },
        { status: 400 }
      );
    }

    const ExamenHospitalisation = getTenantModel<IExamenHospitalisation>(connection, 'ExamenHospitalisation');
    const LignePrestation = getTenantModel<ILignePrestation>(connection, 'LignePrestation');
    const ActeClinique = getTenantModel<IActeClinique>(connection, 'ActeClinique');

    // Récupérer ou créer l'acte clinique correspondant à la chambre
    let acteChambreId = chambre.acteCliniqueId?.toString();
    let acteChambre: any = acteChambreId ? await ActeClinique.findById(acteChambreId).lean() : null;

    if (!acteChambre) {
      const designationActe = `Chambre ${chambre.numero || 'inconnue'}`;
      acteChambre = await ActeClinique.findOne({ designationacte: designationActe }).lean();
      if (!acteChambre) {
        acteChambre = await ActeClinique.create({
          designationacte: designationActe,
          lettreCle: 'CH',
          coefficient: 1,
          prixClinique: Number(chambre.prixClinique || chambre.tarifJournalier || 0),
          prixMutuel: Number(chambre.prixMutuel || 0),
          prixPreferentiel: Number(chambre.prixPreferentiel || 0),
          consultationviste: false,
          ActeNonFacturable: false,
        });
      }
      // Lier l'acte clinique à la chambre pour les prochaines fois
      await Chambre.findByIdAndUpdate(chambre._id, { acteCliniqueId: acteChambre._id });
    }

    // Durée probable de l'hospitalisation (quantité de jours de chambre)
    let dureeHospit = 1;
    if (body.quantite !== undefined && body.quantite !== '') {
      dureeHospit = Number(body.quantite) || 1;
    } else if (body.avisHospitId && avis) {
      dureeHospit = Number((avis as any).DureHospit) || 1;
    } else {
      dureeHospit = Number(body.dureeHospit) || 1;
    }

    // Prix unitaire chambre selon le type patient (comme au flux accueil)
    let prixUnitaireChambre = 0;
    if (body.prixChambre !== undefined && body.prixChambre !== '') {
      prixUnitaireChambre = Number(body.prixChambre) || 0;
    } else if (body.typePatient === 'mutualiste') {
      prixUnitaireChambre = Number(acteChambre.prixMutuel || acteChambre.prixClinique || chambre.tarifJournalier || 0);
    } else if (body.typePatient === 'preferentiel') {
      prixUnitaireChambre = Number(acteChambre.prixPreferentiel || acteChambre.prixClinique || chambre.tarifJournalier || 0);
    } else if (body.typePatient === 'non') {
      prixUnitaireChambre = Number(acteChambre.prixClinique || chambre.tarifJournalier || 0);
    } else {
      // Déduire automatiquement du type de patient en base
      if (patient.TarifPatient === 'Mutualiste') {
        prixUnitaireChambre = Number(acteChambre.prixMutuel || acteChambre.prixClinique || chambre.tarifJournalier || 0);
      } else if (patient.TarifPatient === 'Préférentiel') {
        prixUnitaireChambre = Number(acteChambre.prixPreferentiel || acteChambre.prixClinique || chambre.tarifJournalier || 0);
      } else {
        prixUnitaireChambre = Number(chambre.tarifJournalier || acteChambre.prixClinique || 0);
      }
    }

    const prixTotalChambre = prixUnitaireChambre * dureeHospit;
    const tauxAssurance = Number(patient.Taux || body.taux || 0);
    const partAssurance = prixTotalChambre * tauxAssurance / 100;
    const partAssure = prixTotalChambre - partAssurance;

    // Créer l'ExamenHospitalisation comme enregistrement unique d'hospitalisation
    const examenHospit = await ExamenHospitalisation.create({
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
      TotalapayerPatient: partAssure,
      Restapayer: partAssure,
      TotalReliquatPatient: 0,
      Assurance: patient.Assurance || admissionData.souscripteur || '',
      Assure: tauxAssurance > 0 ? 'TARIF MUTUALISTE' : 'NON ASSURE',
      Taux: String(tauxAssurance),
      IDASSURANCE: patient.IDASSURANCE,
      IDSOCIETEASSURANCE: patient.IDSOCIETEASSURANCE,
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
      SaisiPar: body.saisiPar || '',
      // Champs d'hospitalisation (anciennement dans le modèle Hospitalisation)
      consultationId: admissionData.consultationId,
      litId: lit._id,
      avisHospitId: admissionData.avisHospitId,
      sourceType: admissionData.sourceType,
      motifHospitalisation: admissionData.motifHospitalisation,
      service: admissionData.service,
      typeVisiteur: body.typeVisiteur,
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
    });

    try {
      await LignePrestation.create({
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
        coefficientActe: acteChambre.coefficient || 1,
        reliquatCoefAssurance: 0,
        lettreCle: acteChambre.lettreCle || '',
        taxe: 0,
        idTypeActe: natureActeId || acteChambre.IDTYPE_ACTE,
        idActe: acteChambre._id,
        prixClinique: acteChambre.prixClinique || prixUnitaireChambre,
        coefficientClinique: acteChambre.coefficient || 1,
        coefficientAssur: 0,
        tarifAssurance: 0,
        reliquatPatient: 0,
        totalCoefficient: 0,
        totalSurplus: 0,
        montantTotalAPayer: partAssure,
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
        Assurance: patient.Assurance || admissionData.souscripteur || '',
        SOCIETE_PATIENT: patient.SOCIETE_PATIENT || admissionData.societe || '',
        Code_dossier: patient.Code_dossier,
        ordonnancementAffichage: 0,
      });
    } catch (creationError) {
      await ExamenHospitalisation.findByIdAndDelete(examenHospit._id);
      throw creationError;
    }

    // Mettre à jour l'avis s'il existe
    if (body.avisHospitId) {
      await AvisHospit.findByIdAndUpdate(body.avisHospitId, {
        statut: 'admis',
        hospitalisationId: examenHospit._id,
        ...(providedCodePrestation && { codePrestation: providedCodePrestation }),
      });
    }

    // Occuper le lit et la chambre
    await Lit.findByIdAndUpdate(body.litId, {
      etat: 'occupe',
      patientId: admissionData.patientId,
      dateOccupation: new Date(),
    });

    await Chambre.findByIdAndUpdate(body.chambreId, { etat: 'occupee' });

    // Enregistrer le mouvement d'admission
    const Mouvement = getTenantModel<IMouvementHospitalisation>(connection, 'MouvementHospitalisation');
    await Mouvement.create({
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
    });

    // Création automatique d'un brouillon de rapport d'hospitalisation, pré-rempli
    // avec les données déjà disponibles au moment de l'admission (mêmes sources que
    // PrintFichePrescription : la consultation liée et ses lignes de prestation /
    // prescriptions). Le reste (évolution, traitement pendant le séjour, diagnostic
    // final, recommandations...) sera complété par le médecin pendant/à la fin du séjour.
    try {
      let examensParacliniquesText = '';
      let traitementAdministreText = '';

      if (admissionData.codePrestation) {
        const [lignesConsultation, prescriptionsConsultation] = await Promise.all([
          LignePrestation.find({ CodePrestation: admissionData.codePrestation }).lean(),
          getTenantModel<IPatientPrescription>(connection, 'PatientPrescription')
            .find({ CodePrestation: admissionData.codePrestation })
            .lean(),
        ]);

        const examensParacliniques = lignesConsultation
          .filter((ligne: any) => !!ligne.lettreCle && ['K', 'KC', 'B', 'Z', 'D'].includes(ligne.lettreCle))
          .sort((a: any, b: any) => (a.ordonnancementAffichage || 0) - (b.ordonnancementAffichage || 0));
        examensParacliniquesText = examensParacliniques.map((l: any) => l.prestation).join(' - ');

        traitementAdministreText = prescriptionsConsultation
          .map((p: any) => `- ${p.nomMedicament} ${p.posologie || ''} qté:${p.QteP}`)
          .join('\n');
      }

      const RapportHospitalisation = getTenantModel<IRapportHospitalisation>(connection, 'RapportHospitalisation');
      await RapportHospitalisation.create({
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
        statut: 'brouillon',
      });
    } catch (rapportError) {
      console.error('Erreur lors de la création du brouillon de rapport d\'hospitalisation:', rapportError);
    }

    return NextResponse.json(examenHospit, { status: 201 });
  } catch (error) {
    console.error('Erreur POST hospitalisation:', error);
    return NextResponse.json(
      { message: 'Erreur lors de la création', details: error instanceof Error ? error.message : '' },
      { status: 500 }
    );
  }
}
