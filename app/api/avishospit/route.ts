import { NextRequest, NextResponse } from 'next/server';
import { withTenant } from '@/lib/withTenant';
import { getTenantModel } from '@/lib/tenantModels';
import { IAvisHospit } from '@/models/AvisHospit';
import { IConsultation } from '@/models/consultation';

function setServiceFlags(serviceHospit: string) {
  const flags = { MED: false, CHR: false, CHRSP: false, OBST: false, GYN: false, PED: false };
  switch (serviceHospit) {
    case 'MED': flags.MED = true; break;
    case 'CHIR': flags.CHR = true; break;
    case 'CHR.SP': flags.CHRSP = true; break;
    case 'OBST': flags.OBST = true; break;
    case 'GYN': flags.GYN = true; break;
    case 'PED': flags.PED = true; break;
  }
  return flags;
}

function setEtatFlags(etatPatient: string) {
  const flags = { URGENT: false, SEMIURGENT: false, ELECTIF: false };
  switch (etatPatient) {
    case 'Urgent': flags.URGENT = true; break;
    case 'Semi-Urgent': flags.SEMIURGENT = true; break;
    case 'Electif': flags.ELECTIF = true; break;
  }
  return flags;
}

function getAvisHospitTenantModel(connection: Parameters<typeof getTenantModel>[0]) {
  getTenantModel(connection, 'Patient');
  getTenantModel(connection, 'Consultation');
  getTenantModel(connection, 'Medecin');
  return getTenantModel<IAvisHospit>(connection, 'AvisHospit');
}

async function resolveCodePrestation(
  connection: Parameters<typeof getTenantModel>[0],
  consultationId: unknown,
  providedCode: unknown
) {
  const codePrestation = typeof providedCode === 'string' ? providedCode.trim() : '';
  if (codePrestation) return codePrestation;
  if (!consultationId) return undefined;

  const Consultation = getTenantModel<IConsultation>(connection, 'Consultation');
  const consultation = await Consultation.findById(consultationId).select('CodePrestation').lean();
  return consultation?.CodePrestation || undefined;
}

export async function GET(request: NextRequest) {
  const { context, response } = await withTenant(request, ['admin', 'medecin', 'accueil', 'infirmier']);
  if (!context) return response;
  const { connection } = context;

  try {
    const { searchParams } = new URL(request.url);
    const consultationId = searchParams.get('consultationId');
    const patientId = searchParams.get('patientId');
    const statut = searchParams.get('statut');
    const dateInterventionDebut = searchParams.get('dateInterventionDebut');
    const dateInterventionFin = searchParams.get('dateInterventionFin');

    const query: Record<string, unknown> = {};
    if (consultationId) query.IDCONSULTATION = consultationId;
    if (patientId) query.IDPARTIENT = patientId;
    if (statut) query.statut = statut;

    if (dateInterventionDebut || dateInterventionFin) {
      const dateRange: { $gte?: Date; $lte?: Date } = {};

      if (dateInterventionDebut) {
        const debut = new Date(`${dateInterventionDebut}T00:00:00`);
        if (Number.isNaN(debut.getTime())) {
          return NextResponse.json({ success: false, error: 'Date de début invalide' }, { status: 400 });
        }
        dateRange.$gte = debut;
      }

      if (dateInterventionFin) {
        const fin = new Date(`${dateInterventionFin}T23:59:59.999`);
        if (Number.isNaN(fin.getTime())) {
          return NextResponse.json({ success: false, error: 'Date de fin invalide' }, { status: 400 });
        }
        dateRange.$lte = fin;
      }

      if (dateRange.$gte && dateRange.$lte && dateRange.$gte > dateRange.$lte) {
        return NextResponse.json(
          { success: false, error: 'La date de début doit précéder la date de fin' },
          { status: 400 }
        );
      }

      query.DateIntervention = dateRange;
    }

    const AvisHospit = getAvisHospitTenantModel(connection);
    const avis = await AvisHospit.find(query)
      .populate('IDPARTIENT', 'Nom Prenoms Code_dossier Assurance SOCIETE_PATIENT TarifPatient Taux')
      .populate('IDCONSULTATION', 'CodePrestation Date_consulation')
      .populate('medecinId', 'nom prenoms')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, data: avis, total: avis.length });
  } catch (error) {
    console.error('Erreur GET avis hospitalisation:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur', details: error instanceof Error ? error.message : '' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const { context, response } = await withTenant(request, ['admin', 'medecin']);
  if (!context) return response;
  const { connection, userObjectId } = context;

  try {
    const body = await request.json();

    const requiredFields = [
      'serviceHospit', 'etatPatient', 'DureHospit', 'Patient',
      'DateIntervention', 'HeureHospit', 'NumDoc',
      'MedecinTraitant', 'Diagnostic', 'DatePrevue', 'IDPARTIENT'
    ];

    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, error: `Champ requis manquant: ${field}` },
          { status: 400 }
        );
      }
    }

    const serviceFlags = setServiceFlags(body.serviceHospit);
    const etatFlags = setEtatFlags(body.etatPatient);
    const codePrestation = await resolveCodePrestation(connection, body.IDCONSULTATION, body.codePrestation);

    const AvisHospit = getAvisHospitTenantModel(connection);
    const nouvelAvis = await AvisHospit.create({
      ...body,
      codePrestation,
      ...serviceFlags,
      ...etatFlags,
      medecinId: body.medecinId || userObjectId,
      createdBy: userObjectId,
      statut: 'en_attente',
      DateIntervention: new Date(body.DateIntervention),
      DatePrevue: new Date(body.DatePrevue),
      Isolement: body.Isolement || false,
      HospitAnt: body.HospitAnt || false,
      sejourunjour: body.sejourunjour || false,
    });

    return NextResponse.json(
      { success: true, message: 'Avis d\'hospitalisation créé', data: nouvelAvis },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erreur POST avis hospitalisation:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur', details: error instanceof Error ? error.message : '' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const { context, response } = await withTenant(request, ['admin', 'medecin']);
  if (!context) return response;
  const { connection } = context;

  try {
    const body = await request.json();
    const { _id, ...updateData } = body;

    if (!_id) {
      return NextResponse.json(
        { success: false, error: 'ID manquant' },
        { status: 400 }
      );
    }

    if (updateData.serviceHospit) {
      Object.assign(updateData, setServiceFlags(updateData.serviceHospit));
    }
    if (updateData.etatPatient) {
      Object.assign(updateData, setEtatFlags(updateData.etatPatient));
    }
    if (updateData.DateIntervention) {
      updateData.DateIntervention = new Date(updateData.DateIntervention);
    }
    const codePrestation = await resolveCodePrestation(
      connection,
      updateData.IDCONSULTATION,
      updateData.codePrestation
    );
    if (codePrestation) updateData.codePrestation = codePrestation;
    if (updateData.DatePrevue) {
      updateData.DatePrevue = new Date(updateData.DatePrevue);
    }

    const AvisHospit = getAvisHospitTenantModel(connection);
    const updated = await AvisHospit.findByIdAndUpdate(_id, updateData, { new: true, runValidators: true })
      .populate('IDPARTIENT', 'Nom Prenoms Code_dossier')
      .populate('IDCONSULTATION', 'CodePrestation Date_consulation');

    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Avis introuvable' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: 'Avis mis à jour', data: updated });
  } catch (error) {
    console.error('Erreur PUT avis hospitalisation:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur', details: error instanceof Error ? error.message : '' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const { context, response } = await withTenant(request, ['admin', 'medecin']);
  if (!context) return response;
  const { connection } = context;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID manquant' }, { status: 400 });
    }

    const AvisHospit = getAvisHospitTenantModel(connection);
    const deleted = await AvisHospit.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Avis introuvable' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Avis supprimé', data: deleted });
  } catch (error) {
    console.error('Erreur DELETE avis hospitalisation:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur', details: error instanceof Error ? error.message : '' },
      { status: 500 }
    );
  }
}
