import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { db } from '@/db/mongoConnect';
import { Consultation } from '@/models/consultation';
import { RendezVous } from '@/models/RendezVous';
import { Prescription } from '@/models/Prescription';
import { LignePrestation } from '@/models/lignePrestation';
import { Medecin } from '@/models/medecin';

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
    const medecinObjectId = toObjectId(medecinIdParam);

    const today = new Date();
    const todayStart = startOfDay(today);
    const todayEnd = endOfDay(today);
    const currentStart = startOfDay(addDays(today, -29));
    const previousStart = startOfDay(addDays(today, -59));
    const previousEnd = endOfDay(addDays(today, -30));

    const medecinFilter = medecinObjectId ? { IDMEDECIN: medecinObjectId } : {};
    const rendezVousMedecinFilter = medecinObjectId ? { IDMEDECIN: medecinObjectId } : {};
    const ligneMedecinFilter = medecinObjectId ? { idMedecin: medecinObjectId } : {};

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
    ] = await Promise.all([
      Consultation.countDocuments({ ...medecinFilter, Date_consulation: { $gte: todayStart, $lte: todayEnd } }),
      Consultation.countDocuments({ ...medecinFilter, Date_consulation: { $gte: todayStart, $lte: todayEnd }, attenteMedecin: 0 }),
      Consultation.countDocuments({ ...medecinFilter, Date_consulation: { $gte: todayStart, $lte: todayEnd }, attenteMedecin: 2 }),
      RendezVous.countDocuments({ ...rendezVousMedecinFilter, DatePlanning: { $gte: todayStart, $lte: todayEnd }, PatientR: { $nin: ['', null] } }),
      Prescription.countDocuments({ ...medecinFilter, DatePres: { $gte: todayStart, $lte: todayEnd } }),
      LignePrestation.countDocuments({ ...ligneMedecinFilter, dateLignePrestation: { $gte: todayStart, $lte: todayEnd } }),
      Consultation.countDocuments({ ...medecinFilter, Date_consulation: { $gte: currentStart, $lte: todayEnd } }),
      Consultation.countDocuments({ ...medecinFilter, Date_consulation: { $gte: previousStart, $lte: previousEnd } }),
      RendezVous.countDocuments({ ...rendezVousMedecinFilter, DatePlanning: { $gte: currentStart, $lte: todayEnd }, PatientR: { $nin: ['', null] } }),
      RendezVous.countDocuments({ ...rendezVousMedecinFilter, DatePlanning: { $gte: previousStart, $lte: previousEnd }, PatientR: { $nin: ['', null] } }),
      Prescription.countDocuments({ ...medecinFilter, DatePres: { $gte: currentStart, $lte: todayEnd } }),
      Prescription.countDocuments({ ...medecinFilter, DatePres: { $gte: previousStart, $lte: previousEnd } }),
      LignePrestation.countDocuments({ ...ligneMedecinFilter, dateLignePrestation: { $gte: currentStart, $lte: todayEnd } }),
      LignePrestation.countDocuments({ ...ligneMedecinFilter, dateLignePrestation: { $gte: previousStart, $lte: previousEnd } }),
      Medecin.find(medecinObjectId ? { _id: medecinObjectId } : {}).select('nom prenoms specialite').lean(),
      Consultation.aggregate([
        { $match: { Date_consulation: { $gte: currentStart, $lte: todayEnd }, ...(medecinObjectId ? { IDMEDECIN: medecinObjectId } : {}) } },
        { $group: { _id: '$IDMEDECIN', total: { $sum: 1 } } },
      ]),
      Consultation.aggregate([
        { $match: { Date_consulation: { $gte: previousStart, $lte: previousEnd }, ...(medecinObjectId ? { IDMEDECIN: medecinObjectId } : {}) } },
        { $group: { _id: '$IDMEDECIN', total: { $sum: 1 } } },
      ]),
      Consultation.aggregate([
        { $match: { Date_consulation: { $gte: currentStart, $lte: todayEnd }, ...(medecinObjectId ? { IDMEDECIN: medecinObjectId } : {}) } },
        { $group: { _id: '$designationC', total: { $sum: 1 } } },
        { $sort: { total: -1 } },
        { $limit: 8 },
      ]),
      Consultation.aggregate([
        { $match: { Date_consulation: { $gte: previousStart, $lte: previousEnd }, ...(medecinObjectId ? { IDMEDECIN: medecinObjectId } : {}) } },
        { $group: { _id: '$designationC', total: { $sum: 1 } } },
      ]),
      Prescription.aggregate([
        { $match: { DatePres: { $gte: currentStart, $lte: todayEnd }, ...(medecinObjectId ? { IDMEDECIN: medecinObjectId } : {}) } },
        { $group: { _id: '$Designation', total: { $sum: 1 } } },
        { $sort: { total: -1 } },
        { $limit: 8 },
      ]),
      Prescription.aggregate([
        { $match: { DatePres: { $gte: previousStart, $lte: previousEnd }, ...(medecinObjectId ? { IDMEDECIN: medecinObjectId } : {}) } },
        { $group: { _id: '$Designation', total: { $sum: 1 } } },
      ]),
      LignePrestation.aggregate([
        { $match: { dateLignePrestation: { $gte: currentStart, $lte: todayEnd }, ...(medecinObjectId ? { idMedecin: medecinObjectId } : {}) } },
        { $group: { _id: '$prestation', total: { $sum: '$qte' } } },
        { $sort: { total: -1 } },
        { $limit: 8 },
      ]),
      LignePrestation.aggregate([
        { $match: { dateLignePrestation: { $gte: previousStart, $lte: previousEnd }, ...(medecinObjectId ? { idMedecin: medecinObjectId } : {}) } },
        { $group: { _id: '$prestation', total: { $sum: '$qte' } } },
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
        medecin: `Dr ${medecin.nom || ''} ${medecin.prenoms || ''}`.trim(),
        specialite: medecin.specialite || 'Non renseignée',
        actuel,
        precedent,
        objectif: Math.max(Math.ceil(actuel * 1.15), actuel + 10, 10),
      };
    });

    const actesMap = new Map<string, number>();
    consultationsParActeActuel.forEach((item) => actesMap.set(String(item._id || 'Consultation'), item.total));
    prescriptionsParActeActuel.forEach((item) => actesMap.set(String(item._id || 'Prescription'), (actesMap.get(String(item._id || 'Prescription')) || 0) + item.total));
    lignesParActeActuel.forEach((item) => actesMap.set(String(item._id || 'Acte médical'), (actesMap.get(String(item._id || 'Acte médical')) || 0) + item.total));

    const progressionParActe = Array.from(actesMap.entries()).slice(0, 8).map(([acte, actuel]) => {
      const precedent = previousByActe.get(acte) || 0;
      return {
        acte,
        actuel,
        precedent,
        objectif: Math.max(Math.ceil(actuel * 1.15), actuel + 5, 5),
      };
    });

    const activiteHebdomadaire = await Promise.all(
      Array.from({ length: 7 }).map(async (_, index) => {
        const day = startOfDay(addDays(today, index - 6));
        const dayEnd = endOfDay(day);
        const [consultations, rendezVous] = await Promise.all([
          Consultation.countDocuments({ ...medecinFilter, Date_consulation: { $gte: day, $lte: dayEnd } }),
          RendezVous.countDocuments({ ...rendezVousMedecinFilter, DatePlanning: { $gte: day, $lte: dayEnd }, PatientR: { $nin: ['', null] } }),
        ]);
        return {
          jour: day.toLocaleDateString('fr-FR', { weekday: 'short' }),
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
    });
  } catch (error) {
    console.error('Erreur statistiques médecin:', error);
    return NextResponse.json({ error: 'Erreur serveur lors du chargement des statistiques métier' }, { status: 500 });
  }
}
