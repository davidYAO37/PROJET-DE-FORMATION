import { NextRequest, NextResponse } from 'next/server';
import { EncaissementCaisse, IEncaissementCaisse } from '@/models/EncaissementCaisse';
import { db } from '@/db/mongoConnect';
import { Facturation } from '@/models/Facturation';
import { Consultation } from '@/models/consultation';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  await db();
  const body = await req.json();
  try {
    // Logique WinDev : vérifier le type et actualiser en conséquence
    let nMoncompteur = 1;
    let gnDejapaye = 0;

    if (body.type === "consultation") {
      // CAS "consultation"
      // On actualise le compte client

      const consultation = await Consultation.findById(body.IDCONSULTATION);

      if (consultation) {
        // Vérifier si tout est encaissé
        const resteAPayer = body.TotalapayerPatient || 0;
        const montantClient = body.Montantencaisse || 0;

        if (resteAPayer === montantClient) {
          consultation.Toutencaisse = true;
        } else {
          consultation.Toutencaisse = false;
        }
        await consultation.save();

        // On cherche le nombre et le montant déjà encaissé pour la consultation
        const encaissementsExistants = await EncaissementCaisse.find({ IDCONSULTATION: String(body.IDCONSULTATION) });
        nMoncompteur = encaissementsExistants.length + 1;
        gnDejapaye = encaissementsExistants.reduce((sum, enc) => sum + (enc.Montantencaisse || 0), 0);

        // Créer l'encaissement selon la logique WinDev
        const nouvelEncaissement = new EncaissementCaisse({
          DatePrest: consultation.Date_consulation,
          Patient: `${consultation.PatientP} --Encaissement-- Consultation du ${new Date(consultation.Date_consulation).toLocaleDateString()} N°${nMoncompteur}`,
          Assurance: consultation.assurance,
          Designation: consultation.designationC,
          Restapayer: -montantClient,
          Medecin: consultation.Medecin,
          Utilisateur: body.Utilisateur || 'Utilisateur',
          IDCONSULTATION: String(consultation._id),
          DateEncaissement: new Date(),
          Montantencaisse: montantClient,
          HeureEncaissement: new Date().toTimeString(),
          Modepaiement: body.Modepaiement,
          TotalapayerPatient: resteAPayer,
          restapayerBilan: (resteAPayer - montantClient).toString(),
          Assure: consultation.Assure,
          IdPatient: consultation.PatientP,
          AnnulationOrdonneLe: '',
          annulationOrdonnepar: ''
        });

        await nouvelEncaissement.save();
      }
    } else {
      // AUTRE CAS (facturation)
      // On actualise le compte client

      const facturation = await Facturation.findById(body.IDFACTURATION);



      if (facturation) {


        // On cherche le nombre et le montant déjà encaissé pour la facturation
        const encaissementsExistants = await EncaissementCaisse.find({ IDFACTURATION: String(body.IDFACTURATION) });
        nMoncompteur = encaissementsExistants.length + 1;
        gnDejapaye = encaissementsExistants.reduce((sum, enc) => sum + (enc.Montantencaisse || 0), 0);

        // Créer l'encaissement selon la logique WinDev
        const nouvelEncaissement = new EncaissementCaisse({
          DatePrest: facturation.DatePres || facturation.DateFacturation || new Date(),
          Patient: `${facturation.PatientP} --Encaissement-- Prestation du ${new Date(facturation.DateFacturation || new Date()).toLocaleDateString()} N°${nMoncompteur}`,
          Assurance: facturation.Assurance,
          Designation: facturation.Designationtypeacte,
          Restapayer: -body.Montantencaisse,
          Medecin: facturation.NomMed,
          Utilisateur: body.Utilisateur || 'Utilisateur',
          IDFACTURATION: String(facturation._id),
          DateEncaissement: new Date(),
          Montantencaisse: body.Montantencaisse,
          HeureEncaissement: new Date().toTimeString(),
          Modepaiement: body.Modepaiement,
          TotalapayerPatient: body.TotalapayerPatient || 0,
          restapayerBilan: ((body.montantClient || 0) - body.Montantencaisse).toString(),
          Assure: facturation.Assure,
          IdPatient: facturation.PatientP,
          AnnulationOrdonneLe: '',
          annulationOrdonnepar: ''
        });

        await nouvelEncaissement.save();

        /*  // Mettre à jour la facturation pour réduire le reste à payer
         await Facturation.findByIdAndUpdate(body.IDFACTURATION, {
             $inc: { Restapayer: -body.Montantencaisse }
         }); */
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Encaissement enregistré avec succès selon la logique WinDev',
        data: { nMoncompteur, gnDejapaye }
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Erreur lors de l\'enregistrement de l\'encaissement:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Erreur lors de l\'enregistrement de l\'encaissement',
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await db();

    const { searchParams } = new URL(request.url);
    const idFacturation = searchParams.get('idFacturation');
    const idConsultation = searchParams.get('idConsultation');

    let encaissements: IEncaissementCaisse[] = [];

    if (idConsultation && idConsultation.trim() !== '') {
      encaissements = await EncaissementCaisse.find({ IDCONSULTATION: idConsultation.trim() })
        .sort({ DateEncaissement: -1 });
    } else if (idFacturation && idFacturation.trim() !== '') {
      encaissements = await EncaissementCaisse.find({ IDFACTURATION: idFacturation.trim() })
        .sort({ DateEncaissement: -1 });
    }

    return NextResponse.json(
      {
        success: true,
        data: encaissements,
        count: encaissements.length
      },
      {
        headers: {
          'Cache-Control': 'no-store, max-age=0',
          Vary: '*'
        }
      }
    );

  } catch (error) {
    console.error('Erreur lors de la récupération des encaissements:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Erreur lors de la récupération des encaissements',
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}
