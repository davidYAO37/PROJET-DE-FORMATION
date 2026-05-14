import { NextRequest, NextResponse } from "next/server";
import { Consultation } from "@/models/consultation";
import { db } from "@/db/mongoConnect";

export async function PUT(req: NextRequest) {
    await db();
    
    try {
        const data = await req.json();
        const { consultationId, codePrestation, attenteMedecin } = data;
        
        if (!attenteMedecin) {
            return NextResponse.json({ error: "Le champ attenteMedecin est requis" }, { status: 400 });
        }
        
        if (!consultationId && !codePrestation) {
            return NextResponse.json({ error: "consultationId ou codePrestation est requis" }, { status: 400 });
        }
        
        // Construire la query de recherche
        let query: any = {};
        if (consultationId) {
            query._id = consultationId;
        } else if (codePrestation) {
            query.CodePrestation = codePrestation;
        }
        
        // Mettre à jour la consultation
        const updatedConsultation = await Consultation.findOneAndUpdate(
            query,
            { 
                $set: { 
                    attenteMedecin: attenteMedecin,
                    // Mettre à jour la date de modification si nécessaire
                    updatedAt: new Date()
                } 
            },
            { new: true } // Retourner le document mis à jour
        );
        
        if (!updatedConsultation) {
            return NextResponse.json({ error: "Consultation non trouvée" }, { status: 404 });
        }
        
        return NextResponse.json({ 
            message: "Statut attenteMedecin mis à jour avec succès",
            consultation: updatedConsultation
        });
        
    } catch (error: any) {
        console.error("Erreur lors de la mise à jour du statut attenteMedecin:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
