import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/lib/withTenant";
import { getTenantModel } from "@/lib/tenantModels";
import { IParamBiochimie } from "@/models/paramBiochimie";

const READ_ROLES = ["admin", "accueil", "biologiste", "caisse", "comptable", "infirmier", "medecin", "pharmacien", "radiologue", "technicienlabo"];
const WRITE_ROLES = ["admin"];

export async function GET(req: NextRequest) {
    const { context, response } = await withTenant(req, READ_ROLES);
    if (!context) return response;
    const ParamBiochimie = getTenantModel<IParamBiochimie>(context.connection, "ParamBiochimie");

    try {
        const paramBiochimies = await ParamBiochimie.find({}).sort({ CodeB: 1 }).lean();
        return NextResponse.json(paramBiochimies);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const { context, response } = await withTenant(req, WRITE_ROLES);
    if (!context) return response;
    const ParamBiochimie = getTenantModel<IParamBiochimie>(context.connection, "ParamBiochimie");

    try {
        const body = await req.json();
        const newParamBiochimie = new ParamBiochimie(body);
        await newParamBiochimie.save();
        return NextResponse.json(newParamBiochimie, { status: 201 });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}
