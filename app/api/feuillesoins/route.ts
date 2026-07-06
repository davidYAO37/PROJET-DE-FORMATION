import { db } from '@/db/mongoConnect';
import { FeuilleSoins } from '@/models/FeuilleSoins';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  await db();
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

export async function POST(req: Request) {
  await db();
  try {
    const body = await req.json();
    const soin = await FeuilleSoins.create(body);
    return NextResponse.json(soin, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Erreur création soin' }, { status: 500 });
  }
}
