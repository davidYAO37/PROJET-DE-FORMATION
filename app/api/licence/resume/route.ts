import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";
import { requireAuth } from "@/lib/auth";
import { resumeEntreprise } from "@/lib/licenceService";

export async function POST(req: NextRequest) {
  const { user, error } = await requireAuth(req, ["adminsuper"]);
  if (error) return error;

  try {
    await db();
    const { entrepriseId, notes } = await req.json();

    if (!entrepriseId) {
      return NextResponse.json({ error: "entrepriseId requis" }, { status: 400 });
    }

    const updated = await resumeEntreprise(entrepriseId, user?._id, notes);
    return NextResponse.json(updated);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur réactivation";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
