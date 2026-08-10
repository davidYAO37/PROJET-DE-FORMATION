import { NextRequest, NextResponse } from 'next/server';
import { withTenant } from '@/lib/withTenant';
import { getTenantModel } from '@/lib/tenantModels';
import { IEncaissementCaisse } from '@/models/EncaissementCaisse';
import { IEncaissementCaisseAnnule } from '@/models/EncaissementCaisseAnnule';
import { IFacturation } from '@/models/Facturation';
import { IConsultation } from '@/models/consultation';
import { IPatient } from '@/models/patient';

export const dynamic = 'force-dynamic';

const ROLES = ["admin", "caisse", "comptable", "accueil"];

export async function POST(req: NextRequest) {
  const { context, response } = await withTenant(req, ROLES);
  if (!context) return response;
  const EncaissementCaisse = getTenantModel<IEncaissementCaisse>(context.connection, "EncaissementCaisse");
  const Facturation = getTenantModel<IFacturation>(context.connection, "Facturation");
  const Consultation = getTenantModel<IConsultation>(context.connection, "Consultation");
  const Patient = getTenantModel<IPatient>(context.connection, "Patient");
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

        // Gestion de la caution du patient : déduire directement le montant encaissé du compte provision
        if (body.Modepaiement === "Caution" && consultation.IdPatient) {
          const patientCaution = await Patient.findById(consultation.IdPatient);
          if (patientCaution) {
            const montant = Number(montantClient) || 0;
            const provisionActuelle = Number(patientCaution.ProvisionClient) || 0;
            const depenseActuelle = Number(patientCaution.DepenseProvision) || 0;
            patientCaution.ProvisionClient = provisionActuelle - montant;
            patientCaution.DepenseProvision = depenseActuelle + montant;
            await patientCaution.save();
          }
        }
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

        // Gestion de la caution du patient : déduire directement le montant encaissé du compte provision
        if (body.Modepaiement === "Caution" && facturation.IdPatient) {
          const patientCaution = await Patient.findById(facturation.IdPatient);
          if (patientCaution) {
            const montant = Number(body.Montantencaisse) || 0;
            const provisionActuelle = Number(patientCaution.ProvisionClient) || 0;
            const depenseActuelle = Number(patientCaution.DepenseProvision) || 0;
            patientCaution.ProvisionClient = provisionActuelle - montant;
            patientCaution.DepenseProvision = depenseActuelle + montant;
            await patientCaution.save();
          }
        }

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
    const { context, response } = await withTenant(request, ROLES);
    if (!context) return response;
    const EncaissementCaisse = getTenantModel<IEncaissementCaisse>(context.connection, "EncaissementCaisse");

    const { searchParams } = new URL(request.url);
    const idFacturation = searchParams.get('idFacturation');
    const idConsultation = searchParams.get('idConsultation');
    const all = searchParams.get('all');
    const patient = searchParams.get('patient');

    let encaissements: IEncaissementCaisse[] = [];

    if (all === '1' || all === 'true') {
      encaissements = await EncaissementCaisse.find().sort({ DateEncaissement: -1 });
    } else if (patient && patient.trim() !== '') {
      // Équivalent de : POUR TOUT ENCAISSEMENT_CAISSE AVEC Nompatient=SAI_SAISIE_PATIENT
      encaissements = await EncaissementCaisse.find({ 
        Patient: { $regex: patient.trim(), $options: 'i' } 
      }).sort({ DateEncaissement: -1 });
    } else if (idConsultation && idConsultation.trim() !== '') {
      encaissements = await EncaissementCaisse.find({ IDCONSULTATION: idConsultation.trim() }).sort({ DateEncaissement: -1 });
    } else if (idFacturation && idFacturation.trim() !== '') {
      encaissements = await EncaissementCaisse.find({ IDFACTURATION: idFacturation.trim() }).sort({ DateEncaissement: -1 });
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

export async function PATCH(request: NextRequest) {
  try {
    const { context, response } = await withTenant(request, ROLES);
    if (!context) return response;
    const EncaissementCaisse = getTenantModel<IEncaissementCaisse>(context.connection, "EncaissementCaisse");

    const { searchParams } = new URL(request.url);
    let id = searchParams.get('id');
    const body = await request.json().catch(() => ({}));

    if (!id) {
      id = body?.id;
    }

    if (!id) {
      return NextResponse.json({ success: false, message: 'ID d\'encaissement requis' }, { status: 400 });
    }

    // Équivalent de HLitRecherche(ENCAISSEMENT_CAISSE,IDPOINT_CAISSE,TABLE_ENCAISSEMENT_CAISSE.COL_IDPOINT_CAISSE)
    const encaissement = await EncaissementCaisse.findById(id);

    if (!encaissement) {
      return NextResponse.json({ success: false, message: 'Encaissement introuvable' }, { status: 404 });
    }

    // Équivalent de votre logique Windev :
    // ENCAISSEMENT_CAISSE.annulationOrdonnepar=gsUtilisateur
    // ENCAISSEMENT_CAISSE.AnnulationOrdonneLe=DateSys()
    // HModifie(ENCAISSEMENT_CAISSE)
    
    if (body?.action === 'cancel-order') {
      encaissement.annulationOrdonnepar = "";
      encaissement.AnnulationOrdonneLe = undefined;
      encaissement.Ordonnerlannulation = false;
      encaissement.StatutOrdonner = 0;
      encaissement.StatutAnnulation = undefined;
    } else if (body?.action === 'reject' || body?.Ordonnerlannulation === false) {
      encaissement.annulationOrdonnepar = "";
      encaissement.AnnulationOrdonneLe = undefined;
      encaissement.Ordonnerlannulation = false;
      encaissement.StatutOrdonner = 1;
      encaissement.StatutAnnulation = 'refusee';
    } else {
      encaissement.annulationOrdonnepar = body?.utilisateur || 'Utilisateur inconnu';
      encaissement.AnnulationOrdonneLe = new Date();
      encaissement.Ordonnerlannulation = true;
      encaissement.StatutOrdonner = 1;
      encaissement.StatutAnnulation = 'en_cours';
    }

    await encaissement.save();

    return NextResponse.json({ 
      success: true, 
      message: body?.action === 'cancel-order'
        ? 'Ordonnancement d’annulation annulé avec succès'
        : body?.action === 'reject' || body?.Ordonnerlannulation === false
          ? 'Annulation refusée avec succès'
          : 'Annulation ordonnée avec succès',
      data: encaissement
    });
  } catch (error) {
    console.error('Erreur lors de l\'ordonnancement de l\'annulation:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Erreur lors de l\'ordonnancement de l\'annulation',
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}

// Garder DELETE pour l'annulation effective si nécessaire plus tard
export async function DELETE(request: NextRequest) {
  try {
    const { context, response } = await withTenant(request, ["admin"]);
    if (!context) return response;
    const EncaissementCaisse = getTenantModel<IEncaissementCaisse>(context.connection, "EncaissementCaisse");
    const EncaissementCaisseAnnule = getTenantModel<IEncaissementCaisseAnnule>(context.connection, "EncaissementCaisseAnnule");

    const { searchParams } = new URL(request.url);
    let id = searchParams.get('id');
    const body = await request.json().catch(() => ({}));

    if (!id) {
      id = body?.id;
    }

    if (!id) {
      return NextResponse.json({ success: false, message: 'ID d\'encaissement requis' }, { status: 400 });
    }

    const encaissement = await EncaissementCaisse.findById(id);

    if (!encaissement) {
      return NextResponse.json({ success: false, message: 'Encaissement introuvable' }, { status: 404 });
    }

    const annuler = new EncaissementCaisseAnnule({
      DatePrest: encaissement.DatePrest,
      Patient: encaissement.Patient,
      ACTE: encaissement.Designation,
      Designation: encaissement.Designation,
      typeAnnulation: 'Encaissement',
      sourceId: String(encaissement._id),
      Taux: encaissement.Taux,
      Restapayer: encaissement.Restapayer,
      Medecin: encaissement.Medecin,
      Utilisateur: encaissement.Utilisateur,
      DateEncaissement: encaissement.DateEncaissement,
      Montantencaisse: encaissement.Montantencaisse,
      HeureEncaissement: encaissement.HeureEncaissement,
      Modepaiement: encaissement.Modepaiement,
      Facturation: encaissement.IDFACTURATION,
      Consultation: encaissement.IDCONSULTATION,
      restapayerBilan: encaissement.restapayerBilan,
      TotalapayerPatient: encaissement.TotalapayerPatient,
      Annulerle: new Date(),
      AnnulerPar: body?.utilisateur || 'Utilisateur inconnu',
      motifAnnulation: body?.motifAnnulation || 'Annulé depuis Liste encaissement',
      AnnulationOrdonneLe: new Date(),
      annulationOrdonnepar: body?.utilisateur || 'Utilisateur inconnu',
      entrepriseId: encaissement.entrepriseId
    });

    await annuler.save();
    await EncaissementCaisse.findByIdAndDelete(id);

    return NextResponse.json({ success: true, message: 'Encaissement annulé avec succès' });
  } catch (error) {
    console.error('Erreur lors de l\'annulation de l\'encaissement:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Erreur lors de l\'annulation de l\'encaissement',
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}
