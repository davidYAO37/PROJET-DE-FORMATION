import { NextRequest, NextResponse } from 'next/server';
import { withTenant } from '@/lib/withTenant';
import { getTenantModel } from '@/lib/tenantModels';
import { IConsultation } from '@/models/consultation';

const READ_ROLES = ['admin', 'accueil', 'medecin', 'comptable', 'infirmier'];

export async function GET(req: NextRequest) {
  const { context, response } = await withTenant(req, READ_ROLES);
  if (!context) return response;

  const Consultation = getTenantModel<IConsultation>(context.connection, 'Consultation');

  try {
    const { searchParams } = new URL(req.url);
    const dateDebut = searchParams.get('dateDebut');
    const dateFin = searchParams.get('dateFin');
    const mois = searchParams.get('mois');
    const jour = searchParams.get('jour');
    const medecinId = searchParams.get('medecinId');
    const type = searchParams.get('type'); // recu, salleAttente, transfert, constantes
    const patient = searchParams.get('patient');

    const query: any = {};

    if (dateDebut || dateFin) {
      query.Date_consulation = {};
      if (dateDebut) query.Date_consulation.$gte = new Date(dateDebut);
      if (dateFin) {
        const fin = new Date(dateFin);
        fin.setHours(23, 59, 59, 999);
        query.Date_consulation.$lte = fin;
      }
    }

    if (mois) {
      const [year, month] = mois.split('-').map(Number);
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 1);
      query.Date_consulation = { $gte: start, $lt: end };
    }

    if (jour) {
      const start = new Date(jour);
      const end = new Date(jour);
      end.setDate(start.getDate() + 1);
      query.Date_consulation = { $gte: start, $lt: end };
    }

    if (medecinId) {
      query.IDMEDECIN = medecinId;
    }

    if (type) {
      switch (type) {
        case 'recu':
          query.StatutC = true;
          break;
        case 'salleAttente':
          query.AttenteAccueil = false;
          query.StatutC = false;
          break;
        case 'enCours':
          query.AttenteAccueil = 1;
          query.StatutC = false;
          break;
        case 'transfert':
          query.datetransfert = { $exists: true, $ne: null };
          break;
        case 'constantes':
          query.$or = [
            { Temperature: { $exists: true, $ne: '' } },
            { Poids: { $exists: true, $ne: '' } },
            { Tension: { $exists: true, $ne: '' } },
            { Glycemie: { $exists: true, $ne: '' } },
            { TailleCons: { $exists: true, $ne: '' } }
          ];
          break;
      }
    }

    if (patient) {
      query.$or = [
        { PatientP: { $regex: patient, $options: 'i' } },
        { Code_dossier: { $regex: patient, $options: 'i' } }
      ];
    }

    const consultations = await Consultation.find(query)
      .populate('IDMEDECIN', 'nom prenoms specialite')
      .populate('IdPatient', 'Nom Prenoms Contact')
      .sort({ Date_consulation: -1, createdAt: -1 })
      .lean();

    const formatted = (consultations as any[]).map((c) => {
      const medecin = c.IDMEDECIN as any;
      const patient = c.IdPatient as any;
      return {
        id: String(c._id),
        patient: c.PatientP || (patient ? `${patient.Nom || ''} ${patient.Prenoms || ''}`.trim() : '-'),
        patientContact: patient?.Contact || '-',
        codeDossier: c.Code_dossier || '-',
        medecin: c.Medecin || (medecin ? `${medecin.nom || ''} ${medecin.prenoms || ''}`.trim() : '-'),
        specialite: medecin?.specialite || '-',
        date: c.Date_consulation ? new Date(c.Date_consulation).toISOString().split('T')[0] : '-',
        heure: c.Heure_Consultation || '-',
        designation: c.designationC || '-',
        statutC: c.StatutC,
        attenteAccueil: c.AttenteAccueil,
        datetransfert: c.datetransfert ? new Date(c.datetransfert).toISOString().split('T')[0] : null,
        constantes: !!(c.Temperature || c.Poids || c.Tension || c.Glycemie || c.TailleCons),
        temperature: c.Temperature || '-',
        poids: c.Poids || '-',
        tension: c.Tension || '-',
        glycemie: c.Glycemie || '-',
        taille: c.TailleCons || '-'
      };
    });

    return NextResponse.json(formatted);

  } catch (error: any) {
    console.error('Erreur liste consultations:', error);
    return NextResponse.json(
      { error: 'Erreur lors du chargement des consultations', details: error.message },
      { status: 500 }
    );
  }
}
