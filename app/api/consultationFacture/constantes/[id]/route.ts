export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    await db();
    try {
        const { id } = await params;
        const consultation = await Consultation.findById(id);
        if (!consultation) {
            return NextResponse.json({ error: "Consultation non trouvée" }, { status: 404 });
        }
        return NextResponse.json(consultation);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
import { NextRequest, NextResponse } from "next/server";
import { Consultation } from "@/models/consultation";
import { db } from "@/db/mongoConnect";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    await db();

    try {
        const { id } = await params;
        const data = await req.json();

        const consultation = await Consultation.findById(id);
        if (!consultation) {
            return NextResponse.json({ error: "Consultation non trouvée" }, { status: 404 });
        }

        // Mise à jour des constantes
        consultation.Temperature = data.temperature;
        consultation.Tension = data.tension;
        consultation.Poids = data.poids;
        consultation.TailleCons = data.taille;
        consultation.Glycemie = data.glycemie;
        consultation.IDMEDECIN = data.medecin;
        consultation.AttenteAccueil = 1; // Correction: stocké comme Number dans le modèle
        consultation.attenteMedecin = 1;

        await consultation.save();

        return NextResponse.json({ success: true, message: "Constantes enregistrées avec succès" });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}