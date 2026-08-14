import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";
import { requireAuth } from "@/lib/auth";
import { payMaintenance } from "@/lib/licenceService";

export async function POST(req: NextRequest) {
  const { user, error } = await requireAuth(req, ["adminsuper"]);
  if (error) return error;

  try {
    await db();
    const body = await req.json();
    const { entrepriseId, months, price, currency, notes } = body;

    if (!entrepriseId) {
      return NextResponse.json(
        { error: "entrepriseId requis" },
        { status: 400 }
      );
    }

    const updated = await payMaintenance(entrepriseId, {
      months: typeof months === "number" && months > 0 ? months : 12,
      price,
      currency: currency || "XOF",
      createdBy: user?._id,
      notes,
    });

    return NextResponse.json(updated);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur paiement maintenance";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
