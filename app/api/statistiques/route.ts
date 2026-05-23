import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { db } from '@/db/mongoConnect';
import { Consultation } from '@/models/consultation';
import { Facturation } from '@/models/Facturation';
import { LignePrestation } from '@/models/lignePrestation';
import { RendezVous } from '@/models/RendezVous';
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

export async function GET(request: NextRequest) {
  try {
    await db();

    const { searchParams } = new URL(request.url);
    const today = new Date();
    const dateDebutParam = searchParams.get('dateDebut');
    const dateFinParam = searchParams.get('dateFin');
    const medecinObjectId = toObjectId(searchParams.get('medecinId'));
    const service = searchParams.get('service');
    const typeExamen = searchParams.get('typeExamen');
    const periodStart = dateDebutParam ? startOfDay(new Date(dateDebutParam)) : startOfDay(addDays(today, -29));
    const periodEnd = dateFinParam ? endOfDay(new Date(dateFinParam)) : endOfDay(today);
    const periodDays = Math.max(1, Math.ceil((periodEnd.getTime() - periodStart.getTime()) / (24 * 60 * 60 * 1000)) + 1);
    const medecinConsultationFilter = medecinObjectId ? { IDMEDECIN: medecinObjectId } : {};
    const medecinLigneFilter = medecinObjectId ? { idMedecin: medecinObjectId } : {};
    const medecinFacturationFilter = medecinObjectId ? { IDMEDECIN: medecinObjectId } : {};
    const prestationFilter = typeExamen ? { prestation: { $regex: typeExamen, $options: 'i' } } : {};
    const designationFilter = service ? { Designationtypeacte: { $regex: service, $options: 'i' } } : {};

    const [
      consultations,
      patientsDistincts,
      prescriptionsBioTotal,
      medecins,
      montantTotal,
      montantConsultationsPayees,
      hospitalisationsTotal,
      classementActes,
      prescriptionParMedecin,
      resultatInterneExterne,
      examenParSexe,
      montantActes,
      montantConsultationsActes,
      patientsParMedecin,
      repartitionHommeFemme,
      hospitalisations,
    ] = await Promise.all([
      Consultation.countDocuments({ ...medecinConsultationFilter, Date_consulation: { $gte: periodStart, $lte: periodEnd } }),
      Consultation.distinct('Code_dossier', { ...medecinConsultationFilter, Date_consulation: { $gte: periodStart, $lte: periodEnd } }),
      LignePrestation.aggregate([
        { $match: { ...prestationFilter, dateLignePrestation: { $gte: periodStart, $lte: periodEnd }, lettreCle: 'B' } },
        { $group: { _id: null, total: { $sum: '$qte' } } },
      ]),
      Medecin.find({}).select('nom prenoms').lean(),
      Facturation.aggregate([
        { $match: { ...medecinFacturationFilter, ...designationFilter, DateFacturation: { $gte: periodStart, $lte: periodEnd } } },
        { $group: { _id: null, total: { $sum: { $ifNull: ['$Montanttotal', 0] } } } },
      ]),
      Consultation.aggregate([
        { $match: { ...medecinConsultationFilter, Date_consulation: { $gte: periodStart, $lte: periodEnd }, statutPrescriptionMedecin: 3, ...(service ? { designationC: { $regex: service, $options: 'i' } } : {}) } },
        { $group: { _id: null, total: { $sum: { $ifNull: ['$montantapayer', 0] } } } },
      ]),
      Facturation.countDocuments({ ...medecinFacturationFilter, DateFacturation: { $gte: periodStart, $lte: periodEnd }, idHospitalisation: { $nin: [null, ''] } }),
      LignePrestation.aggregate([
        { $match: { ...medecinLigneFilter, ...prestationFilter, dateLignePrestation: { $gte: periodStart, $lte: periodEnd } } },
        { $group: { _id: '$prestation', total: { $sum: '$qte' }, details: { $push: { date: '$dateLignePrestation', prestation: '$prestation', patient: '$nomPatient', sexe: '$sexe', montant: '$montantTotalAPayer' } } } },
        { $sort: { total: -1 } },
        { $limit: 10 },
        { $project: { _id: 0, acte: { $ifNull: ['$_id', 'Non renseigné'] }, total: { $ifNull: ['$total', 0] }, details: 1 } },
      ]),
      LignePrestation.aggregate([
        { $match: { ...prestationFilter, dateLignePrestation: { $gte: periodStart, $lte: periodEnd }, lettreCle: 'B' } },
        { $group: { _id: '$idMedecin', total: { $sum: '$qte' }, femmes: { $sum: { $cond: [{ $eq: ['$sexe', 'F'] }, '$qte', 0] } }, hommes: { $sum: { $cond: [{ $eq: ['$sexe', 'M'] }, '$qte', 0] } }, details: { $push: { date: '$dateLignePrestation', prestation: '$prestation', patient: '$nomPatient', sexe: '$sexe', montant: '$montantTotalAPayer', medecin: '$medecinPrescripteur' } } } },
        { $sort: { total: -1 } },
      ]),
      Facturation.aggregate([
        { $match: { ...medecinFacturationFilter, ...designationFilter, DateFacturation: { $gte: periodStart, $lte: periodEnd } } },
        { $group: { _id: '$Externe_Interne', total: { $sum: 1 }, details: { $push: { date: '$DateFacturation', patient: '$PatientP', designation: '$Designationtypeacte', montant: '$Montanttotal', type: '$Externe_Interne' } } } },
        { $project: { _id: 0, type: { $ifNull: ['$_id', 'Non renseigné'] }, total: 1, details: 1 } },
      ]),
      LignePrestation.aggregate([
        { $match: { ...medecinLigneFilter, ...prestationFilter, dateLignePrestation: { $gte: periodStart, $lte: periodEnd } } },
        { $group: { _id: '$sexe', total: { $sum: '$qte' }, details: { $push: { date: '$dateLignePrestation', patient: '$nomPatient', sexe: '$sexe', prestation: '$prestation', montant: '$montantTotalAPayer' } } } },
        { $project: { _id: 0, sexe: { $ifNull: ['$_id', 'Non renseigné'] }, total: { $ifNull: ['$total', 0] }, details: 1 } },
      ]),
      Facturation.aggregate([
        { $match: { ...medecinFacturationFilter, ...designationFilter, DateFacturation: { $gte: periodStart, $lte: periodEnd } } },
        { $group: { _id: '$Designationtypeacte', montant: { $sum: { $ifNull: ['$Montanttotal', 0] } }, nombre: { $sum: 1 }, details: { $push: { date: '$DateFacturation', patient: '$PatientP', designation: '$Designationtypeacte', montant: '$Montanttotal', codeDossier: '$Code_dossier' } } } },
        { $sort: { montant: -1 } },
        { $limit: 10 },
        { $project: { _id: 0, acte: { $ifNull: ['$_id', 'Non renseigné'] }, montant: { $ifNull: ['$montant', 0] }, nombre: 1, details: 1 } },
      ]),
      Consultation.aggregate([
        { $match: { ...medecinConsultationFilter, Date_consulation: { $gte: periodStart, $lte: periodEnd }, statutPrescriptionMedecin: 3, ...(service ? { designationC: { $regex: service, $options: 'i' } } : {}) } },
        { $group: { _id: '$designationC', montant: { $sum: { $ifNull: ['$montantapayer', 0] } }, nombre: { $sum: 1 }, details: { $push: { date: '$Date_consulation', patient: '$PatientP', designation: '$designationC', montant: '$montantapayer', codeDossier: '$Code_dossier', type: 'Consultation' } } } },
        { $project: { _id: 0, acte: { $ifNull: ['$_id', 'Non renseigné'] }, montant: { $ifNull: ['$montant', 0] }, nombre: 1, details: 1 } },
      ]),
      Consultation.aggregate([
        { $match: { ...medecinConsultationFilter, Date_consulation: { $gte: periodStart, $lte: periodEnd } } },
        { $group: { _id: '$IDMEDECIN', consultations: { $sum: 1 }, patientsSet: { $addToSet: '$Code_dossier' }, details: { $push: { date: '$Date_consulation', patient: '$PatientP', codeDossier: '$Code_dossier', designation: '$designationC' } } } },
        { $lookup: { from: 'medecins', localField: '_id', foreignField: '_id', as: 'medecin' } },
        { $unwind: { path: '$medecin', preserveNullAndEmptyArrays: true } },
        { $project: { _id: 0, medecin: { $concat: [{ $ifNull: ['$medecin.nom', 'Médecin'] }, ' ', { $ifNull: ['$medecin.prenoms', ''] }] }, consultations: 1, patients: { $size: '$patientsSet' }, details: 1 } },
        { $sort: { patients: -1 } },
      ]),
      Consultation.aggregate([
        { $match: { ...medecinConsultationFilter, Date_consulation: { $gte: periodStart, $lte: periodEnd } } },
        { $lookup: { from: 'patients', localField: 'IdPatient', foreignField: '_id', as: 'patient' } },
        { $unwind: { path: '$patient', preserveNullAndEmptyArrays: true } },
        { $group: { _id: '$patient.sexe', total: { $sum: 1 }, details: { $push: { date: '$Date_consulation', patient: '$PatientP', sexe: '$patient.sexe', designation: '$designationC' } } } },
        { $project: { _id: 0, sexe: { $ifNull: ['$_id', 'Non renseigné'] }, total: 1, details: 1 } },
      ]),
      Facturation.aggregate([
        { $match: { ...medecinFacturationFilter, DateFacturation: { $gte: periodStart, $lte: periodEnd }, idHospitalisation: { $nin: [null, ''] } } },
        { $group: { _id: '$StatutFacture', total: { $sum: 1 }, montant: { $sum: { $ifNull: ['$Montanttotal', 0] } }, details: { $push: { date: '$DateFacturation', patient: '$PatientP', designation: '$Designationtypeacte', montant: '$Montanttotal', statut: '$StatutFacture' } } } },
        { $project: { _id: 0, statut: { $cond: [{ $eq: ['$_id', true] }, 'Facturé', 'Non facturé'] }, total: 1, montant: 1, details: 1 } },
      ]),
    ]);

    const evolutionConsultations = await Promise.all(
      Array.from({ length: periodDays }).map(async (_, index) => {
        const day = startOfDay(addDays(periodStart, index));
        const dayEnd = endOfDay(day);
        const [consultationsCount, rendezVousCount] = await Promise.all([
          Consultation.countDocuments({ ...medecinConsultationFilter, Date_consulation: { $gte: day, $lte: dayEnd } }),
          RendezVous.countDocuments({ IDMEDECIN: medecinObjectId || { $exists: true }, DatePlanning: { $gte: day, $lte: dayEnd }, PatientR: { $nin: ['', null] } }),
        ]);

        return {
          date: day.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
          consultations: consultationsCount,
          rendezVous: rendezVousCount,
        };
      })
    );

    const montantActesMap = new Map<string, any>();
    [...montantActes, ...montantConsultationsActes].forEach((item: any) => {
      const acte = String(item.acte || 'Non renseigné');
      const current = montantActesMap.get(acte) || { acte, montant: 0, nombre: 0, details: [] };
      current.montant += item.montant || 0;
      current.nombre += item.nombre || 0;
      current.details.push(...(item.details || []));
      montantActesMap.set(acte, current);
    });

    const montantActesFusionnes = Array.from(montantActesMap.values()).sort((a, b) => b.montant - a.montant);
    const montantTotalGlobal = (montantTotal[0]?.total || 0) + (montantConsultationsPayees[0]?.total || 0);
    const prescriptionParMedecinMap = new Map(prescriptionParMedecin.map((item: any) => [String(item._id), item]));
    const prescriptionsBiologiquesTousMedecins = medecins.map((medecin: any) => {
      const item = prescriptionParMedecinMap.get(String(medecin._id));
      return {
        medecin: `${medecin.nom || ''} ${medecin.prenoms || ''}`.trim(),
        total: item?.total || 0,
        femmes: item?.femmes || 0,
        hommes: item?.hommes || 0,
        details: item?.details || [],
      };
    });

    return NextResponse.json({
      periode: {
        dateDebut: periodStart,
        dateFin: periodEnd,
      },
      kpis: {
        consultations,
        patients: patientsDistincts.length,
        prescriptionsBiologiques: prescriptionsBioTotal[0]?.total || 0,
        montantTotal: montantTotalGlobal,
        hospitalisations: hospitalisationsTotal,
      },
      classementActes,
      prescriptionParMedecin: prescriptionsBiologiquesTousMedecins,
      resultatInterneExterne,
      examenParSexe,
      montantActes: montantActesFusionnes,
      patientsParMedecin,
      evolutionConsultations,
      repartitionHommeFemme,
      hospitalisations,
    });
  } catch (error) {
    console.error('Erreur API statistiques:', error);
    return NextResponse.json({ error: 'Erreur serveur lors du chargement des statistiques' }, { status: 500 });
  }
}
