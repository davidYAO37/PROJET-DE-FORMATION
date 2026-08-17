import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";
import { requireAuth } from "@/lib/auth";
import { LicenceOrder } from "@/models/licenceOrder";
import { createLicenceOrder } from "@/lib/licenceService";
import { LicenceModuleCode, ALL_MODULE_CODES } from "@/lib/licenceModules";
import { Entreprise } from "@/models/entreprise";

// GET : super-admin liste toutes les commandes (optionnellement filtrées par statut)
export async function GET(req: NextRequest) {
  const { user, error } = await requireAuth(req);
  if (error) return error;

  try {
    await db();
    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get("status");

    const filter: Record<string, unknown> = {};
    if (statusParam) {
      const statuses = statusParam.split(",").map((s) => s.trim());
      if (statuses.length === 1) {
        filter.status = statuses[0];
      } else {
        filter.status = { $in: statuses };
      }
    }

    // If user is not super-admin, restrict to their entreprise orders only
    if (!user || user.type !== "adminsuper") {
      if (!user?.entrepriseId) {
        return NextResponse.json({ error: "Aucune entreprise associée" }, { status: 403 });
      }
      filter.entrepriseId = user.entrepriseId;
    }

    const orders = await LicenceOrder.find(filter)
      .sort({ createdAt: -1 })
      .limit(500);

    return NextResponse.json(orders);
  } catch (err) {
    console.error("Erreur liste commandes licence:", err);
    return NextResponse.json(
      { error: "Erreur récupération commandes" },
      { status: 500 }
    );
  }
}

// POST : une entreprise crée une commande d'achat/renouvellement/maintenance
export async function POST(req: NextRequest) {
  const { user, error } = await requireAuth(req);
  if (error) return error;

  try {
    await db();
    const body = await req.json();
    const {
      action,
      modules,
      amount,
      currency,
      paymentMethod,
      notes,
    } = body;

    if (!user?.entrepriseId) {
      return NextResponse.json(
        { error: "Aucune entreprise associée" },
        { status: 403 }
      );
    }

    if (!action || !["purchase", "maintenance"].includes(action)) {
      return NextResponse.json(
        { error: "action invalide (purchase, maintenance)" },
        { status: 400 }
      );
    }

    // Regular tenant users cannot create purchase orders (only super-admins can).
    if (action === "purchase" && user.type !== "adminsuper") {
      return NextResponse.json({ error: "Accès interdit: demande d'achat non autorisée" }, { status: 403 });
    }

    const entrepriseForOrder = await Entreprise.findById(user.entrepriseId).lean();

    // La licence est perpétuelle : une seule commande d'achat par entreprise.
    if (action === "purchase" && entrepriseForOrder?.licenceType === "paid") {
      return NextResponse.json(
        { error: "La licence de cette entreprise a déjà été achetée (licence perpétuelle)." },
        { status: 409 }
      );
    }

    // Determine final amount and payment method. La licence et la maintenance sont
    // forfaitaires : le montant est le tarif fixe configuré pour l'entreprise, sans
    // calcul par module ni par mois.
    let finalAmount = typeof amount === "number" && amount >= 0 ? amount : 0;
    let finalPaymentMethod = paymentMethod || "wave";

    if (user && user.type !== "adminsuper") {
      // Non super-admins cannot trigger payment directly — set manual.
      finalPaymentMethod = "manual";
      finalAmount = action === "maintenance"
        ? (entrepriseForOrder?.maintenancePrice || 0)
        : (entrepriseForOrder?.licencePrice || 0);
    }

    const selectedModules: LicenceModuleCode[] =
      Array.isArray(modules) && modules.length > 0
        ? modules.filter((m): m is LicenceModuleCode =>
          ALL_MODULE_CODES.includes(m as LicenceModuleCode)
        )
        : [...ALL_MODULE_CODES];

    const { order, paymentUrl } = await createLicenceOrder({
      entrepriseId: user.entrepriseId,
      initiatedBy: user._id,
      action,
      modules: selectedModules,
      // do not allow tenants to override items; pass empty items so service computes from entreprise prices
      items: [],
      amount: finalAmount,
      currency: currency || "XOF",
      paymentMethod: finalPaymentMethod,
      notes,
    });

    return NextResponse.json({ order, paymentUrl }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur création commande";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
