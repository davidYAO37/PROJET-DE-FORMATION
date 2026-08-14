import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";
import { LicenceOrder } from "@/models/licenceOrder";
import { verifyWaveTransaction } from "@/lib/wave";

// Route appelée par le navigateur après retour du paiement Wave.
// Elle vérifie le statut de la transaction Wave et met à jour la commande.
export async function GET(req: NextRequest) {
  try {
    await db();
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("orderId");
    const transactionId = searchParams.get("transactionId") || searchParams.get("id");

    if (!orderId) {
      return NextResponse.json(
        { error: "Identifiant commande manquant" },
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
      return NextResponse.json({
        success: true,
        message: "Commande déjà validée",
        orderId,
      });
    }

    if (order.status === "paid_awaiting_validation") {
      return NextResponse.json({
        success: true,
        message: "Paiement reçu, en attente de validation par l'administrateur",
        orderId,
      });
    }

    let verified = false;
    if (transactionId && order.paymentMethod === "wave") {
      const tx = await verifyWaveTransaction(transactionId);
      if (tx && tx.status === "succeeded" && tx.amount >= order.amount) {
        verified = true;
      }
    }

    if (verified) {
      order.status = "paid_awaiting_validation";
      order.waveTransactionId = transactionId || undefined;
      order.paidAt = new Date();
      await order.save();

      return NextResponse.json({
        success: true,
        message: "Paiement confirmé. Un administrateur validera votre licence.",
        orderId,
      });
    }

    return NextResponse.json({
      success: false,
      message: "Paiement non confirmé. Veuillez réessayer ou contacter l'administrateur.",
      orderId,
    });
  } catch (err) {
    console.error("Erreur callback Wave:", err);
    return NextResponse.json(
      { error: "Erreur traitement paiement" },
      { status: 500 }
    );
  }
}
