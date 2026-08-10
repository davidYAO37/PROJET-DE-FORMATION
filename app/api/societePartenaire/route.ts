import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/lib/withTenant";
import { getTenantModel } from "@/lib/tenantModels";
import { ISocietePartenaire } from "@/models/SocietePartenaire";

const READ_ROLES = ["admin", "accueil", "biologiste", "caisse", "comptable", "infirmier", "medecin", "pharmacien", "radiologue", "technicienlabo"];
const WRITE_ROLES = ["admin"];

export async function GET(req: NextRequest) {
    const { context, response } = await withTenant(req, READ_ROLES);
    if (!context) return response;
    const SocietePartenaire = getTenantModel<ISocietePartenaire>(context.connection, "SocietePartenaire");
    const societes = await SocietePartenaire.find().sort({ Designation: 1 });
    return NextResponse.json(societes);
}

export async function POST(req: NextRequest) {
    const { context, response } = await withTenant(req, WRITE_ROLES);
    if (!context) return response;
    const SocietePartenaire = getTenantModel<ISocietePartenaire>(context.connection, "SocietePartenaire");
    try {
        const body = await req.json();
        const { Designation } = body;

        if (!Designation?.trim()) {
            return NextResponse.json({ error: "La désignation est obligatoire" }, { status: 400 });
        }

        const newSociete = new SocietePartenaire({ Designation: Designation.trim() });
        await newSociete.save();

        return NextResponse.json(newSociete, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
