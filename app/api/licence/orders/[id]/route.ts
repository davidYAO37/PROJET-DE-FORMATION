import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";
import { requireAuth } from "@/lib/auth";
import { LicenceOrder } from "@/models/licenceOrder";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireAuth(req);
  if (error) return error;

  try {
    await db();
    const { id } = await params;

    const order = await LicenceOrder.findById(id);
    if (!order) {
      return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
    }

    // Seul le super-admin ou un utilisateur de l'entreprise propriétaire peut consulter
    if (
      user?.type !== "adminsuper" &&
      order.entrepriseId.toString() !== user?.entrepriseId
    ) {
      return NextResponse.json({ error: "Accès interdit" }, { status: 403 });
    }

    // Masquer les documents sensibles pour l'entreprise tant que la commande n'est pas validée
    const orderObj: any = order.toObject();
    if (user?.type !== "adminsuper" && orderObj.status !== "validated") {
      delete orderObj.paymentReceiptUrl;
      delete orderObj.acquisitionContractUrl;
      delete orderObj.maintenanceContractUrl;
      // order form can be visible even before validation, keep as is or hide depending on policy
      delete orderObj.orderFormUrl;
    }

    return NextResponse.json(orderObj);
  } catch (err) {
    console.error("Erreur consultation commande:", err);
    return NextResponse.json(
      { error: "Erreur consultation commande" },
      { status: 500 }
    );
  }
}
