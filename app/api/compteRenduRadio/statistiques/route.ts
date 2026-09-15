import { NextRequest, NextResponse } from 'next/server';
import { withTenant } from '@/lib/withTenant';
import { getTenantModel } from '@/lib/tenantModels';
import { ILignePrestation } from '@/models/lignePrestation';
import { IParametreCRendu } from '@/models/ParametreCRendu';

const ROLES = ['admin', 'medecin', 'radiologue'];

function formatMonth(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function parseDate(value: any): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

function diffHours(d1: Date | null, d2: Date | null): number | null {
  if (!d1 || !d2) return null;
  const ms = d2.getTime() - d1.getTime();
  if (ms < 0) return null;
  return Math.round((ms / (1000 * 60 * 60)) * 10) / 10;
}

export async function GET(request: NextRequest) {
  const { context, response: tenantErrorResponse } = await withTenant(request, ROLES);
  if (!context) return tenantErrorResponse;
  const { connection } = context;
  const LignePrestation = getTenantModel<ILignePrestation>(connection, 'LignePrestation');
  const ParametreCRendu = getTenantModel<IParametreCRendu>(connection, 'ParametreCRendu');

  try {
    const { searchParams } = new URL(request.url);
    const dateDebut = searchParams.get('dateDebut');
    const dateFin = searchParams.get('dateFin');

    const parametresCR = await ParametreCRendu.find({});
    const lettresClesDisponibles = parametresCR.map(p => p.LettreCle);

    const baseQuery: any = {
      statutPrescriptionMedecin: 3,
    };

    if (lettresClesDisponibles.length > 0) {
      baseQuery.lettreCle = { $in: lettresClesDisponibles };
    }

    if (dateDebut || dateFin) {
      baseQuery.dateLignePrestation = {};
      if (dateDebut) baseQuery.dateLignePrestation.$gte = new Date(dateDebut);
      if (dateFin) baseQuery.dateLignePrestation.$lte = new Date(dateFin);
    }

    const lignes = await LignePrestation.find(baseQuery)
      .select('dateLignePrestation dateSaisieResultat compteRenduValideLe compteRenduValidePar resultatSaisiePar medecinExecutant lettreCle sexe agePatient')
      .lean();

    let totalExamens = 0;
    let aSaisir = 0;
    let enAttente = 0;
    let valides = 0;

    const parMoisMap = new Map<string, { total: number; valides: number; attente: number; asaisir: number }>();
    const parLettreCleMap = new Map<string, number>();
    const parMedecinMap = new Map<string, number>();
    const parSexeMap = new Map<string, number>();

    const delaisSaisie: number[] = [];
    const delaisValidation: number[] = [];

    for (const ligne of lignes as any[]) {
      totalExamens++;

      const isSaisi = ligne.resultatSaisiePar && ligne.resultatSaisiePar.trim() !== '';
      const isValide = ligne.compteRenduValidePar && ligne.compteRenduValidePar.trim() !== '';

      if (isValide) {
        valides++;
      } else if (isSaisi) {
        enAttente++;
      } else {
        aSaisir++;
      }

      const datePrestation = parseDate(ligne.dateLignePrestation);
      if (datePrestation) {
        const mois = formatMonth(datePrestation);
        const entry = parMoisMap.get(mois) || { total: 0, valides: 0, attente: 0, asaisir: 0 };
        entry.total++;
        if (isValide) entry.valides++;
        else if (isSaisi) entry.attente++;
        else entry.asaisir++;
        parMoisMap.set(mois, entry);
      }

      const lc = ligne.lettreCle || 'Non défini';
      parLettreCleMap.set(lc, (parLettreCleMap.get(lc) || 0) + 1);

      const medecin = ligne.medecinExecutant || 'Non attribué';
      parMedecinMap.set(medecin, (parMedecinMap.get(medecin) || 0) + 1);

      const sexe = ligne.sexe || 'Non précisé';
      parSexeMap.set(sexe, (parSexeMap.get(sexe) || 0) + 1);

      const dateSaisie = parseDate(ligne.dateSaisieResultat);
      if (datePrestation && dateSaisie) {
        const h = diffHours(datePrestation, dateSaisie);
        if (h !== null) delaisSaisie.push(h);
      }

      if (dateSaisie && isValide) {
        const dateValidation = parseDate(ligne.compteRenduValideLe);
        const h = diffHours(dateSaisie, dateValidation);
        if (h !== null) delaisValidation.push(h);
      }
    }

    const parMois = Array.from(parMoisMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([mois, value]) => ({ mois, ...value }));

    const parLettreCle = Array.from(parLettreCleMap.entries())
      .sort(([, a], [, b]) => b - a)
      .map(([lettreCle, total]) => ({ lettreCle, total }));

    const parMedecinExecutant = Array.from(parMedecinMap.entries())
      .sort(([, a], [, b]) => b - a)
      .map(([medecin, total]) => ({ medecin, total }));

    const parSexe = Array.from(parSexeMap.entries())
      .map(([sexe, total]) => ({ sexe, total }));

    const moyenne = (arr: number[]) => arr.length === 0 ? 0 : Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10;

    return NextResponse.json({
      totalExamens,
      aSaisir,
      enAttente,
      valides,
      parMois,
      parLettreCle,
      parMedecinExecutant,
      parSexe,
      delaiMoyenSaisie: moyenne(delaisSaisie),
      delaiMoyenValidation: moyenne(delaisValidation)
    });

  } catch (error: any) {
    console.error('Erreur dans statistiques radio:', error);
    return NextResponse.json(
      {
        error: 'Erreur lors du chargement des statistiques',
        details: error.message,
        totalExamens: 0,
        aSaisir: 0,
        enAttente: 0,
        valides: 0,
        parMois: [],
        parLettreCle: [],
        parMedecinExecutant: [],
        parSexe: [],
        delaiMoyenSaisie: 0,
        delaiMoyenValidation: 0
      },
      { status: 500 }
    );
  }
}
