import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";
import { requireAuth } from "@/lib/auth";
import { purchaseLicence } from "@/lib/licenceService";
import { LicenceModuleCode, ALL_MODULE_CODES } from "@/lib/licenceModules";

export async function POST(req: NextRequest) {
  const { user, error } = await requireAuth(req, ["adminsuper"]);
  if (error) return error;

  try {
    await db();
    const body = await req.json();
    const { entrepriseId, durationMonths, modules, price, currency, notes } = body;

    if (!entrepriseId || typeof durationMonths !== "number" || durationMonths <= 0) {
      return NextResponse.json(
        { error: "entrepriseId et durationMonths (nombre positif) requis" },
        { status: 400 }
      );
    }

    const selectedModules: LicenceModuleCode[] =
      Array.isArray(modules) && modules.length > 0
        ? modules.filter((m): m is LicenceModuleCode =>
            ALL_MODULE_CODES.includes(m as LicenceModuleCode)
          )
        : [...ALL_MODULE_CODES];

    const updated = await purchaseLicence({
      entrepriseId,
      durationMonths,
      modules: selectedModules,
      price,
      currency: currency || "XOF",
      createdBy: user?._id,
      notes,
    });

    return NextResponse.json(updated);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur achat licence";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
