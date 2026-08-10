import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/lib/withTenant";
import { getTenantModel } from "@/lib/tenantModels";
import { IParamLabo } from "@/models/paramLabo";

const READ_ROLES = ["admin", "accueil", "biologiste", "caisse", "comptable", "infirmier", "medecin", "pharmacien", "radiologue", "technicienlabo"];
const WRITE_ROLES = ["admin"];

export async function GET(req: NextRequest) {
    const { context, response } = await withTenant(req, READ_ROLES);
    if (!context) return response;
    const ParamLabo = getTenantModel<IParamLabo>(context.connection, "ParamLabo");

    try {
        const paramLabos = await ParamLabo.find({}).sort({ Param_designation: 1 }).lean();
        return NextResponse.json(paramLabos);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const { context, response } = await withTenant(req, WRITE_ROLES);
    if (!context) return response;
    const ParamLabo = getTenantModel<IParamLabo>(context.connection, "ParamLabo");

    try {
        const body = await req.json();
        const newParamLabo = new ParamLabo(body);
        await newParamLabo.save();
        return NextResponse.json(newParamLabo, { status: 201 });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}
