import { IFacturation } from '@/models/Facturation';
import { NextRequest, NextResponse } from 'next/server';
import { withTenant } from '@/lib/withTenant';
import { getTenantModel } from '@/lib/tenantModels';

const READ_ROLES = ["admin", "medecin", "accueil", "caisse", "comptable"];
const WRITE_ROLES = ["admin", "caisse", "comptable"];

export async function GET(request: NextRequest) {
    try {
        const { context, response } = await withTenant(request, READ_ROLES);
        if (!context) return response;
        const Facturation = getTenantModel<IFacturation>(context.connection, "Facturation");

        const { searchParams } = new URL(request.url);
        const idHospitalisation = searchParams.get('idHospitalisation');
        const codePrestation = searchParams.get('codePrestation');
        const patientId = searchParams.get('patientId');

        // Vérifier les paramètres requis
        if (!idHospitalisation && !(codePrestation && patientId)) {
            return NextResponse.json(
                { success: false, message: 'idHospitalisation ou (codePrestation et patientId) requis' },
                { status: 400 }
            );
        }

        // Construire une requête de fallback pour supporter les données importées
        const orConditions: any[] = [];
        if (idHospitalisation) {
            orConditions.push({ idHospitalisation });
        }
        if (codePrestation) {
            orConditions.push({ CodePrestation: codePrestation });
        }
        if (codePrestation && patientId) {
            orConditions.push({ CodePrestation: codePrestation, IdPatient: patientId });
        }

        // Récupérer les factures correspondantes
        const factures = await Facturation.find({ $or: orConditions })
            .sort({ DatePres: -1 }) // Tri par date décroissante
            .lean();


        return NextResponse.json(factures);

    } catch (error) {
        return NextResponse.json(
            { success: false, message: 'Erreur lors de la récupération des factures' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const { context, response } = await withTenant(request, WRITE_ROLES);
        if (!context) return response;
        const Facturation = getTenantModel<IFacturation>(context.connection, "Facturation");

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
