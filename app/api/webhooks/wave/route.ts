import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";
import { LicenceOrder } from "@/models/licenceOrder";
import { verifyWaveWebhookSignature } from "@/lib/wave";

// Webhook appelé par Wave pour notifier d'un changement de statut de paiement.
// À adapter selon la documentation officielle de Wave (champs, signature, etc.).
export async function POST(req: NextRequest) {
  try {
    const payload = await req.text();
    const signature = req.headers.get("x-wave-signature") || "";

    if (!verifyWaveWebhookSignature(payload, signature)) {
      return NextResponse.json({ error: "Signature invalide" }, { status: 401 });
    }

    await db();
    const event = JSON.parse(payload);

    // Adapter les noms de champs selon la doc Wave
    const transactionId = event.transaction_id || event.id;
    const reference = event.external_reference;
    const status = event.status;

    if (!reference) {
      return NextResponse.json({ error: "Référence manquante" }, { status: 400 });
    }

    const order = await LicenceOrder.findOne({
      $or: [{ _id: reference }, { waveCheckoutId: reference }],
    });

    if (!order) {
      return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
    }

    if (order.status === "validated") {
      return NextResponse.json({ received: true });
    }

    if (status === "succeeded" || status === "success") {
      order.status = "paid_awaiting_validation";
      order.waveTransactionId = transactionId;
      order.paidAt = new Date();
      await order.save();
    } else if (status === "failed" || status === "cancelled") {
      order.status = "failed";
      await order.save();
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Erreur webhook Wave:", err);
    return NextResponse.json(
      { error: "Erreur traitement webhook" },
      { status: 500 }
    );
  }
}
