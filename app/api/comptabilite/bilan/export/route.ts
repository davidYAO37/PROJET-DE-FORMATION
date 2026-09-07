import { NextRequest } from 'next/server';
import { withTenant } from '@/lib/withTenant';
import { getTenantModel } from '@/lib/tenantModels';
import { sendExport, formatDateFr, formatMontant } from '@/lib/exportUtils';
import { IEncaissementCaisse } from '@/models/EncaissementCaisse';
import { IFacturation } from '@/models/Facturation';
import { IConsultation } from '@/models/consultation';

const ROLES = ['admin', 'medecin', 'accueil', 'infirmier', 'comptable', 'facturation'];

export async function GET(request: NextRequest) {
  const { context, response: tenantErrorResponse } = await withTenant(request, ROLES);
  if (!context) return tenantErrorResponse;
  const { connection } = context;
  const EncaissementCaisse = getTenantModel<IEncaissementCaisse>(connection, 'EncaissementCaisse');
  const Facturation = getTenantModel<IFacturation>(connection, 'Facturation');
  const Consultation = getTenantModel<IConsultation>(connection, 'Consultation');

  try {
    const { searchParams } = new URL(request.url);
    const dateDebut = searchParams.get('dateDebut');
    const dateFin = searchParams.get('dateFin');
    const modePaiement = searchParams.get('modePaiement') || '';
    const typePatient = searchParams.get('typePatient') || '';
    const format = (searchParams.get('format') || 'csv') as 'csv' | 'xlsx';

    if (!dateDebut || !dateFin) {
      return new Response('dateDebut et dateFin sont requis', { status: 400 });
    }

    const debutDate = new Date(dateDebut);
    const finDate = new Date(dateFin);
    finDate.setHours(23, 59, 59, 999);

    const consultations = await Consultation.find({
      Date_consulation: { $gte: debutDate, $lte: finDate },
    }).lean();

    const facturations = await Facturation.find({
      DateFacturation: { $gte: debutDate, $lte: finDate },
    }).lean();

    const encaissements = await EncaissementCaisse.find({
      DateEncaissement: { $gte: debutDate, $lte: finDate },
    }).lean();

    let lignes: any[] = [];

    for (const c of consultations) {
      lignes.push({
        date: c.Date_consulation,
        patient: c.PatientP || '',
        assurance: c.assurance || '',
        designation: c.designationC || 'CONSULTATION',
        typeActe: 'Consultation',
        montantTotal: c.PrixClinique || 0,
        partAssurance: c.PartAssurance || 0,
        partPatient: c.montantapayer || 0,
        montantEncaisse: c.Montantencaisse || 0,
        remise: 0,
        resteAPayer: c.Restapayer || 0,
        medecin: c.Medecin || '',
        modePaiement: c.Modepaiement || '',
        typePatient: c.Assure || 'NON ASSURE',
      });
    }

    for (const f of facturations) {
      lignes.push({
        date: f.DateFacturation,
        patient: f.PatientP || '',
        assurance: f.Assurance || '',
        designation: f.Designationtypeacte || '',
        typeActe: f.Designationtypeacte || 'Prestation',
        montantTotal: f.Montanttotal || 0,
        partAssurance: f.PartAssuranceP || 0,
        partPatient: f.TotalapayerPatient || 0,
        montantEncaisse: f.TotalPaye || 0,
        remise: f.reduction || 0,
        resteAPayer: f.Restapayer || 0,
        medecin: f.NomMed || '',
        modePaiement: f.Modepaiement || '',
        typePatient: f.Assure || 'NON ASSURE',
      });
    }

    for (const e of encaissements) {
      lignes.push({
        date: e.DateEncaissement,
        patient: e.Patient || '',
        assurance: e.Assurance || '',
        designation: e.Designation || '',
        typeActe: 'Encaissement',
        montantTotal: e.Totalacte || 0,
        partAssurance: e.PartAssurance || 0,
        partPatient: e.TotalapayerPatient || 0,
        montantEncaisse: e.Montantencaisse || 0,
        remise: e.REMISE || 0,
        resteAPayer: e.Restapayer || 0,
        medecin: e.Medecin || '',
        modePaiement: e.Modepaiement || '',
        typePatient: e.Assure || 'NON ASSURE',
      });
    }

    if (modePaiement && modePaiement !== 'TOUS') {
      lignes = lignes.filter(l => (l.modePaiement || '').toLowerCase() === modePaiement.toLowerCase());
    }

    if (typePatient && typePatient !== 'TOUS') {
      lignes = lignes.filter(l => {
        const tp = (l.typePatient || '').toUpperCase();
        if (typePatient === 'NON ASSURE') return tp === 'NON' || tp === '' || tp === 'NON ASSURE';
        if (typePatient === 'ASSURE') return tp === 'OUI' || tp === 'ASSURE';
        if (typePatient === 'MUTUALISTE') return tp === 'MUTUALISTE';
        return true;
      });
    }

    lignes.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const headers = ['date', 'patient', 'assurance', 'designation', 'typeActe', 'montantTotal', 'partAssurance', 'partPatient', 'montantEncaisse', 'remise', 'resteAPayer', 'medecin', 'modePaiement', 'typePatient'];
    const labels: Record<string, string> = {
      date: 'Date',
      patient: 'Patient',
      assurance: 'Assurance',
      designation: 'Désignation',
      typeActe: 'Type',
      montantTotal: 'Montant total',
      partAssurance: 'Part assurance',
      partPatient: 'Part patient',
      montantEncaisse: 'Encaissé',
      remise: 'Remise',
      resteAPayer: 'Reste à payer',
      medecin: 'Médecin',
      modePaiement: 'Mode de paiement',
      typePatient: 'Type patient',
    };

    const rows = lignes.map((l: any) => ({
      date: formatDateFr(l.date),
      patient: l.patient,
      assurance: l.assurance,
      designation: l.designation,
      typeActe: l.typeActe,
      montantTotal: formatMontant(l.montantTotal),
      partAssurance: formatMontant(l.partAssurance),
      partPatient: formatMontant(l.partPatient),
      montantEncaisse: formatMontant(l.montantEncaisse),
      remise: formatMontant(l.remise),
      resteAPayer: formatMontant(l.resteAPayer),
      medecin: l.medecin,
      modePaiement: l.modePaiement,
      typePatient: l.typePatient,
    }));

    return sendExport(rows, headers, `bilan_${dateDebut}_${dateFin}`, format, labels);
  } catch (error) {
    console.error('Erreur export bilan:', error);
    return new Response('Erreur serveur', { status: 500 });
  }
}
