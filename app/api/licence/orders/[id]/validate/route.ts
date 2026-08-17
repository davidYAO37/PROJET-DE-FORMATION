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
    const { notes, amount } = body || {};

    // If a super-admin provides an amount override, update the order before validating
    if (typeof amount === "number") {
      const order = await (await import("@/models/licenceOrder")).LicenceOrder.findById(id);
      if (!order) return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
      order.amount = amount;
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
