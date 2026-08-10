import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/lib/withTenant";
import { getTenantModel } from "@/lib/tenantModels";
import { IParametreNfs } from "@/models/parametreNfs";

const READ_ROLES = ["admin", "accueil", "biologiste", "caisse", "comptable", "infirmier", "medecin", "pharmacien", "radiologue", "technicienlabo"];
const WRITE_ROLES = ["admin"];

export async function GET(req: NextRequest) {
    const { context, response } = await withTenant(req, READ_ROLES);
    if (!context) return response;
    const ParametreNfs = getTenantModel<IParametreNfs>(context.connection, "ParametreNfs");
    try {
        const params = await ParametreNfs.find().sort({ PARAMETRE: 1 });
        return NextResponse.json({ success: true, data: params });
    } catch (error) {
        console.error("Erreur GET ParametreNfs:", error);
        return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const { context, response } = await withTenant(req, WRITE_ROLES);
    if (!context) return response;
    const ParametreNfs = getTenantModel<IParametreNfs>(context.connection, "ParametreNfs");
    try {
        const body = await req.json();
        const { PARAMETRE, DESCRIPTION } = body;

        if (!PARAMETRE) {
            return NextResponse.json({ message: "PARAMETRE est requis" }, { status: 400 });
        }

        const nouveau = await ParametreNfs.create({ PARAMETRE, DESCRIPTION });
        return NextResponse.json({ success: true, data: nouveau, message: "Paramètre créé" }, { status: 201 });
    } catch (error) {
        console.error("Erreur POST ParametreNfs:", error);
        return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
    }
}
