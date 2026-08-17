import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";
import { requireAuth } from "@/lib/auth";
import { LicenceOrder } from "@/models/licenceOrder";
import { isWaveConfigured } from "@/lib/wave";

// Endpoint de simulation Wave (mode test sans clé API).
// Met à jour une commande en paid_awaiting_validation avec une transaction fictive,
// puis redirige vers le callback officiel.
//
// Sécurité : ce endpoint ne doit exister que pour permettre de tester le flux de
// paiement sans clé Wave réelle. Sans les gardes ci-dessous, n'importe qui
// connaissant/devinant un orderId pourrait marquer une commande comme "payée"
// sans avoir réellement payé.
export async function POST(req: NextRequest) {
  // Le simulateur ne doit jamais être utilisable si une vraie intégration Wave
  // est configurée (production) : sinon on pourrait contourner un vrai paiement.
  if (isWaveConfigured()) {
    return NextResponse.json(
      { error: "Le simulateur Wave est désactivé (intégration Wave réelle configurée)." },
      { status: 403 }
    );
  }

  const { user, error } = await requireAuth(req);
  if (error) return error;

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

    // Seul le super-admin ou l'entreprise propriétaire de la commande peut
    // simuler son paiement.
    if (user?.type !== "adminsuper" && order.entrepriseId.toString() !== user?.entrepriseId) {
      return NextResponse.json({ error: "Accès interdit" }, { status: 403 });
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
