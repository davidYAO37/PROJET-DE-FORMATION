import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { db } from "@/db/mongoConnect";
import { requireAuth } from "@/lib/auth";
import { payMaintenance } from "@/lib/licenceService";

export async function POST(req: NextRequest) {
  const { user, error } = await requireAuth(req, ["adminsuper"]);
  if (error) return error;

  try {
    await db();
    const body = await req.json();
    const { entrepriseId, price, currency, notes, paymentMethod } = body;

    if (!entrepriseId) {
      return NextResponse.json(
        { error: "entrepriseId requis" },
        { status: 400 }
      );
    }

    // Maintenance forfaitaire annuelle : toujours 12 mois, pas de calcul au mois.
    const updated = await payMaintenance(entrepriseId, {
      months: 12,
      price,
      currency: currency || "XOF",
      createdBy: user?._id,
      notes,
    });

    // Créer une commande validée et générer les documents (bon de commande + contrat de maintenance + reçu)
    try {
      const { LicenceOrder } = await import("@/models/licenceOrder");
      const year = new Date().getFullYear();
      const orderCount = await LicenceOrder.countDocuments({
        createdAt: { $gte: new Date(year, 0, 1) },
      });
      const order = await LicenceOrder.create({
        reference: `CMD-${year}-${String(orderCount + 1).padStart(4, "0")}`,
        entrepriseId: new Types.ObjectId(entrepriseId),
        initiatedBy: new Types.ObjectId(user?._id),
        action: "maintenance",
        modules: updated.modules || [],
        amount: price || 0,
        currency: currency || "XOF",
        status: "validated",
        paymentMethod: ["wave", "manual", "especes", "cheque", "bank_transfer", "carte", "mobile_money"].includes(paymentMethod)
          ? paymentMethod
          : "manual",
        notes: notes || "Paiement maintenance direct via gestion des licences",
        validatedBy: user?._id ? new Types.ObjectId(user._id) : undefined,
        validatedAt: new Date(),
        paidAt: new Date(),
      });

      const pdfGen = await import("@/lib/pdfGenerator");
      await pdfGen.generateAllForOrder(order._id.toString());
    } catch (err) {
      console.warn("Échec génération des documents de maintenance:", err);
    }

    return NextResponse.json(updated);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur paiement maintenance";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
