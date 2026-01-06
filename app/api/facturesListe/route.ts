import { db } from '@/db/mongoConnect';
import { Facturation } from '@/models/Facturation';
import { NextResponse } from 'next/server';


// Connexion à la base de données
await db();

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const idHospitalisation = searchParams.get('idHospitalisation');

        // Vérifier les paramètres requis
        if (!idHospitalisation) {
            return NextResponse.json(
                { success: false, message: 'Les paramètres idHospitalisation est requis' },
                { status: 400 }
            );
        }

        // Récupérer les factures correspondantes
            
        const factures = await Facturation.find({
            'idHospitalisation': idHospitalisation,
        })
        .sort({ date: -1 }) // Tri par date décroissante
        .lean();


        return NextResponse.json(factures);

    } catch (error) {
        return NextResponse.json(
            { success: false, message: 'Erreur lors de la récupération des factures' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const data = await request.json();
        
        // Validation des données requises
        if (!data.idHospitalisation || !data.patientId || !data.montant) {
            return NextResponse.json(
                { success: false, message: 'Les champs idHospitalisation, patientId et montant sont obligatoires' },
                { status: 400 }
            );
        }

        // Générer un numéro de facture unique
        const count = await Facturation.countDocuments();
        const numeroFacture = `FACT-${new Date().getFullYear()}-${(count + 1).toString().padStart(6, '0')}`;

        // Créer une nouvelle facture
        const nouvelleFacture = new Facturation({
            ...data,
            Numfacture: numeroFacture,
            DatePres: new Date(),
            StatutFacture: false, // Par défaut, la facture n'est pas réglée
            TotalapayerPatient: data.montant,
            Montanttotal: data.montant,
            Restapayer: data.montant,
            TotalPaye: 0
        });

        await nouvelleFacture.save();

        return NextResponse.json({
            success: true,
            data: nouvelleFacture
        });

    } catch (error) {
        return NextResponse.json(
            { success: false, message: 'Erreur lors de la création de la facture' },
            { status: 500 }
        );
    }
}
