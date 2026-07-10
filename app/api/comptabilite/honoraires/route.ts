import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/mongoConnect';
import { HonraireMed } from '@/models/HonoraireMed';
import { HonorairePaye } from '@/models/HonorairePaye';
import { LigneHonoraireMed } from '@/models/LigneHonoraireMed';
import { Medecin } from '@/models/medecin';

export async function GET(request: NextRequest) {
  try {
    await db();

    const { searchParams } = new URL(request.url);
    const dateDebut = searchParams.get('dateDebut');
    const dateFin = searchParams.get('dateFin');
    const medecinId = searchParams.get('medecinId') || '';
    const entrepriseId = searchParams.get('entrepriseId') || '';
    const action = searchParams.get('action') || 'liste';

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

    const honoraires = await HonraireMed.find({
      ...filtreDate,
      ...filtreMedecin,
      ...filtreEntreprise,
    })
      .populate('Medecin', 'nom prenoms specialite')
      .lean();

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

    return NextResponse.json({ success: true, data, totaux, count: data.length });
  } catch (error) {
    console.error('Erreur honoraires:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur', error: error instanceof Error ? error.message : 'Erreur' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await db();
    const body = await request.json();
    const { action } = body;

    if (action === 'payer') {
      const { honoraireId, montant, modePaiement, banque, numeroCheque, payePar, entrepriseId } = body;
      if (!honoraireId || !montant) {
        return NextResponse.json({ success: false, message: 'Données manquantes' }, { status: 400 });
      }
      const honoraire = await HonraireMed.findById(honoraireId);
      if (!honoraire) {
        return NextResponse.json({ success: false, message: 'Honoraire introuvable' }, { status: 404 });
      }

      const paiement = new HonorairePaye({
        Date: new Date(),
        Heure: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        MontantPayé: montant,
        Restapayer: Math.max(0, (honoraire.Restapayer || honoraire.Totalnetapayer || 0) - montant),
        PayéPar: payePar || '',
        Recupar: payePar || '',
        Medecin: honoraire.Medecin,
        HonoraireMed: honoraireId,
        BanqueC: banque || '',
        NCheque: numeroCheque || '',
        Modepaiement: modePaiement || 'ESPECE',
        entrepriseId: entrepriseId || honoraire.entrepriseId || '',
      });

      await paiement.save();

      // Mettre à jour le reste à payer sur l'honoraire
      const nouveauReste = Math.max(0, (honoraire.Restapayer || honoraire.Totalnetapayer || 0) - montant);
      const nouveauPaye = (honoraire.MontantPayé || 0) + montant;
      await HonraireMed.findByIdAndUpdate(honoraireId, {
        MontantPayé: nouveauPaye,
        Restapayer: nouveauReste,
      });

      return NextResponse.json({ success: true, message: 'Paiement enregistré', data: paiement });
    }

    return NextResponse.json({ success: false, message: 'Action inconnue' }, { status: 400 });
  } catch (error) {
    console.error('Erreur POST honoraires:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur', error: error instanceof Error ? error.message : 'Erreur' },
      { status: 500 }
    );
  }
}
