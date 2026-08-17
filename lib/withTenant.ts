import { NextRequest, NextResponse } from "next/server";
import mongoose, { Model, Types } from "mongoose";
import { verifyToken, getTokenFromCookies, getImpersonateEntrepriseId, type JWTPayload } from "./auth";
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
}

type WithTenantResult =
  | { context: TenantContext; response: null }
  | { context: null; response: NextResponse };

export async function withTenant(
  req: NextRequest,
  allowedRoles?: string[]
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

  if (allowedRoles && !allowedRoles.includes(payload.type) && payload.type !== "adminsuper") {
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
    const userObjectId = new Types.ObjectId(payload.userId);
    return {
      context: { user: payload as AuthenticatedUser, userObjectId, connection },
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
