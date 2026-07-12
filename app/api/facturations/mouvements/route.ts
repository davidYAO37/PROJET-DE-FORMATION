import { Consultation } from '@/models';
import { Facturation } from '@/models/Facturation';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/mongoConnect';

export async function GET(req: NextRequest) {
    try {
        await db();
    console.log('API mouvements prestations appelée');
    
    const { searchParams } = new URL(req.url);
    const dateDebut = searchParams.get('dateDebut');
    const dateFin = searchParams.get('dateFin');
    
    console.log('Paramètres:', { dateDebut, dateFin });
    
    if (!dateDebut || !dateFin) {
      return NextResponse.json({ 
        success: false, 
        message: 'Les paramètres dateDebut et dateFin sont requis' 
      }, { status: 400 });
    }

    // Convertir les dates
    const debut = new Date(dateDebut);
    debut.setHours(0, 0, 0, 0);
    
    const fin = new Date(dateFin);
    fin.setHours(23, 59, 59, 999);

    console.log('Dates converties:', { debut, fin });

    const mouvements: any[] = [];

    // 1. Récupérer les consultations avec gestion d'erreur
    try {
      console.log('Recherche des consultations...');
      console.log('Critères de recherche consultations:', {
        Date_consulation: { $gte: debut, $lte: fin },
        montantapayer: { $ne: 0 },
        StatutC: true
      });
      
      const consultations = await Consultation.find({
        Date_consulation: { $gte: debut, $lte: fin },
        montantapayer: { $ne: 0 },
        StatutC: true
      })
      .lean();

      console.log(`Trouvé ${consultations.length} consultations`);
      
      // Afficher les dates des consultations trouvées pour vérification
      if (consultations.length > 0) {
        console.log('Dates des consultations trouvées:', consultations.map(c => ({
          id: c._id,
          date: c.Date_consulation,
          patient: c.PatientP,
          montant: c.montantapayer,
          statut: c.StatutC
        })));
      }

      // Ajouter les consultations
      consultations.forEach((consultation: any) => {
        const montantTotal = consultation.montantapayer || 0;
        const montantPaye = (consultation.Montantencaisse || 0);
        const resteAPayer = montantTotal - montantPaye;

        mouvements.push({
          _id: consultation._id,
          type: 'consultation',
          dateFacture: consultation.Date_consulation,
          patientNom: consultation.PatientP || consultation.Code_dossier,
          typeActe: consultation.designationC || 'Consultation',
          montantTotal: montantTotal,
          montantPaye: montantPaye,
          resteAPayer: Math.max(0, resteAPayer),
          modePaiement: consultation.Modepaiement || 'Non spécifié',
          statut: resteAPayer <= 0 ? 'Soldé' : montantPaye > 0 ? 'Partiel' : 'Impayé',
          medecin: consultation.Medecin || '',
          assurance: consultation.assurance || '',
          numero: consultation.NumBon || consultation.Code_dossier,
          source: 'Consultation'
        });
      });
    } catch (consultError: any) {
      console.error('Erreur lors de la recherche des consultations:', consultError);
      // Continuer avec les facturations même si les consultations échouent
    }

    // 2. Récupérer les facturations avec gestion d'erreur
    try {
      console.log('Recherche des facturations...');
      console.log('Critères de recherche facturations:', {
        DatePres: { $gte: debut, $lte: fin },
        TotalapayerPatient: { $ne: 0 }
      });
      
      const facturations = await Facturation.find({
        DatePres: { $gte: debut, $lte: fin },
        TotalapayerPatient: { $ne: 0 }
      })
      .lean();

      console.log(`Trouvé ${facturations.length} facturations`);
      
      // Afficher les dates des facturations trouvées pour vérification
      if (facturations.length > 0) {
        console.log('Dates des facturations trouvées:', facturations.map(f => ({
          id: f._id,
          date: f.DatePres,
          patient: f.PatientP,
          montant: f.TotalapayerPatient
        })));
      }

      // Ajouter les facturations
      facturations.forEach((facturation: any) => {
        const montantTotal = facturation.TotalapayerPatient || 0;
        const montantPaye = facturation.TotalPaye || facturation.MontantRecu || 0;
        const resteAPayer = facturation.Restapayer || Math.max(0, montantTotal - montantPaye);

        mouvements.push({
          _id: facturation._id,
          type: 'facturation',
          dateFacture: facturation.DatePres,
          patientNom: facturation.PatientP || facturation.Code_dossier,
          typeActe: facturation.Designationtypeacte || 'Prestation',
          montantTotal: montantTotal,
          montantPaye: montantPaye,
          resteAPayer: Math.max(0, resteAPayer),
          modePaiement: facturation.Modepaiement || facturation.BanqueC || 'Non spécifié',
          statut: resteAPayer <= 0 ? 'Soldé' : montantPaye > 0 ? 'Partiel' : 'Impayé',
          medecin: facturation.NomMed || '',
          assurance: facturation.Assurance || '',
          numero: facturation.Numfacture || facturation.NumBon || facturation.Code_dossier,
          source: 'Facturation'
        });
      });
    } catch (factError: any) {
      console.error('Erreur lors de la recherche des facturations:', factError);
      // Continuer même si les facturations échouent
    }

    // Trier par date décroissante
    mouvements.sort((a, b) => new Date(b.dateFacture).getTime() - new Date(a.dateFacture).getTime());

    console.log(`Total mouvements combinés: ${mouvements.length}`);

    return NextResponse.json({
      success: true,
      data: mouvements,
      count: mouvements.length,
      periode: {
        debut: dateDebut,
        fin: dateFin
      }
    });

  } catch (error: any) {
    console.error('Erreur générale API mouvements prestations:', error);
    return NextResponse.json({
      success: false,
      message: 'Erreur lors de la récupération des mouvements',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}
