import { NextRequest, NextResponse } from 'next/server';
import { withTenant } from '@/lib/withTenant';
import { getTenantModel } from '@/lib/tenantModels';
import { IRendezVous } from '@/models/RendezVous';
import { IPlanningMed } from '@/models/PlanningMed';
import { IMedecin } from '@/models/medecin';

const READ_ROLES = ['admin', 'medecin', 'accueil', 'comptable', 'infirmier', 'radiologue'];

function toISODate(d: any): string | null {
  const date = d ? new Date(d) : null;
  return date && !isNaN(date.getTime()) ? date.toISOString().split('T')[0] : null;
}

function toMonth(d: any): string | null {
  const date = d ? new Date(d) : null;
  return date && !isNaN(date.getTime())
    ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    : null;
}

export async function GET(request: NextRequest) {
  const { context, response } = await withTenant(request, READ_ROLES);
  if (!context) return response;

  const RendezVous = getTenantModel<IRendezVous>(context.connection, 'RendezVous');
  const PlanningMed = getTenantModel<IPlanningMed>(context.connection, 'PlanningMed');
  const Medecin = getTenantModel<IMedecin>(context.connection, 'Medecin');

  try {
    const { searchParams } = new URL(request.url);
    const dateDebut = searchParams.get('dateDebut');
    const dateFin = searchParams.get('dateFin');

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const rdvQuery: any = {};
    const planningQuery: any = {};
    if (dateDebut || dateFin) {
      rdvQuery.DatePlanning = {};
      planningQuery.DateDebut = {};
      if (dateDebut) {
        const d = new Date(dateDebut);
        rdvQuery.DatePlanning.$gte = d;
        planningQuery.DateDebut.$gte = d;
      }
      if (dateFin) {
        const d = new Date(dateFin);
        d.setHours(23, 59, 59, 999);
        rdvQuery.DatePlanning.$lte = d;
        planningQuery.DateDebut.$lte = d;
      }
    }

    const [rdvs, plannings, medecins] = await Promise.all([
      RendezVous.find(rdvQuery).lean(),
      PlanningMed.find(planningQuery).lean(),
      Medecin.find({}).select('nom prenoms specialite').lean()
    ]);

    const medecinMap = new Map<string, { nom: string; prenoms: string; specialite?: string }>();
    medecins.forEach(m => medecinMap.set(String(m._id), { nom: m.nom, prenoms: m.prenoms, specialite: m.specialite }));

    let total = 0;
    let pris = 0;
    let disponibles = 0;
    let presents = 0;
    let enCours = 0;
    let annules = 0;
    let reportes = 0;
    let rdvDuJour = 0;

    const parMoisMap = new Map<string, { total: number; pris: number; presents: number; annules: number; reportes: number }>();
    const parMedecinMap = new Map<string, { medecinId: string; nom: string; total: number; pris: number; presents: number; annules: number; reportes: number }>();
    const parJourMap = new Map<string, number>();

    for (const rdv of rdvs as any[]) {
      total++;

      const datePlanning = rdv.DatePlanning ? new Date(rdv.DatePlanning) : null;
      const isJour = datePlanning && datePlanning >= today && datePlanning < tomorrow;
      if (isJour) rdvDuJour++;

      const mois = toMonth(rdv.DatePlanning);
      if (mois) {
        const entry = parMoisMap.get(mois) || { total: 0, pris: 0, presents: 0, annules: 0, reportes: 0 };
        entry.total++;
        parMoisMap.set(mois, entry);
      }

      const jour = toISODate(rdv.DatePlanning);
      if (jour) {
        parJourMap.set(jour, (parJourMap.get(jour) || 0) + 1);
      }

      const medId = String(rdv.IDMEDECIN || 'inconnu');
      const medecinInfo = medecinMap.get(medId);
      const medEntry = parMedecinMap.get(medId) || {
        medecinId: medId,
        nom: medecinInfo ? `${medecinInfo.nom} ${medecinInfo.prenoms}` : 'Médecin inconnu',
        total: 0, pris: 0, presents: 0, annules: 0, reportes: 0
      };
      medEntry.total++;
      parMedecinMap.set(medId, medEntry);

      if (rdv.Statutrdvpris) {
        pris++;
        if (mois) {
          const entry = parMoisMap.get(mois)!;
          entry.pris++;
        }
        medEntry.pris++;

        switch (rdv.StatutRdv) {
          case '2':
            presents++;
            if (mois) parMoisMap.get(mois)!.presents++;
            medEntry.presents++;
            break;
          case '3':
            annules++;
            if (mois) parMoisMap.get(mois)!.annules++;
            medEntry.annules++;
            break;
          case '4':
            reportes++;
            if (mois) parMoisMap.get(mois)!.reportes++;
            medEntry.reportes++;
            break;
          default:
            enCours++;
            break;
        }
      } else {
        disponibles++;
      }
    }

    const capaciteTotale = plannings.reduce((sum, p) => sum + (p.TotalRDV || 0), 0);
    const capaciteRestante = plannings.reduce((sum, p) => sum + (p.ResteRDV || 0), 0);
    const capaciteOccupee = capaciteTotale - capaciteRestante;

    const tauxOccupation = capaciteTotale > 0 ? Math.round((capaciteOccupee / capaciteTotale) * 100) : 0;
    const tauxPresence = pris > 0 ? Math.round((presents / pris) * 100) : 0;
    const tauxAnnulation = pris > 0 ? Math.round((annules / pris) * 100) : 0;
    const tauxReport = pris > 0 ? Math.round((reportes / pris) * 100) : 0;

    const parMois = Array.from(parMoisMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([mois, value]) => ({ mois, ...value }));

    const parMedecin = Array.from(parMedecinMap.values())
      .sort((a, b) => b.total - a.total);

    const parJour = Array.from(parJourMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([jour, total]) => ({ jour, total }));

    return NextResponse.json({
      totals: {
        total,
        pris,
        disponibles,
        presents,
        enCours,
        annules,
        reportes,
        rdvDuJour
      },
      taux: {
        occupation: tauxOccupation,
        presence: tauxPresence,
        annulation: tauxAnnulation,
        report: tauxReport
      },
      capacite: {
        totale: capaciteTotale,
        occupee: capaciteOccupee,
        restante: capaciteRestante
      },
      parStatus: [
        { label: 'Présents', value: presents, color: '#198754' },
        { label: 'En cours', value: enCours, color: '#0d6efd' },
        { label: 'Annulés', value: annules, color: '#dc3545' },
        { label: 'Reportés', value: reportes, color: '#ffc107' },
        { label: 'Disponibles', value: disponibles, color: '#6c757d' }
      ],
      parMois,
      parMedecin,
      parJour
    });

  } catch (error: any) {
    console.error('Erreur statistiques rendez-vous globales:', error);
    return NextResponse.json({
      error: 'Erreur lors du chargement des statistiques',
      details: error.message
    }, { status: 500 });
  }
}
