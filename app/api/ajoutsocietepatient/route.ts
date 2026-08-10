import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/lib/withTenant";
import { getTenantModel } from "@/lib/tenantModels";
import { ISocieteAssurance } from "@/models/SocieteAssurance";

const ROLES = ["admin", "accueil", "caisse", "comptable", "medecin", "infirmier"];

// GET /api/societeassurance?assuranceId=xxx
export async function GET(request: NextRequest) {
    const { context, response } = await withTenant(request, ROLES);
    if (!context) return response;
    const SocieteAssurance = getTenantModel<ISocieteAssurance>(context.connection, "SocieteAssurance");
    const { searchParams } = new URL(request.url);
    const assuranceId = searchParams.get("assuranceId");
    if (!assuranceId) {
        return NextResponse.json([], { status: 200 });
    }
    const societes = await SocieteAssurance.find({ Assurance: assuranceId }).lean();
    return NextResponse.json(societes);
}

// POST /api/societeassurance
export async function POST(request: NextRequest) {
    const { context, response } = await withTenant(request, ROLES);
    if (!context) return response;
    const SocieteAssurance = getTenantModel<ISocieteAssurance>(context.connection, "SocieteAssurance");
    const body = await request.json();
    const { societe, assuranceId } = body;
    if (!assuranceId || !societe) {
        return NextResponse.json({ error: "Champs obligatoires manquants" }, { status: 400 });
    }

    await SocieteAssurance.create({
        societe,
        Assurance: assuranceId,
    });

    // Retourner uniquement les sociétés de l'assurance concernée
    const societes = await SocieteAssurance.find({ Assurance: assuranceId }).lean();
    return NextResponse.json(societes);
}

// PUT /api/societeassurance
export async function PUT(request: NextRequest) {
    const { context, response } = await withTenant(request, ROLES);
    if (!context) return response;
    const SocieteAssurance = getTenantModel<ISocieteAssurance>(context.connection, "SocieteAssurance");
    const body = await request.json();
    const { id, societe, assuranceId } = body;
    if (!id || !societe || !assuranceId) {
        return NextResponse.json({ error: "Champs obligatoires manquants" }, { status: 400 });
    }

    await SocieteAssurance.findByIdAndUpdate(id, { societe });

    const updated = await SocieteAssurance.find({ Assurance: assuranceId }).lean();
    return NextResponse.json(updated);
}

