import { NextRequest, NextResponse } from 'next/server';
import { withTenant } from '@/lib/withTenant';
import { getTenantModel } from '@/lib/tenantModels';
import { IRendezVous } from '@/models/RendezVous';

const READ_ROLES = ['admin', 'medecin', 'accueil', 'comptable', 'infirmier', 'radiologue'];

export async function GET(request: NextRequest) {
  const { context, response } = await withTenant(request, READ_ROLES);
  if (!context) return response;

  const RendezVous = getTenantModel<IRendezVous>(context.connection, 'RendezVous');

  try {
    const { searchParams } = new URL(request.url);
    const statut = searchParams.get('statut');
    const pris = searchParams.get('pris');
    const dateDebut = searchParams.get('dateDebut');
    const dateFin = searchParams.get('dateFin');
    const mois = searchParams.get('mois');
    const jour = searchParams.get('jour');
    const medecinId = searchParams.get('medecinId');
    const patient = searchParams.get('patient');

    const query: any = {};

    if (statut) query.StatutRdv = statut;
    if (pris !== null) query.Statutrdvpris = pris === 'true';
    if (medecinId) query.IDMEDECIN = medecinId;
    if (patient) {
      query.$or = [
        { PatientR: { $regex: patient, $options: 'i' } },
        { Medecinr: { $regex: patient, $options: 'i' } }
      ];
    }

    if (dateDebut || dateFin) {
      query.DatePlanning = {};
      if (dateDebut) query.DatePlanning.$gte = new Date(dateDebut);
      if (dateFin) query.DatePlanning.$lte = new Date(dateFin);
    }

    if (mois) {
      const [year, month] = mois.split('-').map(Number);
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 1);
      query.DatePlanning = { $gte: start, $lt: end };
    }

    if (jour) {
      const start = new Date(jour);
      const end = new Date(jour);
      end.setDate(start.getDate() + 1);
      query.DatePlanning = { $gte: start, $lt: end };
    }

    const rdvs = await RendezVous.find(query)
      .populate('IDMEDECIN', 'nom prenoms specialite')
      .populate('IdPatient', 'Nom Prenoms Contact')
      .sort({ DatePlanning: -1, createdAt: -1 })
      .lean();

    const formatted = (rdvs as any[]).map((rdv) => {
      const medecin = rdv.IDMEDECIN as any;
      const patient = rdv.IdPatient as any;
      return {
        id: String(rdv._id),
        patient: rdv.PatientR || (patient ? `${patient.Nom || ''} ${patient.Prenoms || ''}`.trim() : '-'),
        patientContact: rdv.Contact || (patient?.Contact || '-'),
        medecin: rdv.Medecinr || (medecin ? `${medecin.nom || ''} ${medecin.prenoms || ''}`.trim() : '-'),
        specialite: medecin?.specialite || '-',
        statut: rdv.StatutRdv,
        statutPris: rdv.Statutrdvpris,
        dateDisponibilite: rdv.DateDisponinibilite || '-',
        datePlanning: rdv.DatePlanning ? new Date(rdv.DatePlanning).toISOString().split('T')[0] : '-',
        description: rdv.DESCRIPTION || '-',
        nouvelleDate: rdv.NouvelleDate || null,
        motifReport: rdv.MotifReport || null,
        annulationType: rdv.AnnulationType || null,
        serviceIndisponible: rdv.ServiceIndisponible || false,
        prisPar: rdv.RendezVousPrisPar || '-',
        saisiPar: rdv.DisponibiliteSaisiePar || '-'
      };
    });

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error('Erreur liste rendez-vous:', error);
    return NextResponse.json(
      { error: 'Erreur lors du chargement des rendez-vous', details: error.message },
      { status: 500 }
    );
  }
}
