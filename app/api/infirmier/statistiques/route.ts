import { NextRequest, NextResponse } from 'next/server';
import { withTenant } from '@/lib/withTenant';
import { getTenantModel } from '@/lib/tenantModels';
import { IConsultation } from '@/models/consultation';
import { IExamenHospitalisation } from '@/models/examenHospit';
import { ISoinHospitalisation } from '@/models/hospitalisation/SoinHospitalisation';
import { IConstanteHospitalisation } from '@/models/hospitalisation/ConstanteHospitalisation';
import { ITypeActe } from '@/models/TypeActe';
import { IMedecin } from '@/models/medecin';

const READ_ROLES = ['admin', 'infirmier', 'medecin', 'accueil', 'comptable'];

const SOIN_COLORS: Record<string, string> = {
  perfusion: '#0d6efd',
  injection: '#20c997',
  pansement: '#fd7e14',
  oxygene: '#0dcaf0',
  sonde: '#6f42c1',
  observation: '#ffc107',
  prelevement: '#dc3545',
  autre: '#6c757d'
};

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
  const ExamenHospitalisation = getTenantModel<IExamenHospitalisation>(context.connection, 'ExamenHospitalisation');
  const SoinHospitalisation = getTenantModel<ISoinHospitalisation>(context.connection, 'SoinHospitalisation');
  const ConstanteHospitalisation = getTenantModel<IConstanteHospitalisation>(context.connection, 'ConstanteHospitalisation');
  const TypeActe = getTenantModel<ITypeActe>(context.connection, 'TypeActe');
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

    const actesHospitalisation = await TypeActe.find({ Hospitalisation: true }).lean();
    const designationActes = actesHospitalisation.map((a: any) => a.Designation).filter(Boolean);

    const baseConsultationQuery: any = {
      Date_consulation: { $gte: periodeDebut, $lte: periodeFin }
    };
    const consultations = await Consultation.find(baseConsultationQuery).lean();

    const baseHospitQuery: any = {
      Entrele: { $gte: periodeDebut, $lte: periodeFin },
      Designationtypeacte: { $in: designationActes }
    };
    const hospitalisations = await ExamenHospitalisation.find(baseHospitQuery).lean();

    const soins = await SoinHospitalisation.find({ date: { $gte: periodeDebut, $lte: periodeFin } }).lean();
    const constantesHospit = await ConstanteHospitalisation.find({ date: { $gte: periodeDebut, $lte: periodeFin } }).lean();

    let consultationsAvecConstantes = 0;
    const parMoisMap = new Map<string, { consultations: number; constantes: number; hospitalisations: number; soins: number; constantesHospit: number; total: number }>();
    const parJourMap = new Map<string, { consultations: number; constantes: number; hospitalisations: number; soins: number; constantesHospit: number; total: number }>();
    const parMedecinMap = new Map<string, { medecinId: string; nom: string; total: number; consultations: number; hospitalisations: number; soins: number }>();

    for (const c of consultations as any[]) {
      const hasConstantes = !!(c.Temperature || c.Poids || c.Tension || c.Glycemie || c.TailleCons);
      if (hasConstantes) consultationsAvecConstantes++;

      const mois = toMonth(c.Date_consulation);
      if (mois) {
        const entry = parMoisMap.get(mois) || { consultations: 0, constantes: 0, hospitalisations: 0, soins: 0, constantesHospit: 0, total: 0 };
        entry.consultations++;
        entry.total++;
        if (hasConstantes) entry.constantes++;
        parMoisMap.set(mois, entry);
      }

      const jour = toDay(c.Date_consulation);
      if (jour) {
        const entry = parJourMap.get(jour) || { consultations: 0, constantes: 0, hospitalisations: 0, soins: 0, constantesHospit: 0, total: 0 };
        entry.consultations++;
        entry.total++;
        if (hasConstantes) entry.constantes++;
        parJourMap.set(jour, entry);
      }

      const medecinId = String(c.IDMEDECIN || 'inconnu');
      const medEntry = parMedecinMap.get(medecinId) || {
        medecinId,
        nom: c.Medecin || 'Médecin inconnu',
        total: 0,
        consultations: 0,
        hospitalisations: 0,
        soins: 0
      };
      medEntry.total++;
      medEntry.consultations++;
      parMedecinMap.set(medecinId, medEntry);
    }

    let hospitalisationsEnCours = 0;
    for (const h of hospitalisations as any[]) {
      const isEnCours = h.statutHospitalisation === 'en_cours' || (h.SortieLe && new Date(h.SortieLe) >= today);
      if (isEnCours) hospitalisationsEnCours++;

      const mois = toMonth(h.Entrele);
      if (mois) {
        const entry = parMoisMap.get(mois) || { consultations: 0, constantes: 0, hospitalisations: 0, soins: 0, constantesHospit: 0, total: 0 };
        entry.hospitalisations++;
        entry.total++;
        parMoisMap.set(mois, entry);
      }

      const jour = toDay(h.Entrele);
      if (jour) {
        const entry = parJourMap.get(jour) || { consultations: 0, constantes: 0, hospitalisations: 0, soins: 0, constantesHospit: 0, total: 0 };
        entry.hospitalisations++;
        entry.total++;
        parJourMap.set(jour, entry);
      }

      const medecinId = String(h.idMedecin || 'inconnu');
      const medEntry = parMedecinMap.get(medecinId) || {
        medecinId,
        nom: h.NomMed || 'Médecin inconnu',
        total: 0,
        consultations: 0,
        hospitalisations: 0,
        soins: 0
      };
      medEntry.total++;
      medEntry.hospitalisations++;
      parMedecinMap.set(medecinId, medEntry);
    }

    const parTypeSoinsMap = new Map<string, number>();
    for (const s of soins as any[]) {
      const mois = toMonth(s.date);
      if (mois) {
        const entry = parMoisMap.get(mois) || { consultations: 0, constantes: 0, hospitalisations: 0, soins: 0, constantesHospit: 0, total: 0 };
        entry.soins++;
        entry.total++;
        parMoisMap.set(mois, entry);
      }

      const jour = toDay(s.date);
      if (jour) {
        const entry = parJourMap.get(jour) || { consultations: 0, constantes: 0, hospitalisations: 0, soins: 0, constantesHospit: 0, total: 0 };
        entry.soins++;
        entry.total++;
        parJourMap.set(jour, entry);
      }

      const type = s.type || 'autre';
      parTypeSoinsMap.set(type, (parTypeSoinsMap.get(type) || 0) + 1);
    }

    for (const ch of constantesHospit as any[]) {
      const mois = toMonth(ch.date);
      if (mois) {
        const entry = parMoisMap.get(mois) || { consultations: 0, constantes: 0, hospitalisations: 0, soins: 0, constantesHospit: 0, total: 0 };
        entry.constantesHospit++;
        parMoisMap.set(mois, entry);
      }

      const jour = toDay(ch.date);
      if (jour) {
        const entry = parJourMap.get(jour) || { consultations: 0, constantes: 0, hospitalisations: 0, soins: 0, constantesHospit: 0, total: 0 };
        entry.constantesHospit++;
        parJourMap.set(jour, entry);
      }
    }

    const medecins = await Medecin.find({}).select('nom prenoms specialite').lean();
    const medecinMap = new Map<string, any>();
    medecins.forEach((m: any) => medecinMap.set(String(m._id), m));

    const parMedecin = Array.from(parMedecinMap.values())
      .map((m: any) => {
        const med = medecinMap.get(m.medecinId);
        return {
          ...m,
          nom: med ? `${med.nom || ''} ${med.prenoms || ''}`.trim() : m.nom
        };
      })
      .sort((a: any, b: any) => b.total - a.total)
      .slice(0, 10);

    const parMois = Array.from(parMoisMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([mois, value]) => ({ mois, ...value }));

    const parJour = Array.from(parJourMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([jour, value]) => ({ jour, ...value }));

    const parTypeSoins = Array.from(parTypeSoinsMap.entries())
      .map(([label, value]) => ({ label, value, color: SOIN_COLORS[label] || '#6c757d' }));

    return NextResponse.json({
      totals: {
        consultations: consultations.length,
        consultationsAvecConstantes,
        hospitalisations: hospitalisations.length,
        hospitalisationsEnCours,
        soins: soins.length,
        constantesHospit: constantesHospit.length
      },
      parTypeSoins,
      parMois,
      parJour,
      parMedecin
    });

  } catch (error: any) {
    console.error('Erreur statistiques infirmier:', error);
    return NextResponse.json({
      error: 'Erreur lors du chargement des statistiques',
      details: error.message
    }, { status: 500 });
  }
}
