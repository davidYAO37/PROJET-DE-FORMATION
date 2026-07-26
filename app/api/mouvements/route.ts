import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/lib/withTenant";
import { getTenantModel } from "@/lib/tenantModels";
import { IMouvementHospitalisation } from "@/models/hospitalisation/MouvementHospitalisation";

const ROLES = ["admin", "medecin", "accueil", "infirmier"];

export async function GET(req: NextRequest) {
  const { context, response } = await withTenant(req, ROLES);
  if (!context) return response;
  const { connection } = context;

  try {
    const { searchParams } = new URL(req.url);
    const hospitalisationId = searchParams.get("hospitalisationId");
    const type = searchParams.get("type");

    const query: Record<string, string> = {};
    if (hospitalisationId) query.hospitalisationId = hospitalisationId;
    if (type) query.type = type;

    const Mouvement = getTenantModel<IMouvementHospitalisation>(connection, "MouvementHospitalisation");
    const mouvements = await Mouvement.find(query)
      .populate("auteurId", "nom prenoms")
      .populate("chambreIdSource", "numero")
      .populate("litIdSource", "numero")
      .populate("chambreIdCible", "numero")
      .populate("litIdCible", "numero")
      .sort({ date: -1, heure: -1 })
      .lean();

    return NextResponse.json({ success: true, data: mouvements });
  } catch (error) {
    console.error("Erreur GET mouvements:", error);
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
    if (!body.hospitalisationId || !body.patientId || !body.type || !body.heure) {
      return NextResponse.json(
        { success: false, error: "hospitalisationId, patientId, type et heure sont requis" },
        { status: 400 }
      );
    }

    const Mouvement = getTenantModel<IMouvementHospitalisation>(connection, "MouvementHospitalisation");
    const mouvement = await Mouvement.create({
      ...body,
      auteurId: userObjectId,
      date: body.date ? new Date(body.date) : new Date(),
    });

    return NextResponse.json({ success: true, data: mouvement }, { status: 201 });
  } catch (error) {
    console.error("Erreur POST mouvement:", error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur", details: error instanceof Error ? error.message : "" },
      { status: 500 }
    );
  }
}
