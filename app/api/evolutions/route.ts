import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/lib/withTenant";
import { getTenantModel } from "@/lib/tenantModels";
import { IEvolutionMedicaleHospitalisation } from "@/models/hospitalisation/EvolutionMedicaleHospitalisation";

const ROLES = ["admin", "medecin"];

export async function GET(req: NextRequest) {
  const { context, response } = await withTenant(req, [...ROLES, "infirmier"]);
  if (!context) return response;
  const { connection } = context;

  try {
    const { searchParams } = new URL(req.url);
    const hospitalisationId = searchParams.get("hospitalisationId");

    const query: Record<string, string> = {};
    if (hospitalisationId) query.hospitalisationId = hospitalisationId;

    const Evolution = getTenantModel<IEvolutionMedicaleHospitalisation>(
      connection,
      "EvolutionMedicaleHospitalisation"
    );
    const evolutions = await Evolution.find(query)
      .populate("medecinId", "nom prenoms")
      .sort({ date: -1, heure: -1 })
      .lean();

    return NextResponse.json({ success: true, data: evolutions });
  } catch (error) {
    console.error("Erreur GET evolutions:", error);
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
    if (!body.hospitalisationId || !body.patientId || !body.observation || !body.heure) {
      return NextResponse.json(
        { success: false, error: "hospitalisationId, patientId, observation et heure sont requis" },
        { status: 400 }
      );
    }

    const Evolution = getTenantModel<IEvolutionMedicaleHospitalisation>(
      connection,
      "EvolutionMedicaleHospitalisation"
    );
    const evolution = await Evolution.create({
      ...body,
      createdBy: userObjectId,
      date: body.date ? new Date(body.date) : new Date(),
    });

    return NextResponse.json({ success: true, data: evolution }, { status: 201 });
  } catch (error) {
    console.error("Erreur POST evolution:", error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur", details: error instanceof Error ? error.message : "" },
      { status: 500 }
    );
  }
}
