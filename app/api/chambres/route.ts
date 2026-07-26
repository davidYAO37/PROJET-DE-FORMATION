import { NextRequest, NextResponse } from 'next/server';
import { withTenant } from '@/lib/withTenant';
import { getTenantModel } from '@/lib/tenantModels';
import { IChambre } from '@/models/chambre';
import { ILit } from '@/models/lit';
import { IActeClinique } from '@/models/acteclinique';

export async function GET(req: NextRequest) {
  const { context, response } = await withTenant(req, ['admin', 'medecin', 'accueil', 'infirmier']);
  if (!context) return response;
  const { connection } = context;

  try {
    const { searchParams } = new URL(req.url);
    const etat = searchParams.get('etat');
    const service = searchParams.get('service');

    const query: Record<string, string> = {};
    if (etat) query.etat = etat;
    if (service) query.service = service;

    const Chambre = getTenantModel<IChambre>(connection, 'Chambre');
    const chambres = await Chambre.find(query)
      .sort({ numero: 1 })
      .lean();

    return NextResponse.json(chambres);
  } catch (error) {
    console.error('Erreur chambres GET:', error);
    return NextResponse.json(
      { message: 'Erreur serveur', details: error instanceof Error ? error.message : '' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const { context, response } = await withTenant(req, ['admin', 'accueil']);
  if (!context) return response;
  const { connection } = context;

  try {
    const body = await req.json();
    const Chambre = getTenantModel<IChambre>(connection, 'Chambre');
    const Lit = getTenantModel<ILit>(connection, 'Lit');
    const ActeClinique = getTenantModel<IActeClinique>(connection, 'ActeClinique');

    const prixClinique = Number(body.prixClinique || 0);
    const prixMutuel = Number(body.prixMutuel || 0);
    const prixPreferentiel = Number(body.prixPreferentiel || 0);

    // Créer l'acte clinique correspondant à la chambre (1 chambre = 1 acte clinique)
    const designationActe = `${body.type}`;
    const acte = await ActeClinique.create({
      designationacte: designationActe,
      lettreCle: 'CH',
      coefficient: 1,
      prixClinique,
      prixMutuel,
      prixPreferentiel,
      consultationviste: false,
      ActeNonFacturable: false,
    });

    const chambre = await Chambre.create({
      ...body,
      prixClinique,
      prixMutuel,
      prixPreferentiel,
      tarifJournalier: Number(body.tarifJournalier || prixClinique),
      nombreLits: Number(body.nombreLits || 1),
      acteCliniqueId: acte._id,
    });

    const nombreLits = Number(body.nombreLits || 1);
    const litsToCreate = Array.from({ length: nombreLits }, (_, index) => ({
      numero: `${chambre.numero}-${index + 1}`,
      chambreId: chambre._id,
      service: chambre.service,
      tarifJournalier: Number(body.tarifJournalier || prixClinique),
      prixClinique,
      prixMutuel,
      prixPreferentiel,
      etat: 'libre',
    }));

    await Lit.insertMany(litsToCreate);
    return NextResponse.json(chambre, { status: 201 });
  } catch (error) {
    console.error('Erreur chambres POST:', error);
    return NextResponse.json(
      { message: 'Erreur lors de la création', details: error instanceof Error ? error.message : '' },
      { status: 500 }
    );
  }
}
