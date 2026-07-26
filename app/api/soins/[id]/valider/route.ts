import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/lib/withTenant";
import { getTenantModel } from "@/lib/tenantModels";
import { ISoinHospitalisation } from "@/models/hospitalisation/SoinHospitalisation";

const ROLES = ["admin", "medecin", "infirmier"];

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { context, response } = await withTenant(req, ROLES);
  if (!context) return response;
  const { connection, userObjectId } = context;

  try {
    const { id } = await params;
    const Soin = getTenantModel<ISoinHospitalisation>(connection, "SoinHospitalisation");
    const soin = await Soin.findByIdAndUpdate(
      id,
      {
        "validation.valide": true,
        "validation.validePar": userObjectId,
        "validation.valideLe": new Date(),
      },
      { new: true }
    );

    if (!soin) {
      return NextResponse.json({ success: false, error: "Soin introuvable" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: soin });
  } catch (error) {
    console.error("Erreur validation soin:", error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur", details: error instanceof Error ? error.message : "" },
      { status: 500 }
    );
  }
}
