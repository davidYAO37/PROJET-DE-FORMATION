import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { db } from '@/db/mongoConnect';
import { Consultation } from '@/models/consultation';
import { RendezVous } from '@/models/RendezVous';
import { Prescription } from '@/models/Prescription';
import { LignePrestation } from '@/models/lignePrestation';
import { Medecin } from '@/models/medecin';
import { Facturation } from '@/models/Facturation';
import { ExamenHospitalisation } from '@/models/examenHospit';
import { Patient } from '@/models/patient';

const startOfDay = (date: Date) => {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
};

const endOfDay = (date: Date) => {
  const value = new Date(date);
  value.setHours(23, 59, 59, 999);
  return value;
};

const addDays = (date: Date, days: number) => {
  const value = new Date(date);
  value.setDate(value.getDate() + days);
  return value;
};

const toObjectId = (id: string | null) => {
  if (!id || !mongoose.Types.ObjectId.isValid(id)) return null;
  return new mongoose.Types.ObjectId(id);
};

const getVariation = (actuel: number, precedent: number) => {
  if (precedent === 0) return actuel > 0 ? 100 : 0;
  return Number((((actuel - precedent) / precedent) * 100).toFixed(1));
};

const getStatus = (taux: number): 'Excellent' | 'Correct' | 'À surveiller' => {
  if (taux >= 85) return 'Excellent';
  if (taux >= 70) return 'Correct';
  return 'À surveiller';
};

export async function GET(request: NextRequest) {
  try {
    await db();

    const { searchParams } = new URL(request.url);
    const medecinIdParam = searchParams.get('medecinId');
    const dateDebutParam = searchParams.get('dateDebut');
    const dateFinParam = searchParams.get('dateFin');
    const service = searchParams.get('service');
    const typeExamen = searchParams.get('typeExamen');
    const medecinObjectId = toObjectId(medecinIdParam);

    const today = new Date();
    const todayEnd = endOfDay(today);
    const currentStart = startOfDay(addDays(today, -29));
    const periodStart = dateDebutParam ? startOfDay(new Date(dateDebutParam)) : currentStart;
    const periodEnd = dateFinParam ? endOfDay(new Date(dateFinParam)) : todayEnd;
    const periodDays = Math.max(1, Math.ceil((periodEnd.getTime() - periodStart.getTime()) / (24 * 60 * 60 * 1000)) + 1);
    const previousStart = startOfDay(addDays(periodStart, -periodDays));
    const previousEnd = endOfDay(addDays(periodStart, -1));

    const medecinFilter = medecinObjectId ? { IDMEDECIN: medecinObjectId } : {};
    const rendezVousMedecinFilter = medecinObjectId ? { IDMEDECIN: medecinObjectId } : {};
    const ligneMedecinFilter = medecinObjectId ? { $or: [{ idMedecin: medecinObjectId }, { idMedecin: medecinIdParam }] } : {};
    const facturationMedecinFilter = medecinObjectId ? { IDMEDECIN: medecinObjectId } : {};
    const medecinListFilter = medecinObjectId ? { _id: medecinObjectId } : {};
    const consultationServiceFilter = service ? { designationC: { $regex: service, $options: 'i' } } : {};
    const prescriptionServiceFilter = service ? { Designation: { $regex: service, $options: 'i' } } : {};
    const lignePrestationFilter = typeExamen ? { prestation: { $regex: typeExamen, $options: 'i' } } : {};
    const facturationServiceFilter = service ? { Designationtypeacte: { $regex: service, $options: 'i' } } : {};
    const hospitalisationServiceFilter = service ? { Designationtypeacte: { $regex: service, $options: 'i' } } : {};
    const [
      consultationsJour,
      patientsEnAttente,
      patientsRecus,
      rendezVousJour,
      prescriptionsEmises,
      examensDemandes,
      consultationsCurrent,
      consultationsPrevious,
      rendezVousCurrent,
      rendezVousPrevious,
      prescriptionsCurrent,
      prescriptionsPrevious,
      examensCurrent,
      examensPrevious,
      medecins,
      consultationsParMedecinActuel,
      consultationsParMedecinPrecedent,
      consultationsParActeActuel,
      consultationsParActePrecedent,
      prescriptionsParActeActuel,
      prescriptionsParActePrecedent,
      lignesParActeActuel,
      lignesParActePrecedent,
      hospitalisationsParActeActuel,
      actesExamensParMontant,
      consultationsParMontant,
      patientsParMedecin,
      montantParAssurance,
      consultationsMontantParAssurance,
      examensConsultationsParSexe,
    ] = await Promise.all([
      Consultation.countDocuments({ ...medecinFilter, ...consultationServiceFilter, Date_consulation: { $gte: periodStart, $lte: periodEnd } }),
      Consultation.countDocuments({ ...medecinFilter, ...consultationServiceFilter, Date_consulation: { $gte: periodStart, $lte: periodEnd }, attenteMedecin: 0 }),
      Consultation.countDocuments({ ...medecinFilter, ...consultationServiceFilter, Date_consulation: { $gte: periodStart, $lte: periodEnd }, attenteMedecin: 2 }),
      RendezVous.countDocuments({ ...rendezVousMedecinFilter, DatePlanning: { $gte: periodStart, $lte: periodEnd }, PatientR: { $nin: ['', null] } }),
      Prescription.countDocuments({ ...medecinFilter, ...prescriptionServiceFilter, DatePres: { $gte: periodStart, $lte: periodEnd } }),
      LignePrestation.countDocuments({ ...ligneMedecinFilter, ...lignePrestationFilter, dateLignePrestation: { $gte: periodStart, $lte: periodEnd } }),
      Consultation.countDocuments({ ...medecinFilter, ...consultationServiceFilter, Date_consulation: { $gte: periodStart, $lte: periodEnd } }),
      Consultation.countDocuments({ ...medecinFilter, ...consultationServiceFilter, Date_consulation: { $gte: previousStart, $lte: previousEnd } }),
      RendezVous.countDocuments({ ...rendezVousMedecinFilter, DatePlanning: { $gte: periodStart, $lte: periodEnd }, PatientR: { $nin: ['', null] } }),
      RendezVous.countDocuments({ ...rendezVousMedecinFilter, DatePlanning: { $gte: previousStart, $lte: previousEnd }, PatientR: { $nin: ['', null] } }),
      Prescription.countDocuments({ ...medecinFilter, ...prescriptionServiceFilter, DatePres: { $gte: periodStart, $lte: periodEnd } }),
      Prescription.countDocuments({ ...medecinFilter, ...prescriptionServiceFilter, DatePres: { $gte: previousStart, $lte: previousEnd } }),
      LignePrestation.countDocuments({ ...ligneMedecinFilter, ...lignePrestationFilter, dateLignePrestation: { $gte: periodStart, $lte: periodEnd } }),
      LignePrestation.countDocuments({ ...ligneMedecinFilter, ...lignePrestationFilter, dateLignePrestation: { $gte: previousStart, $lte: previousEnd } }),
      Medecin.find(medecinListFilter).select('nom prenoms specialite').lean(),
      Consultation.aggregate([
        { $match: { Date_consulation: { $gte: periodStart, $lte: periodEnd }, ...medecinFilter, ...consultationServiceFilter } },
        { $group: { _id: '$IDMEDECIN', total: { $sum: 1 } } },
      ]),
      Consultation.aggregate([
        { $match: { Date_consulation: { $gte: previousStart, $lte: previousEnd }, ...medecinFilter, ...consultationServiceFilter } },
        { $group: { _id: '$IDMEDECIN', total: { $sum: 1 } } },
      ]),
      Consultation.aggregate([
        { $match: { Date_consulation: { $gte: periodStart, $lte: periodEnd }, ...medecinFilter, ...consultationServiceFilter } },
        { $group: { _id: '$designationC', total: { $sum: 1 } } },
        { $sort: { total: -1 } },
        { $limit: 8 },
      ]),
      Consultation.aggregate([
        { $match: { Date_consulation: { $gte: previousStart, $lte: previousEnd }, ...medecinFilter, ...consultationServiceFilter } },
        { $group: { _id: '$designationC', total: { $sum: 1 } } },
      ]),
      Prescription.aggregate([
        { $match: { DatePres: { $gte: periodStart, $lte: periodEnd }, ...medecinFilter, ...prescriptionServiceFilter } },
        { $group: { _id: '$Designation', total: { $sum: 1 } } },
        { $sort: { total: -1 } },
        { $limit: 8 },
      ]),
      Prescription.aggregate([
        { $match: { DatePres: { $gte: previousStart, $lte: previousEnd }, ...medecinFilter, ...prescriptionServiceFilter } },
        { $group: { _id: '$Designation', total: { $sum: 1 } } },
      ]),
      LignePrestation.aggregate([
        { $match: { dateLignePrestation: { $gte: periodStart, $lte: periodEnd }, ...ligneMedecinFilter, ...lignePrestationFilter } },
        { $group: { _id: '$prestation', total: { $sum: '$qte' } } },
        { $sort: { total: -1 } },
        { $limit: 8 },
      ]),
      LignePrestation.aggregate([
        { $match: { dateLignePrestation: { $gte: previousStart, $lte: previousEnd }, ...ligneMedecinFilter, ...lignePrestationFilter } },
        { $group: { _id: '$prestation', total: { $sum: '$qte' } } },
      ]),
      ExamenHospitalisation.aggregate([
        { $match: { DatePres: { $gte: periodStart, $lte: periodEnd }, ...ligneMedecinFilter, ...hospitalisationServiceFilter } },
        { $group: { _id: '$Designationtypeacte', total: { $sum: 1 } } },
        { $sort: { total: -1 } },
      ]),
      Facturation.aggregate([
        { $match: { DateFacturation: { $gte: periodStart, $lte: periodEnd }, ...facturationMedecinFilter, ...facturationServiceFilter } },
        { $group: { _id: '$Designationtypeacte', montant: { $sum: { $ifNull: ['$Montanttotal', 0] } }, nombre: { $sum: 1 }, details: { $push: { date: '$DateFacturation', designation: '$Designationtypeacte', montant: '$Montanttotal', patient: '$PatientP', codeDossier: '$Code_dossier' } } } },
        { $sort: { _id: 1 } },
      ]),
      Consultation.aggregate([
        { $match: { Date_consulation: { $gte: periodStart, $lte: periodEnd }, statutPrescriptionMedecin: 3, ...medecinFilter, ...consultationServiceFilter } },
        { $group: { _id: '$designationC', montant: { $sum: { $ifNull: ['$montantapayer', 0] } }, nombre: { $sum: 1 }, details: { $push: { date: '$Date_consulation', designation: '$designationC', montant: '$montantapayer', patient: '$PatientP', codeDossier: '$Code_dossier', type: 'Consultation' } } } },
        { $sort: { _id: 1 } },
      ]),
      Consultation.aggregate([
        { $match: { Date_consulation: { $gte: periodStart, $lte: periodEnd }, ...medecinFilter, ...consultationServiceFilter } },
        { $group: { _id: '$IDMEDECIN', nombre: { $sum: 1 }, patients: { $addToSet: '$Code_dossier' }, details: { $push: { date: '$Date_consulation', codeDossier: '$Code_dossier', patient: '$PatientP', medecinId: '$IDMEDECIN' } } } },
      ]),
      Facturation.aggregate([
        { $match: { DateFacturation: { $gte: periodStart, $lte: periodEnd }, ...facturationMedecinFilter, ...facturationServiceFilter } },
        { $group: { _id: '$Assurance', montantExamens: { $sum: { $cond: [{ $ifNull: ['$idHospitalisation', false] }, { $ifNull: ['$Montanttotal', 0] }, 0] } }, montantConsultations: { $sum: { $cond: [{ $not: ['$idHospitalisation'] }, { $ifNull: ['$Montanttotal', 0] }, 0] } }, montantTotal: { $sum: { $ifNull: ['$Montanttotal', 0] } }, details: { $push: { date: '$DateFacturation', assurance: '$Assurance', designation: '$Designationtypeacte', montant: '$Montanttotal', patient: '$PatientP', type: '$typefacture' } } } },
        { $sort: { montantTotal: -1 } },
      ]),
      Consultation.aggregate([
        { $match: { Date_consulation: { $gte: periodStart, $lte: periodEnd }, statutPrescriptionMedecin: 3, ...medecinFilter, ...consultationServiceFilter } },
        { $group: { _id: '$assurance', montantConsultations: { $sum: { $ifNull: ['$montantapayer', 0] } }, montantTotal: { $sum: { $ifNull: ['$montantapayer', 0] } }, details: { $push: { date: '$Date_consulation', assurance: '$assurance', designation: '$designationC', montant: '$montantapayer', patient: '$PatientP', codeDossier: '$Code_dossier', type: 'Consultation' } } } },
        { $sort: { montantTotal: -1 } },
      ]),
      Consultation.aggregate([
        { $match: { Date_consulation: { $gte: periodStart, $lte: periodEnd }, Code_dossier: { $nin: ['', null] }, ...medecinFilter, ...consultationServiceFilter } },
        { $sort: { Date_consulation: 1 } },
        { $group: { _id: '$Code_dossier', date: { $first: '$Date_consulation' }, patient: { $first: '$PatientP' }, designation: { $first: '$designationC' } } },
        { $lookup: { from: Patient.collection.name, localField: '_id', foreignField: 'Code_dossier', as: 'patientInfo' } },
        { $unwind: { path: '$patientInfo', preserveNullAndEmptyArrays: true } },
        { $group: { _id: '$patientInfo.sexe', consultations: { $sum: 1 }, examens: { $sum: 0 }, details: { $push: { type: 'Consultation', date: '$date', patient: '$patient', sexe: '$patientInfo.sexe', designation: '$designation', codeDossier: '$_id' } } } },
      ]),
    ]);

    const previousByMedecin = new Map(consultationsParMedecinPrecedent.map((item) => [String(item._id), item.total]));
    const currentByMedecin = new Map(consultationsParMedecinActuel.map((item) => [String(item._id), item.total]));
    const previousByActe = new Map<string, number>();
    consultationsParActePrecedent.forEach((item) => previousByActe.set(String(item._id || 'Consultation'), item.total));
    prescriptionsParActePrecedent.forEach((item) => previousByActe.set(String(item._id || 'Prescription'), (previousByActe.get(String(item._id || 'Prescription')) || 0) + item.total));
    lignesParActePrecedent.forEach((item) => previousByActe.set(String(item._id || 'Acte médical'), (previousByActe.get(String(item._id || 'Acte médical')) || 0) + item.total));

    const progressionParMedecin = medecins.map((medecin: any) => {
      const actuel = currentByMedecin.get(String(medecin._id)) || 0;
      const precedent = previousByMedecin.get(String(medecin._id)) || 0;
      return {
        medecin: `${medecin.nom || ''} ${medecin.prenoms || ''}`.trim(),
        specialite: medecin.specialite || 'Non renseignée',
        actuel,
        precedent,
        objectif: Math.max(Math.ceil(actuel * 1.15), actuel + 10, 10),
      };
    });

    const patientsParMedecinMap = new Map(patientsParMedecin.map((item: any) => [String(item._id), item]));
    const patientsConsultesTousMedecins = medecins.map((medecin: any) => {
      const item = patientsParMedecinMap.get(String(medecin._id));
      return {
        medecin: `${medecin.nom || ''} ${medecin.prenoms || ''}`.trim(),
        nombre: item?.patients?.length || 0,
        totalConsultations: item?.nombre || 0,
        details: item?.details || [],
      };
    });

    const actesMap = new Map<string, number>();
    consultationsParActeActuel.forEach((item) => actesMap.set(String(item._id || 'Consultation'), item.total));
    prescriptionsParActeActuel.forEach((item) => actesMap.set(String(item._id || 'Prescription'), (actesMap.get(String(item._id || 'Prescription')) || 0) + item.total));
    lignesParActeActuel.forEach((item) => actesMap.set(String(item._id || 'Acte médical'), (actesMap.get(String(item._id || 'Acte médical')) || 0) + item.total));
    hospitalisationsParActeActuel.forEach((item) => actesMap.set(String(item._id || 'Hospitalisation'), (actesMap.get(String(item._id || 'Hospitalisation')) || 0) + item.total));

    const progressionParActe = Array.from(actesMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([acte, actuel]) => {
      const precedent = previousByActe.get(acte) || 0;
      return {
        acte,
        actuel,
        precedent,
        objectif: Math.max(Math.ceil(actuel * 1.15), actuel + 5, 5),
      };
    });

    const activiteHebdomadaire = await Promise.all(
      Array.from({ length: periodDays }).map(async (_, index) => {
        const day = startOfDay(addDays(periodStart, index));
        const dayEnd = endOfDay(day);
        const [consultations, rendezVous] = await Promise.all([
          Consultation.countDocuments({ ...medecinFilter, ...consultationServiceFilter, Date_consulation: { $gte: day, $lte: dayEnd } }),
          RendezVous.countDocuments({ ...rendezVousMedecinFilter, DatePlanning: { $gte: day, $lte: dayEnd }, PatientR: { $nin: ['', null] } }),
        ]);
        return {
          jour: day.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
          consultations,
          rendezVous,
        };
      })
    );

    const totalDossiers = consultationsJour || 1;
    const tauxCompletion = Math.round((patientsRecus / totalDossiers) * 100);
    const rendezVousTaux = rendezVousCurrent === 0 ? 0 : Math.round((rendezVousJour / rendezVousCurrent) * 100);
    const prescriptionsTaux = consultationsCurrent === 0 ? 0 : Math.round((prescriptionsCurrent / consultationsCurrent) * 100);
    const examensTaux = consultationsCurrent === 0 ? 0 : Math.round((examensCurrent / consultationsCurrent) * 100);
    const sexeMap = new Map<string, any>();
    examensConsultationsParSexe.flat().forEach((item: any) => {
      const sexe = String(item._id || 'Non renseigné');
      const current = sexeMap.get(sexe) || { sexe, consultations: 0, examens: 0, total: 0, details: [] };
      current.consultations += item.consultations || 0;
      current.examens += item.examens || 0;
      current.total = current.consultations + current.examens;
      current.details.push(...(item.details || []));
      sexeMap.set(sexe, current);
    });

    const montantActesMap = new Map<string, any>();
    [...actesExamensParMontant, ...consultationsParMontant].forEach((item: any) => {
      const designation = String(item._id || 'Non renseigné');
      const current = montantActesMap.get(designation) || { designation, montant: 0, nombre: 0, details: [] };
      current.montant += item.montant || 0;
      current.nombre += item.nombre || 0;
      current.details.push(...(item.details || []));
      montantActesMap.set(designation, current);
    });

    const montantAssuranceMap = new Map<string, any>();
    [...montantParAssurance, ...consultationsMontantParAssurance].forEach((item: any) => {
      const assurance = String(item._id || 'Non renseigné');
      const current = montantAssuranceMap.get(assurance) || { assurance, montantExamens: 0, montantConsultations: 0, montantTotal: 0, details: [] };
      current.montantExamens += item.montantExamens || 0;
      current.montantConsultations += item.montantConsultations || 0;
      current.montantTotal += item.montantTotal || 0;
      current.details.push(...(item.details || []));
      montantAssuranceMap.set(assurance, current);
    });

    return NextResponse.json({
      kpis: {
        consultationsJour,
        patientsEnAttente,
        patientsRecus,
        rendezVousJour,
        prescriptionsEmises,
        examensDemandes,
        tauxCompletion,
        tempsMoyenConsultation: 0,
      },
      tendances: {
        consultations: getVariation(consultationsCurrent, consultationsPrevious),
        rendezVous: getVariation(rendezVousCurrent, rendezVousPrevious),
        prescriptions: getVariation(prescriptionsCurrent, prescriptionsPrevious),
        examens: getVariation(examensCurrent, examensPrevious),
      },
      activiteHebdomadaire,
      repartitionActes: progressionParActe.map((item) => ({ type: item.acte, count: item.actuel })),
      performanceParService: [
        { service: 'Consultations', total: consultationsCurrent, taux: tauxCompletion, statut: getStatus(tauxCompletion) },
        { service: 'Rendez-vous honorés', total: rendezVousCurrent, taux: rendezVousTaux, statut: getStatus(rendezVousTaux) },
        { service: 'Prescriptions traitées', total: prescriptionsCurrent, taux: prescriptionsTaux, statut: getStatus(prescriptionsTaux) },
        { service: 'Examens demandés', total: examensCurrent, taux: examensTaux, statut: getStatus(examensTaux) },
      ],
      progressionParMedecin,
      progressionParActe,
      progressionIndicateurs: [
        { indicateur: 'Taux de complétion dossiers', actuel: tauxCompletion, precedent: consultationsPrevious === 0 ? 0 : Math.round((patientsRecus / consultationsPrevious) * 100), objectif: 95, unite: '%' },
        { indicateur: 'Patients reçus', actuel: patientsRecus, precedent: consultationsPrevious, objectif: Math.max(patientsRecus + 5, 10), unite: '' },
        { indicateur: 'Rendez-vous honorés', actuel: rendezVousJour, precedent: rendezVousPrevious, objectif: Math.max(rendezVousJour + 5, 10), unite: '' },
        { indicateur: 'Examens demandés', actuel: examensDemandes, precedent: examensPrevious, objectif: Math.max(examensDemandes + 5, 10), unite: '' },
      ],
      alertesMetier: [
        { libelle: 'Patients encore en attente', valeur: String(patientsEnAttente), niveau: patientsEnAttente > 0 ? 'warning' : 'success' },
        { libelle: "Dossiers complétés aujourd'hui", valeur: `${tauxCompletion}%`, niveau: tauxCompletion >= 85 ? 'success' : 'warning' },
        { libelle: 'Prescriptions émises', valeur: String(prescriptionsEmises), niveau: prescriptionsEmises > 0 ? 'info' : 'warning' },
        { libelle: 'Examens demandés', valeur: String(examensDemandes), niveau: examensDemandes > 0 ? 'info' : 'warning' },
      ],
      actesExamensParMontant: Array.from(montantActesMap.values()).sort((a, b) => b.montant - a.montant),
      patientsConsultesParMedecin: patientsConsultesTousMedecins,
      recapMontantParAssurance: Array.from(montantAssuranceMap.values()).sort((a, b) => b.montantTotal - a.montantTotal),
      examensConsultationsParSexe: Array.from(sexeMap.values()),
    });
  } catch (error) {
    console.error('Erreur statistiques médecin:', error);
    return NextResponse.json({ error: 'Erreur serveur lors du chargement des statistiques métier' }, { status: 500 });
  }
}
