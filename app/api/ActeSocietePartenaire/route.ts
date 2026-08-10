import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/lib/withTenant";
import { getTenantModel } from "@/lib/tenantModels";
import { IActeSocietePartenaire } from "@/models/acteSocietePartenaire";
import mongoose from "mongoose";

const READ_ROLES = ["admin", "accueil", "biologiste", "caisse", "comptable", "infirmier", "medecin", "pharmacien", "radiologue", "technicienlabo"];
const WRITE_ROLES = ["admin"];

export async function GET(req: NextRequest) {
    const { context, response } = await withTenant(req, READ_ROLES);
    if (!context) return response;
    const ActeSocietePartenaire = getTenantModel<IActeSocietePartenaire>(context.connection, "ActeSocietePartenaire");
    const { searchParams } = new URL(req.url);
    const societeId = searchParams.get("societeId");

    const filter: Record<string, unknown> = {};
    if (societeId) {
        filter.IDSOCIETEPARTENAIRE = mongoose.Types.ObjectId.isValid(societeId)
            ? new mongoose.Types.ObjectId(societeId)
            : societeId;
    }

    const actes = await ActeSocietePartenaire.find(filter).sort({ OrdonnacementAffichage: 1 });
    return NextResponse.json(actes);
}

export async function POST(req: NextRequest) {
    const { context, response } = await withTenant(req, WRITE_ROLES);
    if (!context) return response;
    const ActeSocietePartenaire = getTenantModel<IActeSocietePartenaire>(context.connection, "ActeSocietePartenaire");
    try {
        const body = await req.json();
        const { IDSOCIETEPARTENAIRE, IDACTEP } = body;

        if (!IDSOCIETEPARTENAIRE) {
            return NextResponse.json({ error: "La société partenaire est obligatoire" }, { status: 400 });
        }
        if (!IDACTEP) {
            return NextResponse.json({ error: "L'acte est obligatoire" }, { status: 400 });
        }

        const newActe = new ActeSocietePartenaire(body);
        await newActe.save();

        return NextResponse.json(newActe, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
