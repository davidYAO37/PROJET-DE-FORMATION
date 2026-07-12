import { Consultation } from '@/models';
import { Facturation } from '@/models/Facturation';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/mongoConnect';

export async function GET(req: NextRequest) {
    try {
        await db();
        console.log('Test de prise en compte des dates');
        
        const { searchParams } = new URL(req.url);
        const dateDebut = searchParams.get('dateDebut');
        const dateFin = searchParams.get('dateFin');
        
        console.log('Paramètres reçus:', { dateDebut, dateFin });
        
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

        console.log('Dates converties:', { 
            debut: debut.toISOString(), 
            fin: fin.toISOString() 
        });

        // Test 1: Compter toutes les consultations sans filtre
        const totalConsultations = await Consultation.countDocuments();
        console.log(`Total consultations dans la base: ${totalConsultations}`);

        // Test 2: Compter les consultations avec montantapayer > 0
        const consultationsAvecMontant = await Consultation.countDocuments({
            montantapayer: { $ne: 0 }
        });
        console.log(`Consultations avec montant > 0: ${consultationsAvecMontant}`);

        // Test 3: Compter les consultations avec StatutC = true
        const consultationsStatutTrue = await Consultation.countDocuments({
            StatutC: true
        });
        console.log(`Consultations avec StatutC = true: ${consultationsStatutTrue}`);

        // Test 4: Compter les consultations avec tous les critères sauf date
        const consultationsTousCritères = await Consultation.countDocuments({
            montantapayer: { $ne: 0 },
            StatutC: true
        });
        console.log(`Consultations avec tous critères sauf date: ${consultationsTousCritères}`);

        // Test 5: Compter les consultations avec filtre de date
        const consultationsAvecDate = await Consultation.countDocuments({
            Date_consulation: { $gte: debut, $lte: fin },
            montantapayer: { $ne: 0 },
            StatutC: true
        });
        console.log(`Consultations avec filtre date: ${consultationsAvecDate}`);

        // Test 6: Récupérer quelques consultations pour voir leurs dates
        const sampleConsultations = await Consultation.find({})
            .limit(5)
            .select('Date_consulation montantapayer StatutC PatientP')
            .lean();
        
        console.log('Échantillon de consultations:', sampleConsultations);

        // Mêmes tests pour les facturations
        const totalFacturations = await Facturation.countDocuments();
        console.log(`Total facturations dans la base: ${totalFacturations}`);

        const facturationsAvecMontant = await Facturation.countDocuments({
            TotalapayerPatient: { $ne: 0 }
        });
        console.log(`Facturations avec montant > 0: ${facturationsAvecMontant}`);

        const facturationsAvecDate = await Facturation.countDocuments({
            DatePres: { $gte: debut, $lte: fin },
            TotalapayerPatient: { $ne: 0 }
        });
        console.log(`Facturations avec filtre date: ${facturationsAvecDate}`);

        const sampleFacturations = await Facturation.find({})
            .limit(5)
            .select('DatePres TotalapayerPatient PatientP')
            .lean();
        
        console.log('Échantillon de facturations:', sampleFacturations);

        return NextResponse.json({
            success: true,
            message: 'Test de dates complété',
            tests: {
                consultations: {
                    total: totalConsultations,
                    avecMontant: consultationsAvecMontant,
                    statutTrue: consultationsStatutTrue,
                    tousCritères: consultationsTousCritères,
                    avecDate: consultationsAvecDate,
                    echantillon: sampleConsultations
                },
                facturations: {
                    total: totalFacturations,
                    avecMontant: facturationsAvecMontant,
                    avecDate: facturationsAvecDate,
                    echantillon: sampleFacturations
                },
                periode: {
                    debut: dateDebut,
                    fin: dateFin,
                    debutISO: debut.toISOString(),
                    finISO: fin.toISOString()
                }
            }
        });

    } catch (error: any) {
        console.error('Erreur lors du test:', error);
        return NextResponse.json({
            success: false,
            message: 'Erreur lors du test',
            error: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}
