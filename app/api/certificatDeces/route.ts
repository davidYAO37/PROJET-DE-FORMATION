import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import '@/models/certificatDeces';
import { ICertificatDeces } from '@/models/certificatDeces';
import { IPatient } from '@/models/patient';
import { withTenant, getTenantFilter } from '@/lib/withTenant';
import { getTenantModel } from '@/lib/tenantModels';

export async function GET(request: NextRequest) {
  const { context, response } = await withTenant(request, ['admin', 'medecin']);
  if (!context) return response;
  const patientId = request.nextUrl.searchParams.get('patientId');
  if (!patientId || !mongoose.isValidObjectId(patientId)) return NextResponse.json({ error: 'Patient invalide' }, { status: 400 });
  try {
    const Model = getTenantModel<ICertificatDeces>(context.connection, 'CertificatDeces');
    const data = await Model.find({ ...getTenantFilter(context), patientId }).sort({ createdAt: -1 }).limit(100);
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: 'Impossible de charger les certificats' }, { status: 500 });
  }
}

async function save(request: NextRequest, updating: boolean) {
  const { context, response } = await withTenant(request, ['medecin']);
  if (!context) return response;
  try {
    const body = await request.json();
    if (!mongoose.isValidObjectId(body.patientId) || (updating && !mongoose.isValidObjectId(body._id))) {
      return NextResponse.json({ error: 'Identifiant invalide' }, { status: 400 });
    }
    const fields = ['dateDeces', 'heureDeces', 'lieuDeces', 'medecin', 'numeroOrdre', 'lieuEtablissement', 'observations'] as const;
    const values = Object.fromEntries(fields.map(key => [key, typeof body[key] === 'string' ? body[key].trim() : '']));
    if (['dateDeces', 'heureDeces', 'lieuDeces', 'medecin', 'lieuEtablissement'].some(key => !values[key]) || fields.some(key => values[key].length > 5000)) {
      return NextResponse.json({ error: 'Renseignez tous les champs obligatoires (5 000 caractères maximum)' }, { status: 400 });
    }
    const date = new Date(`${values.dateDeces}T${values.heureDeces}:00`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(values.dateDeces) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(values.heureDeces) || Number.isNaN(date.getTime()) || `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` !== values.dateDeces || date > new Date()) {
      return NextResponse.json({ error: 'La date et l’heure du décès doivent être valides et non futures' }, { status: 400 });
    }
    const filter = getTenantFilter(context);
    const Patient = getTenantModel<IPatient>(context.connection, 'Patient');
    const patient = await Patient.findOne({ ...filter, _id: body.patientId });
    if (!patient) return NextResponse.json({ error: 'Patient introuvable' }, { status: 404 });
    const Model = getTenantModel<ICertificatDeces>(context.connection, 'CertificatDeces');
    const status = body.statut === 'valide' ? 'valide' : 'brouillon';
    const data = {
      ...values,
      statut: status,
      ...(status === 'valide' ? { validePar: context.user.userId, dateValidation: new Date() } : {}),
    };
    if (updating) {
      const saved = await Model.findOneAndUpdate({ ...filter, _id: body._id, patientId: body.patientId, statut: 'brouillon' }, { $set: data }, { new: true, runValidators: true });
      if (!saved) return NextResponse.json({ error: 'Certificat introuvable ou déjà validé (non modifiable)' }, { status: 409 });
      return NextResponse.json({ data: saved });
    }
    const saved = await Model.create({
      ...data, entrepriseId: context.entrepriseId, patientId: patient._id,
      patientNom: patient.Nom, patientPrenoms: patient.Prenoms,
      patientNumeroDossier: patient.Code_dossier, patientDateNaissance: patient.Date_naisse,
      patientSexe: patient.sexe, auteurId: context.user.userId,
    });
    return NextResponse.json({ data: saved }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Impossible d’enregistrer le certificat' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) { return save(request, false); }
export async function PUT(request: NextRequest) { return save(request, true); }
