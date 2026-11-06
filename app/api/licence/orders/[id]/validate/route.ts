import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";
import { requireAuth } from "@/lib/auth";
import { validateOrder } from "@/lib/licenceService";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireAuth(req, ["adminsuper"]);
  if (error) return error;

  try {
    await db();
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const { notes, amount, paymentMethod, montantPaye } = body || {};

    const ALLOWED_METHODS = ["wave", "manual", "especes", "cheque", "bank_transfer", "carte", "mobile_money"];

    // If a super-admin provides an amount override, a payment method or a paid amount, update the order before validating
    if (typeof amount === "number" || typeof montantPaye === "number" || (paymentMethod && ALLOWED_METHODS.includes(paymentMethod))) {
      const order = await (await import("@/models/licenceOrder")).LicenceOrder.findById(id);
      if (!order) return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
      if (typeof amount === "number") order.amount = amount;
      if (paymentMethod && ALLOWED_METHODS.includes(paymentMethod)) {
        order.paymentMethod = paymentMethod;
      }
      // Le paiement est confirmé à la validation pour les paiements manuels
      if (!order.paidAt) order.paidAt = new Date();
      if (typeof montantPaye === "number") order.montantPaye = montantPaye;
      await order.save();
    }

    if (!id) {
      return NextResponse.json({ error: "id requis" }, { status: 400 });
    }

    const updated = await validateOrder(id, user?._id || "");

    // Après validation, générer automatiquement les documents PDF et attacher leurs URLs
    try {
      const pdfGen = await import("@/lib/pdfGenerator");
      await pdfGen.generateAllForOrder(id);
    } catch (err) {
      console.warn("Échec génération PDF pour la commande", id, err);
    }

    return NextResponse.json(updated);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur validation commande";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
