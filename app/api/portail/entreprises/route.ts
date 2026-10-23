import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";
import { Entreprise } from "@/models/entreprise";
import { getLicenceStatus } from "@/lib/licence";
import { hasModuleAccess } from "@/lib/moduleAccess";

// Liste publique des cliniques ayant activé le portail patient.
// N'expose que l'identifiant et le nom — aucune donnée sensible.
export async function GET(_req: NextRequest) {
  try {
    await db();
    const entreprises = await Entreprise.find({
      isActive: { $ne: false },
      statut: { $nin: ["suspendue", "resiliee"] },
    })
      .select("NomSociete nomSociete LogoE logo modules licenceStatus statut isActive licenceType licencePlan licenceStartDate licenceEndDate licensePurchasedAt maintenanceAccepted maintenanceDueDate gracePeriodDays")
      .lean();

    const items = entreprises
      .filter((e: any) => {
        const status = getLicenceStatus(e);
        if (status.isBlocked) return false;
        return hasModuleAccess(e, "portail_patient");
      })
      .map((e: any) => ({
        _id: e._id.toString(),
        nom: e.NomSociete || e.nomSociete || "Établissement",
        logo: e.LogoE || e.logo || "",
      }));

    return NextResponse.json({ entreprises: items }, { status: 200 });
  } catch (error) {
    console.error("Erreur liste entreprises portail:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
