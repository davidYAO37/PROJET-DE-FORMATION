import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/lib/withTenant";
import { getTenantModel } from "@/lib/tenantModels";
import { IConstanteHospitalisation } from "@/models/hospitalisation/ConstanteHospitalisation";

const ROLES = ["admin", "medecin", "infirmier"];

export async function GET(req: NextRequest) {
  const { context, response } = await withTenant(req, ROLES);
  if (!context) return response;
  const { connection } = context;

  try {
    const { searchParams } = new URL(req.url);
    const hospitalisationId = searchParams.get("hospitalisationId");
    const patientId = searchParams.get("patientId");

    const query: Record<string, string> = {};
    if (hospitalisationId) query.hospitalisationId = hospitalisationId;
    if (patientId) query.patientId = patientId;

    const Constante = getTenantModel<IConstanteHospitalisation>(connection, "ConstanteHospitalisation");
    const constantes = await Constante.find(query)
      .sort({ date: -1, heure: -1 })
      .lean();

    return NextResponse.json({ success: true, data: constantes });
  } catch (error) {
    console.error("Erreur GET constantes:", error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur", details: error instanceof Error ? error.message : "" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const { context, response } = await withTenant(req, ROLES);
  if (!context) return response;
  const { connection, userObjectId } = context;

  try {
    const body = await req.json();
    if (!body.hospitalisationId || !body.patientId || !body.heure) {
      return NextResponse.json(
        { success: false, error: "hospitalisationId, patientId et heure sont requis" },
        { status: 400 }
      );
    }

    const Constante = getTenantModel<IConstanteHospitalisation>(connection, "ConstanteHospitalisation");
    const constante = await Constante.create({
      ...body,
      createdBy: userObjectId,
      date: body.date ? new Date(body.date) : new Date(),
    });

    return NextResponse.json({ success: true, data: constante }, { status: 201 });
  } catch (error) {
    console.error("Erreur POST constante:", error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur", details: error instanceof Error ? error.message : "" },
      { status: 500 }
    );
  }
}
