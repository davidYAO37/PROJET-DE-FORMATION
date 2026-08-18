import { NextRequest, NextResponse } from 'next/server';
import { withTenant } from '@/lib/withTenant';
import { getTenantModel } from '@/lib/tenantModels';
import { IConsultation } from '@/models/consultation';
import { IPatient } from '@/models/patient';

const ROLES = ['admin', 'medecin', 'accueil', 'infirmier', 'comptable', 'facturation'];

export async function GET(request: NextRequest) {
  const { context, response: tenantErrorResponse } = await withTenant(request, ROLES);
  if (!context) return tenantErrorResponse;
  const Consultation = getTenantModel<IConsultation>(context.connection, 'Consultation');
  getTenantModel<IPatient>(context.connection, 'Patient');

  try {
    const { searchParams } = new URL(request.url);
    const numfacture = searchParams.get('numfacture') || '';

    if (!numfacture) {
      return NextResponse.json({ success: false, message: 'Référence facture requise' }, { status: 400 });
    }

    const consultations = await Consultation.find({ Numfacture: numfacture })
      .populate({ path: 'IdPatient', select: 'Nom Prenoms' })
      .lean() as any[];

    const lignes = consultations.map((c) => ({
      Date_consulation: c.Date_consulation,
      numero_carte: c.numero_carte,
      PatientP: c.PatientP || (c.IdPatient ? `${c.IdPatient.Nom || ''} ${c.IdPatient.Prenoms || ''}`.trim() : ''),
      designationC: c.designationC,
      PrixClinique: c.PrixClinique,
      montantapayer: c.montantapayer,
      PartAssurance: c.PartAssurance,
      SOCIETE_PATIENT: c.SOCIETE_PATIENT,
      assurance: c.assurance,
      NumBon: c.NumBon,
    }));

    const totaux = {
      PrixClinique: lignes.reduce((s, l) => s + (l.PrixClinique || 0), 0),
      montantapayer: lignes.reduce((s, l) => s + (l.montantapayer || 0), 0),
      PartAssurance: lignes.reduce((s, l) => s + (l.PartAssurance || 0), 0),
    };

    return NextResponse.json({ success: true, lignes, totaux });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Erreur serveur', error: error instanceof Error ? error.message : 'Erreur' },
      { status: 500 }
    );
  }
}
