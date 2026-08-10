import { IFeuilleSoins } from '@/models/FeuilleSoins';
import { NextRequest, NextResponse } from 'next/server';
import { withTenant } from '@/lib/withTenant';
import { getTenantModel } from '@/lib/tenantModels';

const READ_ROLES = ["admin", "medecin", "accueil", "caisse", "comptable", "infirmier"];
const WRITE_ROLES = ["admin", "medecin", "infirmier"];

export async function GET(req: NextRequest) {
  const { context, response } = await withTenant(req, READ_ROLES);
  if (!context) return response;
  const FeuilleSoins = getTenantModel<IFeuilleSoins>(context.connection, "FeuilleSoins");
  try {
    const { searchParams } = new URL(req.url);
    const patientId    = searchParams.get('patientId');
    const codeDossier  = searchParams.get('codeDossier');
    const entrepriseId = searchParams.get('entrepriseId');

    const filter: Record<string, any> = {};
    if (patientId)    filter.Patient      = patientId;
    if (codeDossier)  filter.Code_dossier = codeDossier;
    if (entrepriseId) filter.entrepriseId = entrepriseId;

    const soins = await FeuilleSoins.find(filter).sort({ createdAt: -1 });
    return NextResponse.json(soins);
  } catch (error) {
    return NextResponse.json({ error: 'Erreur récupération soins' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { context, response } = await withTenant(req, WRITE_ROLES);
  if (!context) return response;
  const FeuilleSoins = getTenantModel<IFeuilleSoins>(context.connection, "FeuilleSoins");
  try {
    const body = await req.json();
    const soin = await FeuilleSoins.create(body);
    return NextResponse.json(soin, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Erreur création soin' }, { status: 500 });
  }
}
