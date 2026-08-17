import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";
import { requireAuth } from "@/lib/auth";
import { cancelOrder } from "@/lib/licenceService";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireAuth(req, ["adminsuper"]);
  if (error) return error;

  try {
    await db();
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "id requis" }, { status: 400 });
    }

    const updated = await cancelOrder(id, user?._id || "");
    return NextResponse.json(updated);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur annulation commande";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
