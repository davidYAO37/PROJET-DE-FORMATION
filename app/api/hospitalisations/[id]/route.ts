import { NextRequest, NextResponse } from 'next/server';
import { withTenant } from '@/lib/withTenant';
import { getTenantModel } from '@/lib/tenantModels';
import { IExamenHospitalisation } from '@/models/examenHospit';
import { ILit } from '@/models/lit';
import { IChambre } from '@/models/chambre';

function ensurePopulateModels(connection: Parameters<typeof getTenantModel>[0]) {
  getTenantModel(connection, 'Patient');
  getTenantModel(connection, 'Consultation');
  getTenantModel(connection, 'Medecin');
  getTenantModel(connection, 'Assurance');
  getTenantModel(connection, 'Chambre');
  getTenantModel(connection, 'Lit');
  getTenantModel(connection, 'AvisHospit');
  getTenantModel(connection, 'TypeActe');
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { context, response } = await withTenant(req, ['admin', 'medecin', 'accueil', 'infirmier']);
  if (!context) return response;
  const { connection } = context;

  try {
    const { id } = await params;
    ensurePopulateModels(connection);
    const ExamenHospitalisation = getTenantModel<IExamenHospitalisation>(connection, 'ExamenHospitalisation');
    const hospitalisation = await ExamenHospitalisation.findById(id)
      .populate('IdPatient', 'Nom Prenoms Code_dossier Assurance SOCIETE_PATIENT')
      .populate('IDCHAMBRE')
      .populate('litId')
      .populate('idMedecin', 'nom prenoms')
      .populate('IDASSURANCE')
      .populate('avisHospitId')
      .lean();

    if (!hospitalisation) {
      return NextResponse.json({ message: 'Introuvable' }, { status: 404 });
    }
    return NextResponse.json(hospitalisation);
  } catch (error) {
    console.error('Erreur GET hospitalisation by id:', error);
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { context, response } = await withTenant(req, ['admin', 'medecin', 'accueil', 'infirmier']);
  if (!context) return response;
  const { connection } = context;

  try {
    const { id } = await params;
    const body = await req.json();

    ensurePopulateModels(connection);
    const ExamenHospitalisation = getTenantModel<IExamenHospitalisation>(connection, 'ExamenHospitalisation');
    const Lit = getTenantModel<ILit>(connection, 'Lit');
    const Chambre = getTenantModel<IChambre>(connection, 'Chambre');

    const existing = await ExamenHospitalisation.findById(id);
    if (!existing) {
      return NextResponse.json({ message: 'Introuvable' }, { status: 404 });
    }

    const previousLitId = existing.litId?.toString();
    const previousChambreId = existing.IDCHAMBRE?.toString();
    const nextLitId = body.litId ? body.litId.toString() : previousLitId;
    const nextChambreId = body.chambreId ? body.chambreId.toString() : previousChambreId;

    // Map statut -> statutHospitalisation
    const statut = body.statut || body.statutHospitalisation;
    const shouldRelease = statut === 'sortie' || statut === 'transfere' || statut === 'decede';

    if (shouldRelease) {
      if (previousLitId) {
        await Lit.findByIdAndUpdate(previousLitId, {
          etat: 'libre',
          patientId: undefined,
          dateLiberation: new Date(),
        });
      }
      if (previousChambreId) {
        const activeInRoom = await ExamenHospitalisation.findOne({
          IDCHAMBRE: previousChambreId,
          statutHospitalisation: 'en_cours',
          _id: { $ne: existing._id },
        });
        if (!activeInRoom) {
          await Chambre.findByIdAndUpdate(previousChambreId, { etat: 'libre' });
        }
      }
    } else {
      if (previousLitId && nextLitId && previousLitId !== nextLitId) {
        await Lit.findByIdAndUpdate(previousLitId, {
          etat: 'libre',
          patientId: undefined,
          dateLiberation: new Date(),
        });
      }
      if (previousChambreId && nextChambreId && previousChambreId !== nextChambreId) {
        const activeInRoom = await ExamenHospitalisation.findOne({
          IDCHAMBRE: previousChambreId,
          statutHospitalisation: 'en_cours',
          _id: { $ne: existing._id },
        });
        if (!activeInRoom) {
          await Chambre.findByIdAndUpdate(previousChambreId, { etat: 'libre' });
        }
      }
    }

    // Map body fields for ExamenHospitalisation
    const updateData: Record<string, any> = { ...body };
    if (body.statut) {
      updateData.statutHospitalisation = body.statut;
      delete updateData.statut;
    }
    if (body.chambreId) {
      updateData.IDCHAMBRE = body.chambreId;
      delete updateData.chambreId;
    }

    const updated = await ExamenHospitalisation.findByIdAndUpdate(id, updateData, { new: true });

    if (updated && !shouldRelease && updated.litId) {
      await Lit.findByIdAndUpdate(updated.litId, {
        etat: 'occupe',
        patientId: updated.IdPatient,
        dateOccupation: new Date(),
      });
    }
    if (updated && !shouldRelease && updated.IDCHAMBRE) {
      await Chambre.findByIdAndUpdate(updated.IDCHAMBRE, { etat: 'occupee' });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Erreur PUT hospitalisation:', error);
    return NextResponse.json({ message: 'Erreur lors de la mise à jour' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { context, response } = await withTenant(req, ['admin']);
  if (!context) return response;
  const { connection } = context;

  try {
    const { id } = await params;
    const ExamenHospitalisation = getTenantModel<IExamenHospitalisation>(connection, 'ExamenHospitalisation');
    const Lit = getTenantModel<ILit>(connection, 'Lit');
    const Chambre = getTenantModel<IChambre>(connection, 'Chambre');

    const deleted = await ExamenHospitalisation.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ message: 'Introuvable' }, { status: 404 });
    }

    if (deleted.litId) {
      await Lit.findByIdAndUpdate(deleted.litId, {
        etat: 'libre',
        patientId: undefined,
        dateLiberation: new Date(),
      });
    }
    if (deleted.IDCHAMBRE) {
      const activeInRoom = await ExamenHospitalisation.findOne({
        IDCHAMBRE: deleted.IDCHAMBRE,
        statutHospitalisation: 'en_cours',
        _id: { $ne: deleted._id },
      });
      if (!activeInRoom) {
        await Chambre.findByIdAndUpdate(deleted.IDCHAMBRE, { etat: 'libre' });
      }
    }

    return NextResponse.json({ message: 'Supprimé' });
  } catch (error) {
    console.error('Erreur DELETE hospitalisation:', error);
    return NextResponse.json({ message: 'Erreur lors de la suppression' }, { status: 500 });
  }
}
