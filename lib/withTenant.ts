import { NextRequest, NextResponse } from "next/server";
import mongoose, { Model, Types } from "mongoose";
import { verifyToken, getTokenFromCookies, getImpersonateEntrepriseId, type JWTPayload } from "./auth";
import { expandAllowedRoles } from "@/lib/roleUtils";
import { hasActionPermission, matchesAllowedRoles } from "@/lib/permissions";
import { db } from "@/db/mongoConnect";
import { User } from "@/models/users.model";
import { getTenantConnection, getPrimaryConnection } from "./tenantDb";
import { getTenantModel, type TenantDocument } from "./tenantModels";

export interface AuthenticatedUser extends JWTPayload {
  userId: string;
  email: string;
  type: string;
  entrepriseId?: string;
}

export interface TenantContext {
  user: AuthenticatedUser;
  userObjectId: Types.ObjectId;
  connection: mongoose.Connection;
  entrepriseId?: string;
  isSharedConnection: boolean;
}

type WithTenantResult =
  | { context: TenantContext; response: null }
  | { context: null; response: NextResponse };

export function getTenantFilter(context: TenantContext): Record<string, string> {
  return context.isSharedConnection && context.entrepriseId
    ? { entrepriseId: context.entrepriseId }
    : {};
}

export interface WithTenantOptions {
  /**
   * Actions requises : l'utilisateur doit posséder TOUTES ces actions.
   * Alternative au rôle : un utilisateur dont le type n'est pas dans
   * allowedRoles mais qui possède ces actions passe.
   */
  actions?: string[];
}

export async function withTenant(
  req: NextRequest,
  allowedRoles?: string[],
  options?: WithTenantOptions
): Promise<WithTenantResult> {
  const token =
    req.cookies.get("easy_medical_token")?.value || (await getTokenFromCookies());

  if (!token) {
    return {
      context: null,
      response: NextResponse.json({ message: "Non authentifié" }, { status: 401 }),
    };
  }

  const payload = verifyToken(token);
  if (!payload) {
    return {
      context: null,
      response: NextResponse.json({ message: "Token invalide" }, { status: 401 }),
    };
  }

  if (!payload.entrepriseId && payload.type !== "adminsuper") {
    return {
      context: null,
      response: NextResponse.json(
        { message: "Aucune entreprise associée" },
        { status: 403 }
      ),
    };
  }

  const effectiveRoles = expandAllowedRoles(allowedRoles);
  const roleAllowedByToken =
    !effectiveRoles ||
    effectiveRoles.includes(payload.type) ||
    payload.type === "adminsuper";

  // Le JWT ne contient que le type : si le rôle ne suffit pas ou si des
  // actions sont exigées, on recharge l'utilisateur en base pour évaluer ses
  // permissions personnalisées (services/actions).
  let dbUser: { type?: string; permissions?: { services?: string[]; actions?: string[]; customized?: boolean } } | null = null;
  const needsUserDoc = !roleAllowedByToken || !!options?.actions?.length;
  if (needsUserDoc) {
    await db();
    dbUser = await User.findById(payload.userId).select("type permissions").lean();
    if (!dbUser) {
      return {
        context: null,
        response: NextResponse.json({ message: "Utilisateur introuvable" }, { status: 401 }),
      };
    }
  }

  const roleAllowed =
    roleAllowedByToken || (dbUser ? matchesAllowedRoles(dbUser, allowedRoles) : false);

  const hasRequiredActions =
    !!options?.actions?.length &&
    (dbUser ? options.actions.every((a) => hasActionPermission(dbUser, a)) : payload.type === "adminsuper");
  const actionsOk = !options?.actions?.length || hasRequiredActions;

  if (!actionsOk || (!roleAllowed && !hasRequiredActions)) {
    return {
      context: null,
      response: NextResponse.json({ message: "Accès interdit" }, { status: 403 }),
    };
  }

  try {
    let effectiveEntrepriseId = payload.entrepriseId;
    if (payload.type === "adminsuper") {
      const impersonatedEntrepriseId = await getImpersonateEntrepriseId(req);
      if (impersonatedEntrepriseId) {
        effectiveEntrepriseId = impersonatedEntrepriseId;
      }
    }

    const connection = effectiveEntrepriseId
      ? await getTenantConnection(effectiveEntrepriseId)
      : await getPrimaryConnection();
    const primaryConnection = await getPrimaryConnection();
    const userObjectId = new Types.ObjectId(payload.userId);
    return {
      context: {
        user: payload as AuthenticatedUser,
        userObjectId,
        connection,
        entrepriseId: effectiveEntrepriseId,
        isSharedConnection: connection === primaryConnection,
      },
      response: null,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur de connexion tenant";
    // If the error message is related to licence (blocked/suspended/expired/maintenance),
    // return 403 (forbidden) so client code can handle it specifically instead of a generic 500.
    const lower = String(message).toLowerCase();
    const licenceIndicators = ["licence", "maintenance", "suspend", "resili", "resilié", "résili", "mise en demeure", "expir"];
    const isLicenceIssue = licenceIndicators.some((kw) => lower.includes(kw));
    const status = isLicenceIssue ? 403 : 500;
    return {
      context: null,
      response: NextResponse.json({ message }, { status }),
    };
  }
}

export async function getTenantModelFromRequest<T extends object>(
  req: NextRequest,
  modelName: string,
  allowedRoles?: string[]
): Promise<{ model: Model<TenantDocument<T>> | null; response: NextResponse | null }> {
  const { context, response } = await withTenant(req, allowedRoles);
  if (!context) {
    return { model: null, response };
  }
  return { model: getTenantModel<T>(context.connection, modelName), response: null };
}
