import { NextRequest, NextResponse } from 'next/server';
import { withTenant } from '@/lib/withTenant';
import { getTenantModel } from '@/lib/tenantModels';
import { IConsultation } from '@/models/consultation';
import { IRendezVous } from '@/models/RendezVous';
import { IMedecin } from '@/models/medecin';

const READ_ROLES = ['admin', 'accueil', 'medecin', 'comptable', 'infirmier'];

function startOfDay(d: Date) {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  return date;
}

function endOfDay(d: Date) {
  const date = new Date(d);
  date.setHours(23, 59, 59, 999);
  return date;
}

function toMonth(d: any): string | null {
  const date = d ? new Date(d) : null;
  return date && !isNaN(date.getTime())
    ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    : null;
}

function toDay(d: any): string | null {
  const date = d ? new Date(d) : null;
  return date && !isNaN(date.getTime())
    ? date.toISOString().split('T')[0]
    : null;
}

export async function GET(req: NextRequest) {
  const { context, response } = await withTenant(req, READ_ROLES);
  if (!context) return response;

  const Consultation = getTenantModel<IConsultation>(context.connection, 'Consultation');
  const RendezVous = getTenantModel<IRendezVous>(context.connection, 'RendezVous');
  const Medecin = getTenantModel<IMedecin>(context.connection, 'Medecin');

  try {
    const { searchParams } = new URL(req.url);
    const dateDebut = searchParams.get('dateDebut');
    const dateFin = searchParams.get('dateFin');

    const today = new Date();
    const startToday = startOfDay(today);
    const endToday = endOfDay(today);

    const periodeDebut = dateDebut ? new Date(dateDebut) : startToday;
    const periodeFin = dateFin ? endOfDay(new Date(dateFin)) : endToday;

    const baseConsultationQuery: any = {
      Date_consulation: { $gte: periodeDebut, $lte: periodeFin }
    };

    const consultations = await Consultation.find(baseConsultationQuery).lean();

    let recus = 0;
    let salleAttente = 0;
    let enCours = 0;
    let transferts = 0;
    let constantes = 0;

    const parMoisMap = new Map<string, { recus: number; salleAttente: number; transferts: number; constantes: number; total: number }>();
    const parJourMap = new Map<string, { total: number; recus: number; salleAttente: number }>();
    const parMedecinMap = new Map<string, { medecinId: string; nom: string; total: number; recus: number; salleAttente: number; transferts: number; constantes: number }>();

    for (const c of consultations as any[]) {
      const isRecu = c.StatutC === true;
      const isSalleAttente = c.AttenteAccueil === false && c.StatutC === false;
      const isEnCours = c.AttenteAccueil === 1 && c.StatutC === false;
      const hasConstantes = !!(c.Temperature || c.Poids || c.Tension || c.Glycemie || c.TailleCons);
      const isTransfert = !!c.datetransfert && c.datetransfert >= periodeDebut && c.datetransfert <= periodeFin;

      if (isRecu) recus++;
      if (isSalleAttente) salleAttente++;
      if (isEnCours) enCours++;
      if (isTransfert) transferts++;
      if (hasConstantes) constantes++;

      const mois = toMonth(c.Date_consulation);
      if (mois) {
        const entry = parMoisMap.get(mois) || { recus: 0, salleAttente: 0, transferts: 0, constantes: 0, total: 0 };
        entry.total++;
        if (isRecu) entry.recus++;
        if (isSalleAttente) entry.salleAttente++;
        if (isTransfert) entry.transferts++;
        if (hasConstantes) entry.constantes++;
        parMoisMap.set(mois, entry);
      }

      const jour = toDay(c.Date_consulation);
      if (jour) {
        const entry = parJourMap.get(jour) || { total: 0, recus: 0, salleAttente: 0 };
        entry.total++;
        if (isRecu) entry.recus++;
        if (isSalleAttente) entry.salleAttente++;
        parJourMap.set(jour, entry);
      }

      const medecinId = String(c.IDMEDECIN || 'inconnu');
      const medEntry = parMedecinMap.get(medecinId) || {
        medecinId,
        nom: c.Medecin || 'Médecin inconnu',
        total: 0,
        recus: 0,
        salleAttente: 0,
        transferts: 0,
        constantes: 0
      };
      medEntry.total++;
      if (isRecu) medEntry.recus++;
      if (isSalleAttente) medEntry.salleAttente++;
      if (isTransfert) medEntry.transferts++;
      if (hasConstantes) medEntry.constantes++;
      parMedecinMap.set(medecinId, medEntry);
    }

    const rdvQuery: any = {
      DatePlanning: { $gte: periodeDebut, $lte: periodeFin }
    };
    const rdvs = await RendezVous.find(rdvQuery).lean();

    let rdvTotal = 0;
    let rdvConfirmes = 0;
    let rdvReportes = 0;
    let rdvAnnules = 0;
    let rdvEnCours = 0;
    let rdvDuJour = 0;

    const parMoisRdvMap = new Map<string, { total: number; confirmes: number; reportes: number; annules: number }>();

    for (const r of rdvs as any[]) {
      rdvTotal++;
      const datePlanning = r.DatePlanning ? new Date(r.DatePlanning) : null;
      if (datePlanning && datePlanning >= startToday && datePlanning <= endToday) rdvDuJour++;

      if (r.StatutRdv === '2') rdvConfirmes++;
      else if (r.StatutRdv === '4') rdvReportes++;
      else if (r.StatutRdv === '3') rdvAnnules++;
      else if (r.StatutRdv === '1') rdvEnCours++;

      const mois = toMonth(r.DatePlanning);
      if (mois) {
        const entry = parMoisRdvMap.get(mois) || { total: 0, confirmes: 0, reportes: 0, annules: 0 };
        entry.total++;
        if (r.StatutRdv === '2') entry.confirmes++;
        if (r.StatutRdv === '4') entry.reportes++;
        if (r.StatutRdv === '3') entry.annules++;
        parMoisRdvMap.set(mois, entry);
      }
    }

    const medecins = await Medecin.find({}).select('nom prenoms specialite').lean();
    const medecinMap = new Map<string, any>();
    medecins.forEach(m => medecinMap.set(String(m._id), m));

    const parMedecin = Array.from(parMedecinMap.values())
      .map(m => {
        const med = medecinMap.get(m.medecinId);
        return {
          ...m,
          nom: med ? `${med.nom || ''} ${med.prenoms || ''}`.trim() : m.nom
        };
      })
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    const parMois = Array.from(parMoisMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([mois, value]) => ({ mois, ...value }));

    const parMoisRdv = Array.from(parMoisRdvMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([mois, value]) => ({ mois, ...value }));

    const parJour = Array.from(parJourMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([jour, value]) => ({ jour, ...value }));

    return NextResponse.json({
      totals: {
        consultations: consultations.length,
        recus,
        salleAttente,
        enCours,
        transferts,
        constantes,
        rdvTotal,
        rdvDuJour,
        rdvConfirmes,
        rdvReportes,
        rdvAnnules,
        rdvEnCours
      },
      parStatus: [
        { label: 'Confirmés', value: rdvConfirmes, color: '#198754' },
        { label: 'En cours', value: rdvEnCours, color: '#0d6efd' },
        { label: 'Reportés', value: rdvReportes, color: '#ffc107' },
        { label: 'Annulés', value: rdvAnnules, color: '#dc3545' }
      ],
      parMois,
      parMoisRdv,
      parMedecin,
      parJour
    });

  } catch (error: any) {
    console.error('Erreur statistiques accueil:', error);
    return NextResponse.json({
      error: 'Erreur lors du chargement des statistiques',
      details: error.message
    }, { status: 500 });
  }
}
