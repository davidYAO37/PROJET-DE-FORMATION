import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/mongoConnect';
import { EncaissementCaisse } from '@/models/EncaissementCaisse';
import { Consultation } from '@/models/consultation';
import { Facturation } from '@/models/Facturation';
import { LignePrestation } from '@/models/lignePrestation';
import { PatientPrescription } from '@/models/PatientPrescription';

export async function GET(request: NextRequest) {
  try {
    await db();
    
    
    const { searchParams } = new URL(request.url);
    const dateDebut = searchParams.get('dateDebut');
    const dateFin = searchParams.get('dateFin');
    const modeAffichage = searchParams.get('modeAffichage') || 'famille';
    const ongletActif = searchParams.get('ongletActif') || 'parCaissiere';
    const modePaiement = searchParams.get('modePaiement') || 'TOUS LES PAIEMENTS';
    const typePatient = searchParams.get('typePatient') || '';
    const caissiere = searchParams.get('caissiere') || '';

    if (!dateDebut || !dateFin) {
      return NextResponse.json(
        { success: false, message: 'Veuillez fournir dateDebut et dateFin' },
        { status: 400 }
      );
    }

    const debutDate = new Date(dateDebut);
    const finDate = new Date(dateFin);
    finDate.setHours(23, 59, 59, 999); // Inclure toute la journée de fin

    const normaliser = (valeur?: string) => (valeur || '').trim().toLowerCase();

    let donneesCompletees: any[] = [];

    // 1. Ajouter les consultations (Le paiement en espèce)
    // Logique WinDev: POUR TOUT CONSULTATION
    const consultations = await Consultation.find({
      Date_consulation: { $gte: debutDate, $lte: finDate }
    });

    for (const consultation of consultations) {      
      
      donneesCompletees.push({
        DateEncaissement: consultation.Date_consulation,
        Patient: consultation.PatientP,
        Assurance: consultation.assurance || '',
        Designation: consultation.designationC,
        Totalacte: consultation.PrixClinique || 0,
        Taux: consultation.tauxAssurance || 0,
        PartAssurance: consultation.PartAssurance || 0,
        PartPatient: consultation.montantapayer || 0,
        Montantencaisse: consultation.Montantencaisse || 0,
        REMISE: 0,
        Restapayer: consultation.Restapayer || 0,
        Medecin: consultation.Medecin || '',
        Modepaiement: consultation.Modepaiement || '',
        Type: 'CONSULTATION',
        Assure: consultation.Assure || 'NON',
        Caissiere: consultation.Caissiere || ''
      });
    }

    // 2. Ajouter les facturations (Le paiement en espèce et caution)
    // Logique WinDev: POUR TOUT FACTURATION
    const facturations = await Facturation.find({
      $or: [
        { DateModif: { $gte: debutDate, $lte: finDate } },
        { DateFacturation: { $gte: debutDate, $lte: finDate } }
      ]
    });

    const formatListeNumerotee = (items: string[]) =>
      items.map((item, index) => `${index + 1}. ${item}`).join('\n');

    const facturationIds = facturations.map((f) => f._id);
    const [lignesPrestation, lignesPrescription] = await Promise.all([
      LignePrestation.find({ idFacturation: { $in: facturationIds } }).lean(),
      PatientPrescription.find({ facturation: { $in: facturationIds } }).lean()
    ]);

    const prestationsParFacturation = new Map<string, string[]>();
    for (const ligne of lignesPrestation) {
      const cle = String(ligne.idFacturation || '');
      if (!cle) continue;
      const items = prestationsParFacturation.get(cle) || [];
      if (ligne.prestation) items.push(ligne.prestation);
      prestationsParFacturation.set(cle, items);
    }

    const prescriptionsParFacturation = new Map<string, string[]>();
    for (const prescription of lignesPrescription) {
      const cle = String(prescription.facturation || '');
      if (!cle) continue;
      const items = prescriptionsParFacturation.get(cle) || [];
      if (prescription.nomMedicament) items.push(prescription.nomMedicament);
      prescriptionsParFacturation.set(cle, items);
    }

    for (const facturation of facturations) {      
      
      let designationDetaillee = facturation.Designationtypeacte || '';
      
      if (modeAffichage === 'detail') {
        const facturationId = String(facturation._id);
        const designationNormalisee = normaliser(designationDetaillee);

        // En mode detail, afficher les lignes liées à la facturation.
        if (designationNormalisee === 'pharmacie') {
          const listeMedicaments = prescriptionsParFacturation.get(facturationId) || [];
          designationDetaillee = listeMedicaments.length
            ? formatListeNumerotee(listeMedicaments)
            : 'PHARMACIE';
        } else if (designationNormalisee === 'prestation') {
          const listePrestations = prestationsParFacturation.get(facturationId) || [];
          designationDetaillee = listePrestations.length
            ? formatListeNumerotee(listePrestations)
            : 'PRESTATION';
        } else {
          // Fallback: tenter d'afficher ce qui existe même si le type est atypique.
          const listeFallback = (prestationsParFacturation.get(facturationId) || [])
            .concat(prescriptionsParFacturation.get(facturationId) || []);
          if (listeFallback.length) {
            designationDetaillee = formatListeNumerotee(listeFallback);
          }
        }
      }

      donneesCompletees.push({
        DateEncaissement: facturation.DateModif || facturation.DateFacturation,
        Patient: facturation.PatientP,
        Assurance: facturation.Assurance,
        Designation: designationDetaillee,
        Totalacte: facturation.Montanttotal || 0,
        Taux: facturation.Taux || 0,
        PartAssurance: facturation.PartAssuranceP || 0,
        PartPatient: facturation.TotalapayerPatient || 0,
        Montantencaisse: facturation.TotalPaye || 0,
        REMISE: facturation.reduction || 0,
        Restapayer: facturation.Restapayer || 0,
        Medecin: facturation.NomMed || '',
        Modepaiement: facturation.Modepaiement || '',
        Type: 'FACTURATION',
        Assure: facturation.Assure || 'NON',
        Caissiere: facturation.SaisiPar || '' 
      });
    }

    // 3. Ajouter les encaissements existants
    // Logique WinDev: POUR TOUT ENCAISSEMENT_CAISSE
    const encaissements = await EncaissementCaisse.find({
      DateEncaissement: { $gte: debutDate, $lte: finDate }
    });

    for (const encaissement of encaissements) {     
      
      donneesCompletees.push({
        DateEncaissement: encaissement.DateEncaissement,
        Patient: encaissement.Patient,
        Assurance: encaissement.Assurance,
        Designation: encaissement.Designation || '',
        Totalacte: encaissement.Totalacte || 0,
        Taux: encaissement.Taux || 0,
        PartAssurance: encaissement.PartAssurance || 0,
        PartPatient: 0, // Champ n'existe pas dans le modèle
        Montantencaisse: encaissement.Montantencaisse || 0,
        REMISE: encaissement.REMISE || 0,
        Restapayer: encaissement.Restapayer || 0,
        Medecin: encaissement.Medecin || '',
        Modepaiement: encaissement.Modepaiement || '',
        Type: 'ENCAISSEMENT',
        Assure: encaissement.Assure || 'NON',
        Caissiere: encaissement.Utilisateur || '' 
      });
    }

    // Appliquer les filtres selon la logique WinDev
    let donneesFiltrees = donneesCompletees;

    // Logique WinDev: SELON SEL_AFFICHAGE_ACTE
    if (modeAffichage === 'famille') {
      // PAR FAMILLE
      if (ongletActif === 'parCaissiere') {
        // CAS 1 - Par Caissière
        if (modePaiement !== 'TOUS LES PAIEMENTS' && modePaiement !== '') {
          // Logique WinDev: Paiement_par_mode_de_paiement()
          donneesFiltrees = donneesFiltrees.filter(item => 
            item.Modepaiement === modePaiement
          );
        }
        // Sinon: Logique WinDev: TOUS_LES_PAIEMENT_CAISSE()
      } else if (ongletActif === 'statutPatient') {
        // CAS 2 - Par Statut Patient
        // Logique WinDev: Tous_paiement_par_typePatient()
        if (typePatient !== '') {
          donneesFiltrees = donneesFiltrees.filter(item => {
            // Mapper les valeurs du type patient aux valeurs du champ Assure
            if (typePatient === 'NON ASSURE') {
              return item.Assure === 'NON' || item.Assure === '';
            } else if (typePatient === 'TARIF MUTUALISTE') {
              return item.Assure === 'MUTUALISTE';
            } else if (typePatient === 'TARIF ASSURE') {
              return item.Assure === 'OUI' || item.Assure === 'ASSURE';
            }
            return false;
          });
        }
      }
    } else {
      // PAR DETAIL - même logique que PAR FAMILLE
      if (ongletActif === 'parCaissiere') {
        if (modePaiement !== 'TOUS LES PAIEMENTS' && modePaiement !== '') {
          // Logique WinDev: Paiement_par_mode_de_paiement_detail()
          donneesFiltrees = donneesFiltrees.filter(item => 
            item.Modepaiement === modePaiement
          );
        }
      } else if (ongletActif === 'statutPatient') {
        if (typePatient !== '') {
          // Logique WinDev: Tous_paiement_par_typePatient_detail()
          donneesFiltrees = donneesFiltrees.filter(item => {
            // Mapper les valeurs du type patient aux valeurs du champ Assure
            if (typePatient === 'NON ASSURE') {
              return item.Assure === 'NON' || item.Assure === '';
            } else if (typePatient === 'TARIF MUTUALISTE') {
              return item.Assure === 'MUTUALISTE';
            } else if (typePatient === 'TARIF ASSURE') {
              return item.Assure === 'OUI' || item.Assure === 'ASSURE';
            }
            return false;
          });
        }
      }
    }

    // Logique WinDev: Filtrer par caissière si spécifiée
    // SI COMBO_Choisir_la_caissière..ValeurAffichée <> "" ALORS
    //   TABLE_ESPECE.SupprimeTout()
    //   Tous_paiement_par_caissière()
    // FIN
    if (caissiere !== '') {
      const caissiereNormalisee = normaliser(caissiere);
      donneesFiltrees = donneesFiltrees.filter(item => normaliser(item.Caissiere) === caissiereNormalisee);
    }

    // Logique WinDev: TableTrie(TABLE_ESPECE,"+COL_DateActe")
    donneesFiltrees.sort((a, b) => 
      new Date(a.DateEncaissement).getTime() - new Date(b.DateEncaissement).getTime()
    );

    // Calculer les totaux
    const totaux = {
      totalActe: donneesFiltrees.reduce((sum, item) => sum + (item.Totalacte || 0), 0),
      totalAssurance: donneesFiltrees.reduce((sum, item) => sum + (item.PartAssurance || 0), 0),
      totalEncaisse: donneesFiltrees.reduce((sum, item) => sum + (item.Montantencaisse || 0), 0),
      totalReste: donneesFiltrees.reduce((sum, item) => sum + (item.Restapayer || 0), 0)
    };

    return NextResponse.json({
      success: true,
      data: donneesFiltrees,
      totaux: totaux,
      count: donneesFiltrees.length
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des données du point de caisse:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Erreur lors de la récupération des données du point de caisse',
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}
