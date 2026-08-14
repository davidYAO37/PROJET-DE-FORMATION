import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";
import { requireAuth } from "@/lib/auth";
import { LicenceOrder } from "@/models/licenceOrder";
import { createLicenceOrder } from "@/lib/licenceService";
import { LicenceModuleCode, ALL_MODULE_CODES } from "@/lib/licenceModules";

// GET : super-admin liste toutes les commandes (optionnellement filtrées par statut)
export async function GET(req: NextRequest) {
  const { user, error } = await requireAuth(req, ["adminsuper"]);
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
      durationMonths,
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

    if (!action || !["purchase", "renewal", "maintenance"].includes(action)) {
      return NextResponse.json(
        { error: "action invalide (purchase, renewal, maintenance)" },
        { status: 400 }
      );
    }

    if (typeof durationMonths !== "number" || durationMonths <= 0) {
      return NextResponse.json(
        { error: "durationMonths (nombre positif) requis" },
        { status: 400 }
      );
    }

    if (typeof amount !== "number" || amount < 0) {
      return NextResponse.json(
        { error: "amount (nombre positif) requis" },
        { status: 400 }
      );
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
      durationMonths,
      modules: selectedModules,
      amount,
      currency: currency || "XOF",
      paymentMethod: paymentMethod || "wave",
      notes,
    });

    return NextResponse.json({ order, paymentUrl }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur création commande";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
