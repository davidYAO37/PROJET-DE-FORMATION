import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/lib/withTenant";
import { getTenantModel } from "@/lib/tenantModels";
import { IPrescriptionHospitalisation } from "@/models/hospitalisation/PrescriptionHospitalisation";

const ROLES = ["admin", "medecin", "infirmier"];

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { context, response } = await withTenant(req, ROLES);
  if (!context) return response;
  const { connection, userObjectId } = context;

  try {
    const { id } = await params;
    const Prescription = getTenantModel<IPrescriptionHospitalisation>(connection, "PrescriptionHospitalisation");
    const prescription = await Prescription.findByIdAndUpdate(
      id,
      {
        statut: "administre",
        administrer: true,
        administrerPar: userObjectId,
        administrerLe: new Date(),
      },
      { new: true }
    );

    if (!prescription) {
      return NextResponse.json({ success: false, error: "Prescription introuvable" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: prescription });
  } catch (error) {
    console.error("Erreur administration prescription:", error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur", details: error instanceof Error ? error.message : "" },
      { status: 500 }
    );
  }
}
