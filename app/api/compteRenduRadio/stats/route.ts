import { NextRequest, NextResponse } from 'next/server';
import { withTenant } from '@/lib/withTenant';
import { getTenantModel } from '@/lib/tenantModels';
import { ILignePrestation } from '@/models/lignePrestation';
import { IParametreCRendu } from '@/models/ParametreCRendu';

const ROLES = ['admin', 'medecin', 'accueil', 'infirmier', 'radiologue'];

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

    const [aSaisir, enAttente, valides, patients] = await Promise.all([
      LignePrestation.countDocuments({
        ...baseQuery,
        resultatSaisiePar: { $in: [null, '', undefined] },
        compteRenduValidePar: { $in: [null, '', undefined] }
      }),
      LignePrestation.countDocuments({
        ...baseQuery,
        resultatSaisiePar: { $nin: [null, '', undefined] },
        compteRenduValidePar: { $in: [null, '', undefined] }
      }),
      LignePrestation.countDocuments({
        ...baseQuery,
        compteRenduValidePar: { $nin: [null, '', undefined] }
      }),
      LignePrestation.distinct('IdPatient', baseQuery)
    ]);

    return NextResponse.json({
      aSaisir,
      enAttente,
      valides,
      totalPatients: patients.length,
      total: aSaisir + enAttente + valides
    });

  } catch (error: any) {
    console.error('Erreur dans stats radio:', error);
    return NextResponse.json(
      {
        error: 'Erreur lors du chargement des statistiques',
        details: error.message,
        aSaisir: 0,
        enAttente: 0,
        valides: 0,
        totalPatients: 0,
        total: 0
      },
      { status: 500 }
    );
  }
}
