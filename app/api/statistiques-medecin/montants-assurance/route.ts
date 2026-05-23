import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { db } from '@/db/mongoConnect';
import { Facturation } from '@/models/Facturation';
import { Consultation } from '@/models/consultation';
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

const resolveMedecinObjectId = async (searchParams: URLSearchParams) => {
  const medecinIdParam = searchParams.get('medecinId');
  const profilIdParam = searchParams.get('profilId');
  const profilNom = searchParams.get('nom');
  const profilPrenom = searchParams.get('prenom');
  let medecinObjectId = toObjectId(medecinIdParam);

  if (!medecinObjectId && profilIdParam) {
    const profilObjectId = toObjectId(profilIdParam);
    const connectedMedecin = await Medecin.findOne({
      $or: [
        ...(profilObjectId ? [{ _id: profilObjectId }, { userId: profilObjectId }] : []),
        ...(profilNom && profilPrenom ? [{ nom: profilNom, prenoms: profilPrenom }] : []),
      ],
    }).select('_id').lean();

    if (connectedMedecin?._id) {
      medecinObjectId = new mongoose.Types.ObjectId(String(connectedMedecin._id));
    }
  }

  return medecinObjectId;
};

export async function GET(request: NextRequest) {
  try {
    await db();

    const { searchParams } = new URL(request.url);
    const dateDebutParam = searchParams.get('dateDebut');
    const dateFinParam = searchParams.get('dateFin');
    const today = new Date();
    const periodStart = dateDebutParam ? startOfDay(new Date(dateDebutParam)) : startOfDay(addDays(today, -29));
    const periodEnd = dateFinParam ? endOfDay(new Date(dateFinParam)) : endOfDay(today);
    const medecinObjectId = await resolveMedecinObjectId(searchParams);
    const facturationMedecinFilter = medecinObjectId ? { IDMEDECIN: medecinObjectId } : {};
    const consultationMedecinFilter = medecinObjectId ? { IDMEDECIN: medecinObjectId } : {};

    const [facturations, consultationsPayees] = await Promise.all([
      Facturation.aggregate([
        { $match: { DateFacturation: { $gte: periodStart, $lte: periodEnd }, ...facturationMedecinFilter } },
        {
          $group: {
            _id: '$Assurance',
            montantExamens: {
              $sum: {
                $cond: [{ $ifNull: ['$idHospitalisation', false] }, { $ifNull: ['$Montanttotal', 0] }, 0],
              },
            },
            montantConsultations: {
              $sum: {
                $cond: [{ $not: ['$idHospitalisation'] }, { $ifNull: ['$Montanttotal', 0] }, 0],
              },
            },
            montantTotal: { $sum: { $ifNull: ['$Montanttotal', 0] } },
            nombreFactures: { $sum: 1 },
            details: {
              $push: {
                date: '$DateFacturation',
                assurance: '$Assurance',
                designation: '$Designationtypeacte',
                montant: '$Montanttotal',
                patient: '$PatientP',
                codeDossier: '$Code_dossier',
                type: '$typefacture',
              },
            },
          },
        },
        { $sort: { montantTotal: -1 } },
        {
          $project: {
            _id: 0,
            assurance: { $ifNull: ['$_id', 'Non renseigné'] },
            montantExamens: { $ifNull: ['$montantExamens', 0] },
            montantConsultations: { $ifNull: ['$montantConsultations', 0] },
            montantTotal: { $ifNull: ['$montantTotal', 0] },
            nombreFactures: 1,
            details: 1,
          },
        },
      ]),
      Consultation.aggregate([
        { $match: { Date_consulation: { $gte: periodStart, $lte: periodEnd }, statutPrescriptionMedecin: 3, ...consultationMedecinFilter } },
        {
          $group: {
            _id: '$assurance',
            montantExamens: { $sum: 0 },
            montantConsultations: { $sum: { $ifNull: ['$montantapayer', 0] } },
            montantTotal: { $sum: { $ifNull: ['$montantapayer', 0] } },
            nombreFactures: { $sum: 1 },
            details: {
              $push: {
                date: '$Date_consulation',
                assurance: '$assurance',
                designation: '$designationC',
                montant: '$montantapayer',
                patient: '$PatientP',
                codeDossier: '$Code_dossier',
                type: 'Consultation',
              },
            },
          },
        },
      ]),
    ]);

    const dataMap = new Map<string, any>();
    [...facturations, ...consultationsPayees].forEach((item: any) => {
      const assurance = String(item.assurance || item._id || 'Non renseigné');
      const current = dataMap.get(assurance) || { assurance, montantExamens: 0, montantConsultations: 0, montantTotal: 0, nombreFactures: 0, details: [] };
      current.montantExamens += item.montantExamens || 0;
      current.montantConsultations += item.montantConsultations || 0;
      current.montantTotal += item.montantTotal || 0;
      current.nombreFactures += item.nombreFactures || 0;
      current.details.push(...(item.details || []));
      dataMap.set(assurance, current);
    });

    const data = Array.from(dataMap.values()).sort((a, b) => b.montantTotal - a.montantTotal);

    return NextResponse.json({ dateDebut: periodStart, dateFin: periodEnd, data });
  } catch (error) {
    console.error('Erreur montants par assurance:', error);
    return NextResponse.json({ error: 'Erreur serveur lors du chargement des montants par assurance' }, { status: 500 });
  }
}
