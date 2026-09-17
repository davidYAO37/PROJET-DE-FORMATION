import { NextRequest, NextResponse } from 'next/server';
import { withTenant } from '@/lib/withTenant';
import { getTenantModel } from '@/lib/tenantModels';
import { IExamenHospitalisation } from '@/models/examenHospit';
import { ILignePrestation } from '@/models/lignePrestation';
import { IResultatLignePrestation } from '@/models/resultatLignePrestation';

const READ_ROLES = ['admin', 'biologiste', 'technicienlabo', 'medecin', 'accueil', 'comptable'];
const DAY = 24 * 60 * 60 * 1000;
const startOfDay = (date: Date) => { const value = new Date(date); value.setHours(0, 0, 0, 0); return value; };
const endOfDay = (date: Date) => { const value = new Date(date); value.setHours(23, 59, 59, 999); return value; };
const addDays = (date: Date, days: number) => { const value = new Date(date); value.setDate(value.getDate() + days); return value; };

export async function GET(req: NextRequest) {
  const { context, response } = await withTenant(req, READ_ROLES);
  if (!context) return response;

  const ExamenHospitalisation = getTenantModel<IExamenHospitalisation>(context.connection, 'ExamenHospitalisation');
  const LignePrestation = getTenantModel<ILignePrestation>(context.connection, 'LignePrestation');
  const ResultatLignePrestation = getTenantModel<IResultatLignePrestation>(context.connection, 'ResultatLignePrestation');

  try {
    const { searchParams } = new URL(req.url);
    const now = new Date();
    const dateDebut = searchParams.get('dateDebut');
    const dateFin = searchParams.get('dateFin');
    const periodStart = dateDebut ? startOfDay(new Date(`${dateDebut}T00:00:00`)) : startOfDay(new Date(now.getFullYear(), now.getMonth(), 1));
    const periodEnd = dateFin ? endOfDay(new Date(`${dateFin}T00:00:00`)) : endOfDay(now);
    if (Number.isNaN(periodStart.getTime()) || Number.isNaN(periodEnd.getTime()) || periodStart > periodEnd) {
      return NextResponse.json({ error: 'Période invalide' }, { status: 400 });
    }

    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const monthStart = startOfDay(new Date(now.getFullYear(), now.getMonth(), 1));
    const monthEnd = endOfDay(new Date(now.getFullYear(), now.getMonth() + 1, 0));
    const baseFilter = { Designationtypeacte: 'EXAMEN BIOLOGIQUE' };
    const periodPrescription = { ...baseFilter, DatePres: { $gte: periodStart, $lte: periodEnd } };
    const detailProjection = {
      _id: 1, PatientP: 1, Code_dossier: 1, NomMed: 1, CodePrestation: 1, DatePres: 1,
      DATERECEPTIONNER: 1, DateValidation: 1, dateretour: 1, StatutLaboratoire: 1, Biologiste: 1
    };

    const [
      aReceptionner, aSaisir, retours, valides, totalJour, totalMois, totalPeriode,
      parStatusRaw, parMois, parJour, parMedecin, parType, resultatsSaisis
    ] = await Promise.all([
      ExamenHospitalisation.find({ ...baseFilter, StatutLaboratoire: 1, DatePres: { $gte: periodStart, $lte: periodEnd } }, detailProjection).sort({ DatePres: -1 }).lean(),
      ExamenHospitalisation.find({ ...baseFilter, StatutLaboratoire: 2, DATERECEPTIONNER: { $gte: periodStart, $lte: periodEnd } }, detailProjection).sort({ DATERECEPTIONNER: -1 }).lean(),
      ExamenHospitalisation.find({ ...baseFilter, StatutLaboratoire: 5, dateretour: { $gte: periodStart, $lte: periodEnd } }, detailProjection).sort({ dateretour: -1 }).lean(),
      ExamenHospitalisation.find({ ...baseFilter, StatutLaboratoire: 4, DateValidation: { $gte: periodStart, $lte: periodEnd } }, detailProjection).sort({ DateValidation: -1 }).lean(),
      ExamenHospitalisation.countDocuments({ ...baseFilter, DatePres: { $gte: todayStart, $lte: todayEnd } }),
      ExamenHospitalisation.countDocuments({ ...baseFilter, DatePres: { $gte: monthStart, $lte: monthEnd } }),
      ExamenHospitalisation.countDocuments(periodPrescription),
      ExamenHospitalisation.aggregate([
        { $match: periodPrescription },
        { $group: { _id: '$StatutLaboratoire', value: { $sum: 1 } } }
      ]),
      ExamenHospitalisation.aggregate([
        { $match: periodPrescription },
        { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$DatePres' } }, total: { $sum: 1 }, valides: { $sum: { $cond: [{ $eq: ['$StatutLaboratoire', 4] }, 1, 0] } }, retours: { $sum: { $cond: [{ $eq: ['$StatutLaboratoire', 5] }, 1, 0] } } } },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, mois: '$_id', total: 1, valides: 1, retours: 1 } }
      ]),
      ExamenHospitalisation.aggregate([
        { $match: periodPrescription },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$DatePres' } }, total: { $sum: 1 }, aReceptionner: { $sum: { $cond: [{ $eq: ['$StatutLaboratoire', 1] }, 1, 0] } }, aSaisir: { $sum: { $cond: [{ $eq: ['$StatutLaboratoire', 2] }, 1, 0] } } } },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, jour: '$_id', total: 1, aReceptionner: 1, aSaisir: 1 } }
      ]),
      ExamenHospitalisation.aggregate([
        { $match: periodPrescription },
        { $group: { _id: { id: '$idMedecin', nom: { $ifNull: ['$NomMed', 'Non renseigné'] } }, total: { $sum: 1 }, valides: { $sum: { $cond: [{ $eq: ['$StatutLaboratoire', 4] }, 1, 0] } } } },
        { $sort: { total: -1 } }, { $limit: 10 },
        { $project: { _id: 0, medecinId: { $toString: { $ifNull: ['$_id.id', ''] } }, nom: '$_id.nom', total: 1, valides: 1 } }
      ]),
      LignePrestation.aggregate([
        { $match: { lettreCle: 'B', dateLignePrestation: { $gte: periodStart, $lte: periodEnd } } },
        { $group: { _id: { $ifNull: ['$prestation', { $ifNull: ['$familleActe', 'Non renseigné'] }] }, total: { $sum: { $ifNull: ['$qte', 1] } } } },
        { $sort: { total: -1 } }, { $limit: 10 },
        { $project: { _id: 0, type: '$_id', total: 1 } }
      ]),
      ResultatLignePrestation.countDocuments({ dateSaisieResultat: { $gte: periodStart, $lte: periodEnd } })
    ]);

    const statusConfig = [
      { status: 1, label: 'À réceptionner', color: '#ffc107' },
      { status: 2, label: 'À saisir', color: '#0dcaf0' },
      { status: 4, label: 'Validés', color: '#198754' },
      { status: 5, label: 'Retours résultats', color: '#6f42c1' }
    ];
    const parStatus = statusConfig.map(item => ({ ...item, value: parStatusRaw.find(({ _id }) => _id === item.status)?.value || 0 }));
    const maxDays = Math.min(31, Math.floor((periodEnd.getTime() - periodStart.getTime()) / DAY) + 1);
    const dailyMap = new Map(parJour.map(item => [item.jour, item]));
    const completeParJour = Array.from({ length: maxDays }, (_, index) => {
      const jour = addDays(periodStart, index).toISOString().slice(0, 10);
      return dailyMap.get(jour) || { jour, total: 0, aReceptionner: 0, aSaisir: 0 };
    });
    const formatDetails = (items: any[]) => items.map(item => ({
      id: String(item._id), patient: item.PatientP || '-', codeDossier: item.Code_dossier || '-', medecin: item.NomMed || '-',
      examen: item.CodePrestation || '-', date: item.DatePres || item.DATERECEPTIONNER || item.DateValidation || item.dateretour || null,
      statut: item.StatutLaboratoire || 0, biologiste: item.Biologiste || '-'
    }));

    return NextResponse.json({
      periode: { dateDebut: periodStart, dateFin: periodEnd },
      totals: {
        aReceptionner: aReceptionner.length, aSaisir: aSaisir.length, retours: retours.length,
        valides: valides.length, totalJour, totalMois, totalPeriode, resultatsSaisis
      },
      parStatus,
      parMois,
      parJour: completeParJour,
      parMedecin,
      parType,
      details: {
        aReceptionner: formatDetails(aReceptionner), aSaisir: formatDetails(aSaisir),
        retours: formatDetails(retours), valides: formatDetails(valides)
      }
    });
  } catch (error) {
    console.error('Erreur statistiques laboratoire:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
