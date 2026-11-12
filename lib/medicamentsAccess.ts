import { NextRequest, NextResponse } from "next/server";
import { withTenant, TenantContext } from "./withTenant";

type AccesResult =
    | { context: TenantContext; response: null }
    | { context: null; response: NextResponse };

/**
 * Contrôle d'accès au catalogue des médicaments.
 *
 * - Le rôle `pharmacien` gère la liste des médicaments par défaut (son service).
 * - `admin` / `adminsuper` passent toujours.
 * - Tout autre rôle autorisé doit posséder l'action `parametrage_pharmacie`.
 */
export async function accesCatalogueMedicaments(
    req: NextRequest,
    roles: string[]
): Promise<AccesResult> {
    const { context, response } = await withTenant(req, roles);
    if (!context) return { context: null, response };

    const type = context.user.type;
    if (type === "pharmacien" || type === "admin" || type === "adminsuper") {
        return { context, response: null };
    }

    const priv = await withTenant(req, undefined, { actions: ["parametrage_pharmacie"] });
    if (!priv.context) return { context: null, response: priv.response };

    return { context, response: null };
}
