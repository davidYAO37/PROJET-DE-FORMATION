import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/lib/withTenant";
import { getTenantModel } from "@/lib/tenantModels";
import { IPrescriptionHospitalisation } from "@/models/hospitalisation/PrescriptionHospitalisation";

const ROLES = ["admin", "medecin", "infirmier"];

export async function GET(req: NextRequest) {
  const { context, response } = await withTenant(req, ROLES);
  if (!context) return response;
  const { connection } = context;

  try {
    const { searchParams } = new URL(req.url);
    const hospitalisationId = searchParams.get("hospitalisationId");
    const statut = searchParams.get("statut");

    const query: Record<string, string> = {};
    if (hospitalisationId) query.hospitalisationId = hospitalisationId;
    if (statut) query.statut = statut;

    const Prescription = getTenantModel<IPrescriptionHospitalisation>(connection, "PrescriptionHospitalisation");
    const prescriptions = await Prescription.find(query)
      .populate("medecinId", "nom prenoms")
      .sort({ dateDebut: -1 })
      .lean();

    return NextResponse.json({ success: true, data: prescriptions });
  } catch (error) {
    console.error("Erreur GET prescriptions:", error);
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
    if (!body.hospitalisationId || !body.patientId || !body.medicament || !body.dosage) {
      return NextResponse.json(
        { success: false, error: "Champs requis manquants" },
        { status: 400 }
      );
    }

    const Prescription = getTenantModel<IPrescriptionHospitalisation>(connection, "PrescriptionHospitalisation");
    const prescription = await Prescription.create({
      ...body,
      createdBy: userObjectId,
      dateDebut: body.dateDebut ? new Date(body.dateDebut) : new Date(),
      dateFin: body.dateFin ? new Date(body.dateFin) : undefined,
      statut: "en_attente",
      administrer: false,
    });

    return NextResponse.json({ success: true, data: prescription }, { status: 201 });
  } catch (error) {
    console.error("Erreur POST prescription:", error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur", details: error instanceof Error ? error.message : "" },
      { status: 500 }
    );
  }
}
