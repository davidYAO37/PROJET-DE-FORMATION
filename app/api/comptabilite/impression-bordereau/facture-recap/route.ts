import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/mongoConnect';
import { FactureRecap } from '@/models/factureRecap';
import { FacturationAssur } from '@/models/factureAssur';
import mongoose from 'mongoose';

// SELECT Facture_Recap.* FROM Facture_Recap WHERE Facture_Recap.IDFactureAssur = {ParamIDFactureAssur}
export async function GET(request: NextRequest) {
  try {
    await db();
    const { searchParams } = new URL(request.url);
    const idFactureAssur = searchParams.get('idFactureAssur') || '';

    if (!idFactureAssur) {
      return NextResponse.json({ success: false, message: 'ID FactureAssur requis' }, { status: 400 });
    }

    if (!mongoose.Types.ObjectId.isValid(idFactureAssur)) {
      return NextResponse.json({ success: false, message: 'ID invalide' }, { status: 400 });
    }

    // Récupérer le bordereau (FactureAssur) pour l'entête
    const factureAssur = await FacturationAssur.findById(idFactureAssur).lean() as any;
    if (!factureAssur) {
      return NextResponse.json({ success: false, message: 'Bordereau introuvable' }, { status: 404 });
    }

    // Requête principale : Facture_Recap WHERE IDFactureAssur = ParamIDFactureAssur
    const lignes = await FactureRecap.find({
      FactureAssur: new mongoose.Types.ObjectId(idFactureAssur),
    }).sort({ ACTE: 1 }).lean() as any[];

    // Totaux cumulés (Cumule des Totaux dans l'état)
    const totaux = {
      montantacte: lignes.reduce((s, l) => s + (l.montantacte || 0), 0),
      Partassure: lignes.reduce((s, l) => s + (l.Partassure || 0), 0),
      PartAssurance: lignes.reduce((s, l) => s + (l.PartAssurance || 0), 0),
      nbLignes: lignes.length,
    };

    // Entête de l'état : Assurance, NCC, Ref_Facture, DebutF, FinF, DateSaisie
    // Ces infos viennent soit du bordereau, soit de la première ligne recap
    const premiereRecap = lignes[0];
    const entete = {
      Assurance: factureAssur.Assurance || premiereRecap?.Assurance || '',
      NCC: premiereRecap?.NCC || '',
      Numfacture: factureAssur.Reference || premiereRecap?.Numfacture || '',
      DebutF: factureAssur.DebutF || premiereRecap?.DebutF || '',
      FinF: factureAssur.FinF || premiereRecap?.FinF || '',
      DateSaisie: premiereRecap?.DateSaisie || factureAssur.Date || new Date(),
      etat_facture: factureAssur.etat_facture || false,
      TotalPaye: factureAssur.TotalPaye || 0,
      Restapayer: factureAssur.Restapayer || 0,
    };

    return NextResponse.json({
      success: true,
      lignes: lignes.map(l => ({
        ACTE: l.ACTE,
        montantacte: l.montantacte,
        Partassure: l.Partassure,
        PartAssurance: l.PartAssurance,
        DebutF: l.DebutF,
        FinF: l.FinF,
        DateSaisie: l.DateSaisie,
        Numfacture: l.Numfacture,
        Assurance: l.Assurance,
        NCC: l.NCC,
      })),
      totaux,
      entete,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Erreur serveur', error: error instanceof Error ? error.message : 'Erreur' },
      { status: 500 }
    );
  }
}
