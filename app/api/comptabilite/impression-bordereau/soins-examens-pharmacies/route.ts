import { NextRequest, NextResponse } from 'next/server';
import { withTenant } from '@/lib/withTenant';
import { getTenantModel } from '@/lib/tenantModels';
import { ILigneFacture } from '@/models/ligneFacture';
import { IFactureAssur } from '@/models/factureAssur';
import mongoose from 'mongoose';

const ROLES = ['admin', 'medecin', 'accueil', 'infirmier'];

export async function GET(request: NextRequest) {
  const { context, response: tenantErrorResponse } = await withTenant(request, ROLES);
  if (!context) return tenantErrorResponse;
  const LigneFacture = getTenantModel<ILigneFacture>(context.connection, 'LigneFacture');
  const FacturationAssur = getTenantModel<IFactureAssur>(context.connection, 'FactureAssur');

  try {
    const { searchParams } = new URL(request.url);
    const idFactureAssur = searchParams.get('idFactureAssur') || '';

    if (!idFactureAssur) {
      return NextResponse.json({ success: false, message: 'ID FactureAssur requis' }, { status: 400 });
    }

    const factureAssur = await FacturationAssur.findById(idFactureAssur).lean() as any;
    if (!factureAssur) {
      return NextResponse.json({ success: false, message: 'Bordereau introuvable' }, { status: 404 });
    }

    const EXCLUS_ACTEF = ['HOSPITALISATION MEDICALE', 'HOSPITALISATION CHIRURGICALE'];

    const lignesRaw = await LigneFacture.find({
      FactureAssur: new mongoose.Types.ObjectId(idFactureAssur),
      ACTEF: { $nin: EXCLUS_ACTEF },
      TYPEACTE: { $ne: 'CONSULTATION' },
    })
      .sort({ SOCIETE_PATIENT: 1, DateFacture: 1, TYPEACTE: 1 })
      .lean() as any[];

    const lignes = lignesRaw.map((l) => ({
      DateFacture: l.DateFacture,
      Beneficiaire: l.Beneficiaire,
      Matricule: l.Matricule,
      ACTEF: l.ACTEF,
      TYPEACTE: l.TYPEACTE,
      Totalacte: l.Totalacte,
      PartAssurance: l.PartAssurance,
      Partassure: l.Partassure,
      SOCIETE_PATIENT: l.SOCIETE_PATIENT,
      NumBon: l.NumBon,
    }));

    const totaux = {
      Totalacte: lignes.reduce((s, l) => s + (l.Totalacte || 0), 0),
      PartAssurance: lignes.reduce((s, l) => s + (l.PartAssurance || 0), 0),
      Partassure: lignes.reduce((s, l) => s + (l.Partassure || 0), 0),
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
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Erreur serveur', error: error instanceof Error ? error.message : 'Erreur' },
      { status: 500 }
    );
  }
}
