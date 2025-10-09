import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/mongoConnect';
import { Consultation } from '@/models/consultation';

export async function POST(req: NextRequest) {
    try {
        await db(); // ✅ Connexion à MongoDB

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
            Code_Prestation: c.Code_Prestation,
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
