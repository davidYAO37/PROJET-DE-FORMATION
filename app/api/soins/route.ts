import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/lib/withTenant";
import { getTenantModel } from "@/lib/tenantModels";
import { ISoinHospitalisation } from "@/models/hospitalisation/SoinHospitalisation";
import { refreshRapportHospitalisation } from "@/lib/rapportHospitalisation";

const ROLES = ["admin", "medecin", "infirmier"];

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

    const Soin = getTenantModel<ISoinHospitalisation>(connection, "SoinHospitalisation");
    const soins = await Soin.find(query)
      .populate("createdBy", "nom prenoms")
      .sort({ date: -1, heure: -1 })
      .lean();

    return NextResponse.json({ success: true, data: soins });
  } catch (error) {
    console.error("Erreur GET soins:", error);
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
    if (!body.hospitalisationId || !body.patientId || !body.type || !body.description || !body.heure) {
      return NextResponse.json(
        { success: false, error: "Champs requis manquants" },
        { status: 400 }
      );
    }

    const Soin = getTenantModel<ISoinHospitalisation>(connection, "SoinHospitalisation");
    const soin = await Soin.create({
      ...body,
      createdBy: userObjectId,
      date: body.date ? new Date(body.date) : new Date(),
      validation: { valide: false },
    });

    try {
      await refreshRapportHospitalisation(connection, body.hospitalisationId);
    } catch (refreshError) {
      console.error("Erreur lors de l'actualisation du rapport d'hospitalisation:", refreshError);
    }

    return NextResponse.json({ success: true, data: soin }, { status: 201 });
  } catch (error) {
    console.error("Erreur POST soin:", error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur", details: error instanceof Error ? error.message : "" },
      { status: 500 }
    );
  }
}
