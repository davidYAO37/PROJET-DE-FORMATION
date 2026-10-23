import { NextRequest, NextResponse } from "next/server";
import { requirePatientAuth } from "@/lib/patientAuth";
import { getTenantModel } from "@/lib/tenantModels";
import { IMedecin } from "@/models/medecin";
import { getPrimaryConnection } from "@/lib/tenantDb";
import "@/models";

// Liste des médecins de l'établissement (pour le formulaire de demande de RDV).
export async function GET(req: NextRequest) {
  const { context, response } = await requirePatientAuth(req);
  if (!context) return response;

  try {
    const Medecin = getTenantModel<IMedecin>(context.connection, "Medecin");
    const filter = context.connection === await getPrimaryConnection() ? { entrepriseId: context.entrepriseId } : {};
    const medecins = await Medecin.find(filter)
      .select("nom prenoms specialite")
      .sort({ nom: 1 })
      .lean();

    return NextResponse.json(
      {
        medecins: medecins.map((m: any) => ({
          _id: m._id.toString(),
          nom: `${m.nom} ${m.prenoms || ""}`.trim(),
          specialite: m.specialite || "",
        })),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur médecins portail:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
