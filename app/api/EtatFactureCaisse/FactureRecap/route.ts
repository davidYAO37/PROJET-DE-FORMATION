import { NextRequest, NextResponse } from "next/server";
import { getFactureDetailleActe } from "@/services/factureService";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const ParamCode_consultation = searchParams.get("ParamCode_consultation");

        if (!ParamCode_consultation) {
            return NextResponse.json({ error: "Le paramètre ParamCode_consultation est requis" }, { status: 400 });
        }

        // Utiliser le service pour obtenir les données combinées
        const factureData = await getFactureDetailleActe(ParamCode_consultation);

        return NextResponse.json(factureData);

    } catch (error) {
        console.error('Erreur dans FactureRecap:', error);
        
        if (error instanceof Error && error.message === "Consultation non trouvée") {
            return NextResponse.json({ error: 'Consultation non trouvée' }, { status: 404 });
        }
        
        if (error instanceof Error && error.message === "Prescription non trouvée") {
            return NextResponse.json({ error: 'Prescription non trouvée' }, { status: 404 });
        }
        
        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        const data = await req.json();
        const { ParamCode_consultation } = data;

        if (!ParamCode_consultation) {
            return NextResponse.json({ error: "Le paramètre ParamCode_consultation est requis" }, { status: 400 });
        }

        // Utiliser le service pour obtenir les données combinées
        const factureData = await getFactureDetailleActe(ParamCode_consultation);

        return NextResponse.json(factureData);

    } catch (error) {
        console.error('Erreur dans FactureRecap (POST):', error);
        
        if (error instanceof Error && error.message === "Consultation non trouvée") {
            return NextResponse.json({ error: 'Consultation non trouvée' }, { status: 404 });
        }
        
        if (error instanceof Error && error.message === "Prescription non trouvée") {
            return NextResponse.json({ error: 'Prescription non trouvée' }, { status: 404 });
        }
        
        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        );
    }
}
