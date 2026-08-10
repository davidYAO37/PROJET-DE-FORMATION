import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/lib/withTenant";
import { getTenantModel } from "@/lib/tenantModels";
import { ITypeActe } from "@/models/TypeActe";

const READ_ROLES = ["admin", "accueil", "biologiste", "caisse", "comptable", "infirmier", "medecin", "pharmacien", "radiologue", "technicienlabo"];
const WRITE_ROLES = ["admin"];

// GET toutes les types d’acte
export async function GET(req: NextRequest) {
    const { context, response } = await withTenant(req, READ_ROLES);
    if (!context) return response;
    const TypeActe = getTenantModel<ITypeActe>(context.connection, "TypeActe");
    const actes = await TypeActe.find().sort({ Designation: 1, Hospitalisation: 1 }).lean();
    return NextResponse.json(actes);
}

// POST ajout d’un type d’acte
export async function POST(req: NextRequest) {
    const { context, response } = await withTenant(req, WRITE_ROLES);
    if (!context) return response;
    const TypeActe = getTenantModel<ITypeActe>(context.connection, "TypeActe");
    try {
        const body = await req.json();
        const { Designation, Hospitalisation } = body;

        if (!Designation) {
            return NextResponse.json({ error: "La désignation est obligatoire" }, { status: 400 });
        }

        const newActe = new TypeActe({ Designation, Hospitalisation });
        await newActe.save();

        return NextResponse.json(newActe, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
