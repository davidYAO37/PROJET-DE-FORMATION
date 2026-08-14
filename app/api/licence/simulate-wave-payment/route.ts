import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";
import { LicenceOrder } from "@/models/licenceOrder";

// Endpoint de simulation Wave (mode test sans clé API).
// Met à jour une commande en paid_awaiting_validation avec une transaction fictive,
// puis redirige vers le callback officiel.
export async function POST(req: NextRequest) {
  try {
    await db();
    const { orderId, success = true } = await req.json();

    if (!orderId) {
      return NextResponse.json(
        { error: "orderId requis" },
        { status: 400 }
      );
    }

    const order = await LicenceOrder.findById(orderId);
    if (!order) {
      return NextResponse.json(
        { error: "Commande introuvable" },
        { status: 404 }
      );
    }

    if (order.status === "validated") {
      return NextResponse.json(
        { error: "Commande déjà validée" },
        { status: 409 }
      );
    }

    if (!success) {
      order.status = "failed";
      await order.save();
      return NextResponse.json({ success: false, message: "Paiement échoué" });
    }

    const transactionId = `wave_sim_${orderId}_${Date.now()}`;
    order.status = "paid_awaiting_validation";
    order.waveTransactionId = transactionId;
    order.paidAt = new Date();
    await order.save();

    const callbackUrl = new URL(
      "/api/licence/payment-callback",
      process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
    );
    callbackUrl.searchParams.set("orderId", orderId);
    callbackUrl.searchParams.set("transactionId", transactionId);

    return NextResponse.json({
      success: true,
      message: "Paiement simulé avec succès",
      callbackUrl: callbackUrl.toString(),
    });
  } catch (err) {
    console.error("Erreur simulation Wave:", err);
    return NextResponse.json(
      { error: "Erreur simulation Wave" },
      { status: 500 }
    );
  }
}
