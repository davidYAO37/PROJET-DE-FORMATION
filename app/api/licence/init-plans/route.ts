import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";
import { requireAuth } from "@/lib/auth";
import { LicencePlan } from "@/models/licencePlan";
import { DEFAULT_LICENCE_PLANS } from "@/lib/licenceDefaults";

export async function POST(req: NextRequest) {
  const { error } = await requireAuth(req, ["adminsuper"]);
  if (error) return error;

  try {
    await db();

    for (const plan of DEFAULT_LICENCE_PLANS) {
      await LicencePlan.findOneAndUpdate(
        { code: plan.code },
        { $setOnInsert: plan },
        { upsert: true, new: true }
      );
    }

    const plans = await LicencePlan.find({ isActive: true }).sort({ defaultPrice: 1 });
    return NextResponse.json({ message: "Plans initialisés", plans });
  } catch (err) {
    console.error("Erreur initialisation plans:", err);
    return NextResponse.json(
      { error: "Erreur initialisation plans" },
      { status: 500 }
    );
  }
}
