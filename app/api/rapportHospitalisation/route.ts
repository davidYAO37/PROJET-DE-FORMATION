import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/mongoConnect';
import { Patient } from '@/models/patient';
import { RapportHospitalisation } from '@/models/rapportHospitalisation';

export async function GET(request: NextRequest) {
  try {
    await db();

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const filter: any = {};

    if (patientId) {
      filter.patientId = patientId;
    }

    const skip = (page - 1) * limit;
    const rapports = await RapportHospitalisation.find(filter)
      .sort({ dateCreation: -1 })
      .skip(skip)
      .limit(limit);

    const total = await RapportHospitalisation.countDocuments(filter);

    return NextResponse.json({
      success: true,
      data: rapports,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Erreur lors de la récupération des rapports d\'hospitalisation:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await db();

    const body = await request.json();
    const {
      patientId,
      dateEntree,
      dateSortie,
      service,
      motifHospitalisation,
      diagnosticAdmission,
      diagnosticFinal,
      histoireMaladie,
      examenClinique,
      traitementAdministre,
      evolution,
      suitesHospitalisation,
      medecinTraitant,
      recommandations,
    } = body;

    if (
      !patientId ||
      !dateEntree ||
      !dateSortie ||
      !service ||
      !motifHospitalisation ||
      !diagnosticAdmission ||
      !diagnosticFinal ||
      !histoireMaladie ||
      !examenClinique ||
      !traitementAdministre ||
      !evolution ||
      !suitesHospitalisation ||
      !medecinTraitant ||
      !recommandations
    ) {
      return NextResponse.json(
        { success: false, error: 'Champs requis manquants' },
        { status: 400 }
      );
    }

    const dateEntreeObj = new Date(dateEntree);
    const dateSortieObj = new Date(dateSortie);
    if (isNaN(dateEntreeObj.getTime()) || isNaN(dateSortieObj.getTime()) || dateSortieObj < dateEntreeObj) {
      return NextResponse.json(
        { success: false, error: 'Les dates d\'hospitalisation sont invalides ou incohérentes' },
        { status: 400 }
      );
    }

    const patient = await Patient.findById(patientId);
    if (!patient) {
      return NextResponse.json(
        { success: false, error: 'Patient non trouvé' },
        { status: 404 }
      );
    }

    const dureeHospitalisation = Math.max(
      1,
      Math.ceil((dateSortieObj.getTime() - dateEntreeObj.getTime()) / (1000 * 60 * 60 * 24))
    );

    const nouveauRapport = new RapportHospitalisation({
      ...body,
      patientNom: patient.Nom,
      patientPrenoms: patient.Prenoms,
      dateEntree: dateEntreeObj,
      dateSortie: dateSortieObj,
      dateRapport: body.dateRapport ? new Date(body.dateRapport) : new Date(),
      dureeHospitalisation,
    });

    await nouveauRapport.save();

    return NextResponse.json({
      success: true,
      message: 'Rapport d\'hospitalisation créé avec succès',
      data: nouveauRapport,
    });
  } catch (error: any) {
    console.error('Erreur lors de la création du rapport d\'hospitalisation:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
