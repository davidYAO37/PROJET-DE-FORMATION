import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const codeVisiteur = searchParams.get("codeVisiteur");

        if (!codeVisiteur) {
            return NextResponse.json({ error: "Le paramètre codeVisiteur est requis" }, { status: 400 });
        }

        // Importer les modèles nécessaires
        const { Facturation } = await import("@/models/Facturation");

        // Récupérer les remises de facturation pour les examens (tous sauf pharmacie)
        const facturations = await Facturation.find({
            CodePrestation: codeVisiteur,
            Designationtypeacte: { $ne: 'PHARMACIE' },
            reduction: { $exists: true, $gt: 0 }
        });

        const remises = facturations
            .filter((fact: any) => fact.reduction && fact.reduction > 0)
            .map((fact: any) => ({
                reduction: Number(fact.reduction) || 0,
                motif: fact.MotifRemise || 'Remise Examen',
                date: fact.DateEncaissement || fact.DateFacturation || new Date(),
                codeFacturation: fact.Code_facturation || '',
                designation: fact.designation || 'EXAMEN'
            }));

        return NextResponse.json(remises);

    } catch (error) {
        console.error('Erreur dans reductionFactureExamen:', error);
        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        const data = await req.json();
        const { codeVisiteur } = data;

        if (!codeVisiteur) {
            return NextResponse.json({ error: "Le paramètre codeVisiteur est requis" }, { status: 400 });
        }

        // Importer les modèles nécessaires
        const { Facturation } = await import("@/models/Facturation");

        // Récupérer les remises de facturation pour les examens (tous sauf pharmacie)
        const facturations = await Facturation.find({
            CodePrestation: codeVisiteur,
            Designationtypeacte: { $ne: 'PHARMACIE' },
            reduction: { $exists: true, $gt: 0 }
        });

        const remises = facturations
            .filter((fact: any) => fact.reduction && fact.reduction > 0)
            .map((fact: any) => ({
                reduction: Number(fact.reduction) || 0,
                motif: fact.MotifRemise || 'Remise Examen',
                date: fact.DateEncaissement || fact.DateFacturation || new Date(),
                codeFacturation: fact.Code_facturation || '',
                designation: fact.Designationtypeacte || 'EXAMEN'
            }));

        return NextResponse.json(remises);

    } catch (error) {
        console.error('Erreur dans reductionFactureExamen (POST):', error);
        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        );
    }
}
