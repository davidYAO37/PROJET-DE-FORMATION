import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { db } from '@/db/mongoConnect';
import { EncaissementCaisse } from '@/models/EncaissementCaisse';
import { Consultation } from '@/models/consultation';
import { Facturation } from '@/models/Facturation';

export async function GET(request: NextRequest) {
  try {
    await db();
    
    
    const { searchParams } = new URL(request.url);
    const dateDebut = searchParams.get('dateDebut');
    const dateFin = searchParams.get('dateFin');
    const modeAffichage = searchParams.get('modeAffichage') || 'famille';
    const ongletActif = searchParams.get('ongletActif') || 'sansNom';
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

    for (const facturation of facturations) {      
      
      let designationDetaillee = facturation.Designationtypeacte || '';
      
      // Logique WinDev: Gérer PHARMACIE vs PRESTATION
      if (designationDetaillee === 'PHARMACIE') {
        // Logique pour récupérer les médicaments (simplifiée pour l'instant)
        // POUR TOUT PARTIENT_PRESCRIPTION AVEC IDFACTURATION=FACTURATION.IDFACTURATION
        designationDetaillee = 'PHARMACIE';
      } else {
        // Logique pour récupérer les prestations (simplifiée pour l'instant)
        // POUR TOUT LIGNE_PRESTATION AVEC IDFACTURATION=FACTURATION.IDFACTURATION
        designationDetaillee = 'PRESTATION';
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
      if (ongletActif === 'sansNom') {
        // CAS 1 - Sans Nom
        if (modePaiement !== 'TOUS LES PAIEMENTS' && modePaiement !== '') {
          // Logique WinDev: Paiement_par_mode_de_paiement()
          donneesFiltrees = donneesFiltrees.filter(item => 
            item.Modepaiement === modePaiement
          );
        }
        // Sinon: Logique WinDev: TOUS_LES_PAIEMENT_CAISSE()
      } else {
        // AUTRE CAS - Avec Nom
        // Logique WinDev: Tous_paiement_par_typePatient()
        if (typePatient !== '') {
          donneesFiltrees = donneesFiltrees.filter(item => 
            item.Assure === typePatient
          );
        }
      }
    } else {
      // PAR DETAIL - même logique que PAR FAMILLE
      if (ongletActif === 'sansNom') {
        if (modePaiement !== 'TOUS LES PAIEMENTS' && modePaiement !== '') {
          // Logique WinDev: Paiement_par_mode_de_paiement_detail()
          donneesFiltrees = donneesFiltrees.filter(item => 
            item.Modepaiement === modePaiement
          );
        }
      } else {
        if (typePatient !== '') {
          // Logique WinDev: Tous_paiement_par_typePatient_detail()
          donneesFiltrees = donneesFiltrees.filter(item => 
            item.Assure === typePatient
          );
        }
      }
    }

    // Logique WinDev: Filtrer par caissière si spécifiée
    // SI COMBO_Choisir_la_caissière..ValeurAffichée <> "" ALORS
    //   TABLE_ESPECE.SupprimeTout()
    //   Tous_paiement_par_caissière()
    // FIN
    if (caissiere !== '') {
      donneesFiltrees = donneesFiltrees.filter(item => 
        item.Caissiere === caissiere
      );
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
