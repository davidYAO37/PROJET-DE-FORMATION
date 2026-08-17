import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";
import { requireAuth, getImpersonateEntrepriseId } from "@/lib/auth";
import { Entreprise } from "@/models/entreprise";
import { getLicenceStatus } from "@/lib/licence";
import { User } from "@/models/users.model";

export async function GET(req: NextRequest) {
  const { user, error } = await requireAuth(req);
  if (error) return error;

  try {
    await db();

    // Un adminsuper qui impersonne un tenant doit voir le statut de licence
    // de l'entreprise impersonnée (pas la sienne, qu'il n'a pas), pour que les
    // bannières/sidebars reflètent correctement l'entreprise en cours de test.
    const entrepriseId =
      user!.type === "adminsuper"
        ? (await getImpersonateEntrepriseId(req)) || user?.entrepriseId
        : user?.entrepriseId;
    if (!entrepriseId) {
      return NextResponse.json(
        { error: "Aucune entreprise associée" },
        { status: 403 }
      );
    }

    const entreprise = await Entreprise.findById(entrepriseId).lean();
    if (!entreprise) {
      return NextResponse.json(
        { error: "Entreprise introuvable" },
        { status: 404 }
      );
    }

    const userCount = await User.countDocuments({ entrepriseId });
    const status = getLicenceStatus(entreprise);

    return NextResponse.json({
      ...status,
      licenceType: entreprise.licenceType || null,
      licencePlan: entreprise.licencePlan || null,
      licenceStartDate: entreprise.licenceStartDate || null,
      licenceEndDate: entreprise.licenceEndDate || null,
      licensePurchasedAt: entreprise.licensePurchasedAt || null,
      maintenanceAccepted: !!entreprise.maintenanceAccepted,
      maintenanceDueDate: entreprise.maintenanceDueDate || null,
      gracePeriodDays: entreprise.gracePeriodDays ?? 15,
      modules: entreprise.modules || [],
      userCount,
      lastAlertShownAt: entreprise.lastAlertShownAt || null,
    });
  } catch (err) {
    console.error("Erreur statut licence:", err);
    return NextResponse.json(
      { error: "Erreur récupération statut licence" },
      { status: 500 }
    );
  }
}
