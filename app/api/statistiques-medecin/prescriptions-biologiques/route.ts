import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { db } from '@/db/mongoConnect';
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
    const ligneMedecinFilter = medecinObjectId ? { idMedecin: medecinObjectId } : {};

    const [medecins, prescriptions] = await Promise.all([
      Medecin.find(medecinObjectId ? { _id: medecinObjectId } : {}).select('nom prenoms').lean(),
      LignePrestation.aggregate([
      {
        $match: {
          dateLignePrestation: { $gte: periodStart, $lte: periodEnd },
          lettreCle: 'B',
          ...ligneMedecinFilter,
        },
      },
      {
        $group: {
          _id: '$idMedecin',
          total: { $sum: '$qte' },
          femmes: { $sum: { $cond: [{ $eq: ['$sexe', 'F'] }, '$qte', 0] } },
          hommes: { $sum: { $cond: [{ $eq: ['$sexe', 'M'] }, '$qte', 0] } },
          montantTotal: { $sum: { $ifNull: ['$montantTotalAPayer', 0] } },
          details: {
            $push: {
              date: '$dateLignePrestation',
              prestation: '$prestation',
              sexe: '$sexe',
              patient: '$nomPatient',
              montant: '$montantTotalAPayer',
              medecinPrescripteur: '$medecinPrescripteur',
            },
          },
        },
      },
      { $sort: { total: -1 } },
      ]),
    ]);

    const prescriptionsMap = new Map(prescriptions.map((item: any) => [String(item._id), item]));
    const data = medecins.map((medecin: any) => {
      const item = prescriptionsMap.get(String(medecin._id));
      return {
        medecinId: medecin._id,
        medecin: `${medecin.nom || ''} ${medecin.prenoms || ''}`.trim(),
        total: item?.total || 0,
        femmes: item?.femmes || 0,
        hommes: item?.hommes || 0,
        montantTotal: item?.montantTotal || 0,
        details: item?.details || [],
      };
    });

    return NextResponse.json({ dateDebut: periodStart, dateFin: periodEnd, data });
  } catch (error) {
    console.error('Erreur prescriptions biologiques:', error);
    return NextResponse.json({ error: 'Erreur serveur lors du chargement des prescriptions biologiques' }, { status: 500 });
  }
}
