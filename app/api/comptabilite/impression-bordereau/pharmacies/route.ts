import { NextRequest, NextResponse } from 'next/server';
import { getTenantFilter, withTenant } from '@/lib/withTenant';
import { getTenantModel } from '@/lib/tenantModels';
import { ILigneFacture } from '@/models/ligneFacture';
import { IFactureAssur } from '@/models/factureAssur';
import mongoose from 'mongoose';

const ROLES = ['admin', 'medecin', 'accueil', 'infirmier', 'comptable', 'facturation'];

// Impression "Liste Pharmacies" — lit le snapshot LigneFacture (figé à la création
// du bordereau). La classification pharmacie est alignée sur le bordereau :
// TYPEACTE = 'PHARMACIE' (pose quand IDPRESCRIPTION était renseigné).
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

    const factureAssur = await FacturationAssur.findOne({ _id: idFactureAssur, ...getTenantFilter(context) }).lean() as any;
    if (!factureAssur) {
      return NextResponse.json({ success: false, message: 'Bordereau introuvable' }, { status: 404 });
    }

    const lignesRaw = await LigneFacture.find({
      FactureAssur: new mongoose.Types.ObjectId(idFactureAssur),
      $or: [{ TYPEACTE: 'PHARMACIE' }, { ACTEF: 'PHARMACIE' }, { IDPRESCRIPTION: { $ne: null, $exists: true } }],
    })
      .sort({ SOCIETE_PATIENT: 1, DateFacture: 1 })
      .lean() as any[];

    // Mêmes noms de champs que l'ancienne réponse (contrat de la page d'impression)
    const lignes = lignesRaw.map((l: any) => ({
      DateModif: l.DateFacture,
      PatientP: l.Beneficiaire,
      Numcarte: l.Matricule,
      Designationtypeacte: l.ACTEF,
      Montanttotal: l.Totalacte,
      PartAssuranceP: l.PartAssurance,
      Partassure: l.Partassure,
      SOCIETE_PATIENT: l.SOCIETE_PATIENT,
      Assurance: factureAssur.Assurance,
      Numfacture: factureAssur.Reference,
      NumBon: l.NumBon,
    }));

    const totaux = {
      Montanttotal: lignes.reduce((s, l) => s + (l.Montanttotal || 0), 0),
      PartAssuranceP: lignes.reduce((s, l) => s + (l.PartAssuranceP || 0), 0),
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
