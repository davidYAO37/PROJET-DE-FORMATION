import { NextRequest, NextResponse } from 'next/server';
import { getTenantFilter, withTenant } from '@/lib/withTenant';
import { getTenantModel } from '@/lib/tenantModels';
import { ILigneFacture } from '@/models/ligneFacture';
import { IFactureAssur } from '@/models/factureAssur';
import mongoose from 'mongoose';

const ROLES = ['admin', 'medecin', 'accueil', 'infirmier', 'comptable', 'facturation'];

// Impression "Consultations & Visites" — lit le snapshot LigneFacture (figé à la
// création du bordereau) et non les documents source, pour garantir que l'imprimé
// corresponde toujours aux montants du bordereau comptable.
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
      $or: [{ TYPEACTE: 'CONSULTATION' }, { IDCONSULTATION: { $ne: null, $exists: true } }],
    })
      .sort({ SOCIETE_PATIENT: 1, DateFacture: 1 })
      .lean() as any[];

    // Mêmes noms de champs que l'ancienne réponse (contrat de la page d'impression)
    const lignes = lignesRaw.map((l: any) => ({
      Date_consulation: l.DateFacture,
      numero_carte: l.Matricule,
      PatientP: l.Beneficiaire,
      designationC: l.ACTEF,
      PrixClinique: l.Totalacte,
      montantapayer: l.Partassure,
      PartAssurance: l.PartAssurance,
      SOCIETE_PATIENT: l.SOCIETE_PATIENT,
      assurance: factureAssur.Assurance,
      NumBon: l.NumBon,
    }));

    const totaux = {
      PrixClinique: lignes.reduce((s, l) => s + (l.PrixClinique || 0), 0),
      montantapayer: lignes.reduce((s, l) => s + (l.montantapayer || 0), 0),
      PartAssurance: lignes.reduce((s, l) => s + (l.PartAssurance || 0), 0),
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
