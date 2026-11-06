import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";
import { requireAuth } from "@/lib/auth";
import { Entreprise } from "@/models/entreprise";
import { LicenceOrder } from "@/models/licenceOrder";
import { generateContractPdf } from "@/lib/pdfGenerator";

export async function POST(req: NextRequest) {
  const { user, error } = await requireAuth(req, ["adminsuper"]);
  if (error) return error;

  try {
    await db();

    const entreprises = await Entreprise.find({}).lean();
    const results: { entreprise: string; contractType: string; url: string; error?: string }[] = [];

    for (const entreprise of entreprises) {
      try {
        // 1. Contrat d'acquisition (si licence achetée)
        if (entreprise.licenceType === "paid" && entreprise.licensePurchasedAt) {
          const purchaseOrder = await LicenceOrder.findOne({
            entrepriseId: entreprise._id,
            action: "purchase",
            status: { $in: ["validated", "paid_awaiting_validation"] },
          }).sort({ createdAt: -1 });

          if (purchaseOrder) {
            const contractUrl = await generateContractPdf(purchaseOrder, "acquisition");
            await LicenceOrder.findByIdAndUpdate(purchaseOrder._id, { acquisitionContractUrl: contractUrl });
            results.push({
              entreprise: entreprise.NomSociete || "—",
              contractType: "acquisition",
              url: contractUrl,
            });
          }
        }

        // 2. Contrat de maintenance (si maintenance acceptée)
        if (entreprise.maintenanceAccepted && entreprise.maintenanceDueDate) {
          const maintenanceOrder = await LicenceOrder.findOne({
            entrepriseId: entreprise._id,
            action: "maintenance",
            status: { $in: ["validated", "paid_awaiting_validation"] },
          }).sort({ createdAt: -1 });

          if (maintenanceOrder) {
            const contractUrl = await generateContractPdf(maintenanceOrder, "maintenance");
            await LicenceOrder.findByIdAndUpdate(maintenanceOrder._id, { maintenanceContractUrl: contractUrl });
            results.push({
              entreprise: entreprise.NomSociete || "—",
              contractType: "maintenance",
              url: contractUrl,
            });
          }
        }
      } catch (err) {
        results.push({
          entreprise: entreprise.NomSociete || "—",
          contractType: "error",
          url: "",
          error: err instanceof Error ? err.message : "Erreur inconnue",
        });
      }
    }

    return NextResponse.json({
      success: true,
      regenerated: results.filter((r) => !r.error).length,
      errors: results.filter((r) => r.error).length,
      total: entreprises.length,
      results,
    });
  } catch (err) {
    console.error("Erreur régénération contrats:", err);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
