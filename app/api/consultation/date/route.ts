import { NextRequest, NextResponse } from 'next/server';
import { withTenant } from '@/lib/withTenant';
import { getTenantModel } from '@/lib/tenantModels';
import { IConsultation } from '@/models/consultation';

const ROLES = ["admin", "medecin", "accueil", "infirmier"];

export async function POST(req: NextRequest) {
    const { context, response: tenantErrorResponse } = await withTenant(req, ROLES);
    if (!context) return tenantErrorResponse;
    const Consultation = getTenantModel<IConsultation>(context.connection, "Consultation");

    try {

        // 🔸 Définir le jour courant (de minuit à minuit)
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        // 🔸 Récupérer toutes les consultations du jour où AttenteAccueil est faux
        const consultations = await Consultation.find({
            Date_consulation: { $gte: today, $lt: tomorrow },
            AttenteAccueil: false, // Ajout de la condition
            StatutC: false, // Consultation non terminée
        }).lean();

        // 🔸 Formater les données
        const formatted = consultations.map((c) => ({
            IDCONSULTATION: c._id,
            Date_consulation: c.Date_consulation,
            Heure_Consultation: c.Heure_Consultation,
            MedecinNom: c.Medecin || 'Inconnu',
            PatientNom: c.PatientP || 'Inconnu',
            CodePrestation: c.CodePrestation,
            designationC: c.designationC,
        }));

        return NextResponse.json(formatted, { status: 200 });
    } catch (error) {
        console.error('❌ Erreur API /consultation/date:', error);
        return NextResponse.json(
            { message: 'Erreur serveur', error: (error as Error).message },
            { status: 500 }
        );
    }
}


export async function GET(req: NextRequest) {
    const { context, response: tenantErrorResponse } = await withTenant(req, ROLES);
    if (!context) return tenantErrorResponse;
    const Consultation = getTenantModel<IConsultation>(context.connection, "Consultation");

    try {

        // Aujourd'hui à minuit
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        // Nombre total de consultations du jour
        const totalConsultations = await Consultation.countDocuments({
            Date_consulation: { $gte: today, $lt: tomorrow },
        });

        // Nombre de patients en salle d'attente
        const waitingRoomCount = await Consultation.countDocuments({
            Date_consulation: { $gte: today, $lt: tomorrow },
            AttenteAccueil: false,
            StatutC: false,
        });

        return NextResponse.json({
            totalConsultations,
            waitingRoomCount,
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des statistiques:', error);
        return NextResponse.json(
            { message: 'Erreur serveur', error: (error as Error).message },
            { status: 500 }
        );
    }
}