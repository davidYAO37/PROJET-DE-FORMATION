import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";
import { requireAuth } from "@/lib/auth";
import { updateLicenceModules } from "@/lib/licenceService";
import { LicenceModuleCode, ALL_MODULE_CODES } from "@/lib/licenceModules";

// La licence étant perpétuelle et forfaitaire, ce endpoint ne sert plus qu'à modifier
// les modules inclus dans une licence déjà achetée : pas de durée ni de montant à recalculer.
export async function POST(req: NextRequest) {
  const { user, error } = await requireAuth(req, ["adminsuper"]);
  if (error) return error;

  try {
    await db();
    const body = await req.json();
    const { entrepriseId, modules, notes } = body;

    if (!entrepriseId) {
      return NextResponse.json({ error: "entrepriseId requis" }, { status: 400 });
    }

    const selectedModules: LicenceModuleCode[] =
      Array.isArray(modules) && modules.length > 0
        ? modules.filter((m): m is LicenceModuleCode =>
            ALL_MODULE_CODES.includes(m as LicenceModuleCode)
          )
        : [...ALL_MODULE_CODES];

    const updated = await updateLicenceModules(entrepriseId, selectedModules, user?._id, notes);

    return NextResponse.json(updated);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur modification des modules";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
