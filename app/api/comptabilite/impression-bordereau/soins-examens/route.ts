import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/mongoConnect';
import { LigneFacture } from '@/models/ligneFacture';
import { FacturationAssur } from '@/models/factureAssur';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    await db();
    const { searchParams } = new URL(request.url);
    const idFactureAssur = searchParams.get('idFactureAssur') || '';

    if (!idFactureAssur) {
      return NextResponse.json({ success: false, message: 'ID FactureAssur requis' }, { status: 400 });
    }

    const factureAssur = await FacturationAssur.findById(idFactureAssur).lean() as any;
    if (!factureAssur) {
      return NextResponse.json({ success: false, message: 'Bordereau introuvable' }, { status: 404 });
    }

    const EXCLUS = ['PHARMACIE', 'HOSPITALISATION MEDICALE', 'HOSPITALISATION CHIRURGICALE'];

    const lignesRaw = await LigneFacture.find({
      FactureAssur: new mongoose.Types.ObjectId(idFactureAssur),
      TYPEACTE: 'EXAMEN ET AUTRES PRESTATIONS',
      ACTEF: { $nin: EXCLUS },
    }).lean() as any[];

    const lignes = lignesRaw.map((l: any) => ({
      date: l.DateFacture ? new Date(l.DateFacture).toLocaleDateString('fr-FR') : '',
      beneficiaire: l.Beneficiaire || '',
      matricule: l.Matricule || '',
      acte: l.ACTEF || '',
      totalacte: l.Totalacte || 0,
      partAssurance: l.PartAssurance || 0,
      partAssure: l.Partassure || 0,
      societePatient: l.SOCIETE_PATIENT || '',
      numBon: l.NumBon || '',
    }));

    const totaux = {
      totalacte: lignes.reduce((s, l) => s + l.totalacte, 0),
      partAssurance: lignes.reduce((s, l) => s + l.partAssurance, 0),
      partAssure: lignes.reduce((s, l) => s + l.partAssure, 0),
    };

    return NextResponse.json({
      success: true,
      lignes,
      totaux,
      facture: {
        reference: factureAssur.Reference || '',
        assurance: factureAssur.Assurance || '',
        debutF: factureAssur.DebutF || '',
        finF: factureAssur.FinF || '',
        date: factureAssur.Date || '',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Erreur serveur', error: error instanceof Error ? error.message : 'Erreur' },
      { status: 500 }
    );
  }
}
