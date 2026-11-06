import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { db } from "@/db/mongoConnect";
import { requireAuth } from "@/lib/auth";
import { purchaseLicence } from "@/lib/licenceService";
import { LicenceModuleCode, ALL_MODULE_CODES } from "@/lib/licenceModules";

export async function POST(req: NextRequest) {
  const { user, error } = await requireAuth(req, ["adminsuper"]);
  if (error) return error;

  try {
    await db();
    const body = await req.json();
    const { entrepriseId, modules, price, currency, notes, paymentMethod } = body;

    if (!entrepriseId) {
      return NextResponse.json(
        { error: "entrepriseId requis" },
        { status: 400 }
      );
    }

    const selectedModules: LicenceModuleCode[] =
      Array.isArray(modules) && modules.length > 0
        ? modules.filter((m): m is LicenceModuleCode =>
            ALL_MODULE_CODES.includes(m as LicenceModuleCode)
          )
        : [...ALL_MODULE_CODES];

    const updated = await purchaseLicence({
      entrepriseId,
      modules: selectedModules,
      price,
      currency: currency || "XOF",
      createdBy: user?._id,
      notes,
    });

    // Créer une commande validée et générer les documents (bon de commande + contrat d'acquisition)
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
        action: "purchase",
        modules: selectedModules,
        amount: price || 0,
        currency: currency || "XOF",
        status: "validated",
        paymentMethod: ["wave", "manual", "especes", "cheque", "bank_transfer", "carte", "mobile_money"].includes(paymentMethod)
          ? paymentMethod
          : "manual",
        notes: notes || "Achat direct via gestion des licences",
        validatedBy: user?._id ? new Types.ObjectId(user._id) : undefined,
        validatedAt: new Date(),
        paidAt: new Date(),
      });

      const pdfGen = await import("@/lib/pdfGenerator");
      await pdfGen.generateAllForOrder(order._id.toString());
    } catch (err) {
      console.warn("Échec génération des documents d'acquisition:", err);
    }

    return NextResponse.json(updated);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur achat licence";
    const status = message.includes("déjà été achetée") ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
