import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";
import { requireAuth } from "@/lib/auth";
import { LicenceHistory } from "@/models/licenceHistory";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireAuth(req, ["adminsuper"]);
  if (error) return error;

  try {
    await db();
    const { id } = await params;

    const history = await LicenceHistory.find({ entrepriseId: id })
      .sort({ createdAt: -1 })
      .limit(200);

    return NextResponse.json(history);
  } catch (err) {
    console.error("Erreur historique licence:", err);
    return NextResponse.json(
      { error: "Erreur récupération historique" },
      { status: 500 }
    );
  }
}
