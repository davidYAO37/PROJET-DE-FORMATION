import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/lib/withTenant";
import { getTenantModel } from "@/lib/tenantModels";
import { IFactureHospitalisation } from "@/models/hospitalisation/FactureHospitalisation";

const ROLES = ["admin", "medecin", "accueil"];

export async function GET(req: NextRequest) {
  const { context, response } = await withTenant(req, [...ROLES, "infirmier"]);
  if (!context) return response;
  const { connection } = context;

  try {
    const { searchParams } = new URL(req.url);
    const hospitalisationId = searchParams.get("hospitalisationId");
    const statut = searchParams.get("statut");

    const query: Record<string, string> = {};
    if (hospitalisationId) query.hospitalisationId = hospitalisationId;
    if (statut) query.statut = statut;

    const Facture = getTenantModel<IFactureHospitalisation>(connection, "FactureHospitalisation");
    const factures = await Facture.find(query)
      .populate("patientId", "Nom Prenoms Code_dossier")
      .sort({ dateEmission: -1 })
      .lean();

    return NextResponse.json({ success: true, data: factures });
  } catch (error) {
    console.error("Erreur GET factures hospitalisation:", error);
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
    if (!body.hospitalisationId || !body.patientId) {
      return NextResponse.json(
        { success: false, error: "hospitalisationId et patientId sont requis" },
        { status: 400 }
      );
    }

    const Facture = getTenantModel<IFactureHospitalisation>(connection, "FactureHospitalisation");
    const countFactures = await Facture.countDocuments();
    const numeroFacture = body.numeroFacture || `FH-${(countFactures + 1).toString().padStart(5, "0")}`;

    const facture = await Facture.create({
      ...body,
      numeroFacture,
      dateEmission: body.dateEmission ? new Date(body.dateEmission) : new Date(),
      createdBy: userObjectId,
      statut: body.statut || "brouillon",
    });

    return NextResponse.json({ success: true, data: facture }, { status: 201 });
  } catch (error) {
    console.error("Erreur POST facture hospitalisation:", error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur", details: error instanceof Error ? error.message : "" },
      { status: 500 }
    );
  }
}
