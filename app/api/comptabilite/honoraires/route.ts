import { NextRequest, NextResponse } from 'next/server';
import { withTenant } from '@/lib/withTenant';
import { getTenantModel } from '@/lib/tenantModels';
import { IHonoraireMed } from '@/models/HonoraireMed';
import { IHonorairePaye } from '@/models/HonorairePaye';
import { ILigneHonoraireMed } from '@/models/LigneHonoraireMed';
import { IMedecin } from '@/models/medecin';

const ROLES = ['admin', 'adminsuper', 'medecin', 'accueil', 'infirmier', 'comptable', 'facturation'];

export async function GET(request: NextRequest) {
  const { context, response: tenantErrorResponse } = await withTenant(request, ROLES);
  if (!context) return tenantErrorResponse;
  const { connection } = context;
  const HonoraireMed = getTenantModel<IHonoraireMed>(connection, 'HonoraireMed');
  const HonorairePaye = getTenantModel<IHonorairePaye>(connection, 'HonorairePaye');
  const LigneHonoraireMed = getTenantModel<ILigneHonoraireMed>(connection, 'LigneHonoraireMed');
  const Medecin = getTenantModel<IMedecin>(connection, 'Medecin');

  try {
    const { searchParams } = new URL(request.url);
    const dateDebut = searchParams.get('dateDebut');
    const dateFin = searchParams.get('dateFin');
    const medecinId = searchParams.get('medecinId') || '';
    const entrepriseId = searchParams.get('entrepriseId') || '';
    const action = searchParams.get('action') || 'liste';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, parseInt(searchParams.get('limit') || '1000', 10));

    const filtreEntreprise = entrepriseId ? { entrepriseId } : {};

    if (action === 'medecins') {
      const medecins = await Medecin.find({ ...filtreEntreprise }).lean();
      return NextResponse.json({ success: true, data: medecins });
    }

    const filtreDate: any = {};
    if (dateDebut && dateFin) {
      const debutDate = new Date(dateDebut);
      const finDate = new Date(dateFin);
      finDate.setHours(23, 59, 59, 999);
      filtreDate.date = { $gte: debutDate, $lte: finDate };
    }

    const filtreMedecin = medecinId ? { Medecin: medecinId } : {};

    const honoraires = await HonoraireMed.find({
      ...filtreDate,
      ...filtreMedecin,
      ...filtreEntreprise,
    })
      .populate('Medecin', 'nom prenoms specialite TauxHonoraire TauxPrescription TauxExecution TauxAideOperatoire TauxAnesthesiste')
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const total = await HonoraireMed.countDocuments({
      ...filtreDate,
      ...filtreMedecin,
      ...filtreEntreprise,
    });

    const honoraireIds = honoraires.map(h => h._id);

    const [lignes, paiements] = await Promise.all([
      LigneHonoraireMed.find({ HonoraireMed: { $in: honoraireIds } }).lean(),
      HonorairePaye.find({ HonoraireMed: { $in: honoraireIds } }).lean(),
    ]);

    const lignesParHonoraire = new Map<string, any[]>();
    for (const l of lignes) {
      const cle = String(l.HonoraireMed);
      if (!lignesParHonoraire.has(cle)) lignesParHonoraire.set(cle, []);
      lignesParHonoraire.get(cle)!.push(l);
    }

    const paiementsParHonoraire = new Map<string, any[]>();
    for (const p of paiements) {
      const cle = String(p.HonoraireMed);
      if (!paiementsParHonoraire.has(cle)) paiementsParHonoraire.set(cle, []);
      paiementsParHonoraire.get(cle)!.push(p);
    }

    const data = honoraires.map(h => {
      const id = String(h._id);
      const lignesH = lignesParHonoraire.get(id) || [];
      const paiementsH = paiementsParHonoraire.get(id) || [];
      const totalPaye = paiementsH.reduce((s, p) => s + (p.MontantPayé || 0), 0);
      return {
        ...h,
        lignes: lignesH,
        paiements: paiementsH,
        totalPaye,
        resteAPayer: (h.Totalnetapayer || 0) - totalPaye,
      };
    });

    const totaux = {
      totalHonoraires: data.reduce((s, h) => s + (h.montanttotalhono || 0), 0),
      totalPrescription: data.reduce((s, h) => s + (h.montanttaotalPrescrip || 0), 0),
      totalExecutant: data.reduce((s, h) => s + (h.MontanttotalExeut || 0), 0),
      totalNetAPayer: data.reduce((s, h) => s + (h.Totalnetapayer || 0), 0),
      totalPaye: data.reduce((s, h) => s + (h.totalPaye || 0), 0),
      totalReste: data.reduce((s, h) => s + (h.resteAPayer || 0), 0),
    };

    return NextResponse.json({ success: true, data, totaux, count: data.length, total, page, limit });
  } catch (error) {
    console.error('Erreur honoraires:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur', error: error instanceof Error ? error.message : 'Erreur' },
      { status: 500 }
    );
  }
}


