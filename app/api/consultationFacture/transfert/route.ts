import { NextRequest, NextResponse } from "next/server";
import { Consultation } from "@/models/consultation";
import { Medecin } from "@/models/medecin";
import { db } from "@/db/mongoConnect";

export async function PUT(req: NextRequest) {
    await db();
    try {
        const data = await req.json();
        const { CodePrestation, nouveauMedecinId, transfererPar } = data;

        if (!CodePrestation || !nouveauMedecinId || !transfererPar) {
            return NextResponse.json({
                error: "Code Prestation, nouveau médecin et utilisateur requis"
            }, { status: 400 });
        }

        // Récupérer la consultation
        const consultation = await Consultation.findOne({ CodePrestation: CodePrestation });

        if (!consultation) {
            return NextResponse.json({ error: "Consultation non trouvée" }, { status: 404 });
        }

        // Récupérer le nouveau médecin
        const nouveauMedecin = await Medecin.findById(nouveauMedecinId);

        if (!nouveauMedecin) {
            return NextResponse.json({ error: "Médecin non trouvé" }, { status: 404 });
        }

        // Sauvegarder l'ancien médecin
        const ancienMedecin = consultation.Medecin;

        // Mettre à jour la consultation avec updateOne pour éviter les problèmes de typage
        await Consultation.updateOne(
            { CodePrestation: CodePrestation },
            {
                $set: {
                    AncienMedecin: ancienMedecin,
                    Medecin: `${nouveauMedecin.nom} ${nouveauMedecin.prenoms}`,
                    IDMEDECIN: nouveauMedecin._id,
                    datetransfert: new Date(),
                    TransfererPar: transfererPar
                }
            }
        );

        // Récupérer la consultation mise à jour
        const consultationUpdated = await Consultation.findOne({ CodePrestation: CodePrestation });

        return NextResponse.json({
            success: true,
            message: "Transfert effectué avec succès",
            consultation: consultationUpdated
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
