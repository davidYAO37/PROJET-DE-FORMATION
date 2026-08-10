import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/lib/withTenant";
import { getTenantModel } from "@/lib/tenantModels";
import { IAssurance } from "@/models/assurance";

const READ_ROLES = ["admin", "accueil", "biologiste", "caisse", "comptable", "infirmier", "medecin", "pharmacien", "radiologue", "technicienlabo"];
const WRITE_ROLES = ["admin"];

export async function GET(req: NextRequest) {
  const { context, response } = await withTenant(req, READ_ROLES);
  if (!context) return response;
  const Assurance = getTenantModel<IAssurance>(context.connection, "Assurance");

  try {
    const assurances = await Assurance.find().lean();

    return NextResponse.json(assurances);
  } catch (error: any) {
    console.error("❌ ERREUR GET /assurances :", error);

    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const { context, response } = await withTenant(req, WRITE_ROLES);
  if (!context) return response;
  const Assurance = getTenantModel<IAssurance>(context.connection, "Assurance");

  try {
    const body = await req.json();

    const assurance = await Assurance.create(body);

    return NextResponse.json(assurance);
  } catch (e: any) {
    console.error("❌ ERREUR POST /assurances :", e);

    return NextResponse.json(
      { error: e.message },
      { status: 400 }
    );
  }
}