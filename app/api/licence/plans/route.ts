import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";
import { requireAuth } from "@/lib/auth";
import { LicencePlan } from "@/models/licencePlan";

export async function GET(req: NextRequest) {
  const { error } = await requireAuth(req);
  if (error) return error;

  try {
    await db();
    const plans = await LicencePlan.find({ isActive: true }).sort({ defaultPrice: 1 });
    return NextResponse.json(plans);
  } catch (err) {
    console.error("Erreur plans licence:", err);
    return NextResponse.json(
      { error: "Erreur récupération plans" },
      { status: 500 }
    );
  }
}
