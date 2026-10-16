import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { User } from "@/models/users.model";
import { Entreprise } from "@/models/entreprise";
import { getLicenceStatus } from "@/lib/licence";
import { db } from "@/db/mongoConnect";
import { expandAllowedRoles } from "@/lib/roleUtils";
import {
  getUserPermissions,
  hasActionPermission,
  matchesAllowedRoles,
  type ResolvedPermissions,
} from "@/lib/permissions";

// Chemins toujours accessibles même si la licence de l'entreprise est bloquée :
// l'utilisateur doit pouvoir consulter son statut et régulariser sa situation
// (achat de licence, paiement de maintenance, déconnexion...).
const LICENCE_EXEMPT_PATH_PREFIXES = [
  "/api/licence",
  "/api/login",
  "/api/logout",
  "/api/me",
];

function isLicenceExemptPath(pathname: string): boolean {
  return LICENCE_EXEMPT_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error("❌ JWT_SECRET (ou NEXTAUTH_SECRET) doit être défini dans les variables d'environnement");
  }
  return secret;
}

const JWT_SECRET = getJwtSecret();
const TOKEN_NAME = "easy_medical_token";
const TOKEN_MAX_AGE = 60 * 60 * 24 * 7;
const IMPERSONATE_COOKIE = "easy_medical_impersonate";
const IMPERSONATE_MAX_AGE = 60 * 60 * 4; // 4h, session de support limitée

// En production derrière HTTP simple (ex. install locale sur le LAN via
// http://192.168.x.x:3000), un cookie Secure est refusé par le navigateur et
// la session ne persiste jamais. COOKIE_SECURE=false permet de le désactiver
// explicitement ; par défaut on garde secure=true en production.
function isSecureCookie(): boolean {
  const override = process.env.COOKIE_SECURE;
  if (override !== undefined && override !== "") {
    return override === "true";
  }
  return process.env.NODE_ENV === "production";
}

export interface JWTPayload {
  userId: string;
  email: string;
  type: string;
  entrepriseId?: string;
}

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

export async function getTokenFromCookies(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(TOKEN_NAME)?.value;
}

export interface CurrentUser {
  _id: string;
  nom: string;
  prenom: string;
  email: string;
  type: string;
  entrepriseId?: string;
  uid: string;
  permissions: ResolvedPermissions;
}

export async function getCurrentUser(req?: NextRequest): Promise<CurrentUser | null> {
  const token = req?.cookies?.get(TOKEN_NAME)?.value || (await getTokenFromCookies());
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) return null;

  await db();
  const user = await User.findById(payload.userId).lean();

  if (!user) return null;

  return {
    _id: user._id.toString(),
    nom: user.nom || user.name || "",
    prenom: user.prenom || "",
    email: user.email,
    type: user.type || "user",
    entrepriseId: user.entrepriseId ? user.entrepriseId.toString() : payload.entrepriseId,
    uid: user.uid || "",
    permissions: getUserPermissions(user),
  };
}

export interface RequireAuthOptions {
  /**
   * Actions requises : l'utilisateur doit posséder TOUTES ces actions.
   * Peut servir d'alternative au rôle : un utilisateur dont le type n'est
   * pas dans allowedRoles mais qui possède les actions requises passe.
   */
  actions?: string[];
}

export async function requireAuth(
  req: NextRequest,
  allowedRoles?: string[],
  options?: RequireAuthOptions
) {
  const user = await getCurrentUser(req);
  if (!user) {
    return { error: NextResponse.json({ message: "Non authentifié" }, { status: 401 }), user: null };
  }

  const effectiveRoles = expandAllowedRoles(allowedRoles);
  const roleAllowed =
    !effectiveRoles ||
    effectiveRoles.includes(user.type) ||
    user.type === "adminsuper" ||
    // Repli : services personnalisés couvrant les services des rôles demandés
    matchesAllowedRoles(user, allowedRoles);

  const hasRequiredActions =
    !!options?.actions?.length &&
    options.actions.every((action) => hasActionPermission(user, action));
  const actionsOk = !options?.actions?.length || hasRequiredActions;

  // Accès si : rôle OK + actions requises OK, ou bien rôle KO mais toutes les
  // actions requises sont accordées (accès alternatif par permission).
  if (!actionsOk || (!roleAllowed && !hasRequiredActions)) {
    return { error: NextResponse.json({ message: "Accès interdit" }, { status: 403 }), user: null };
  }

  // Blocage de licence : appliqué de façon centrale ici pour que TOUTES les
  // routes passant par requireAuth() (pas seulement celles utilisant
  // withTenant()/getTenantConnection()) réagissent de la même façon et avec
  // le même message clair, dès qu'une entreprise est en essai expiré,
  // suspendue, résiliée ou en maintenance impayée.
  if (user.type !== "adminsuper" && user.entrepriseId && !isLicenceExemptPath(req.nextUrl.pathname)) {
    const entreprise = await Entreprise.findById(user.entrepriseId).lean();
    if (!entreprise) {
      return {
        error: NextResponse.json({ message: "Entreprise associée introuvable" }, { status: 403 }),
        user: null,
      };
    }
    const licenceStatus = getLicenceStatus(entreprise);
    if (licenceStatus.isBlocked) {
      const message = licenceStatus.alerts[0]?.message || "Licence invalide ou expirée";
      return { error: NextResponse.json({ message }, { status: 403 }), user: null };
    }
  }

  return { user, error: null };
}

export async function setAuthCookie(response: NextResponse, token: string) {
  response.cookies.set(TOKEN_NAME, token, {
    httpOnly: true,
    secure: isSecureCookie(),
    sameSite: "strict",
    path: "/",
    maxAge: TOKEN_MAX_AGE,
  });
}

export async function removeAuthCookie(response: NextResponse) {
  response.cookies.set(TOKEN_NAME, "", {
    httpOnly: true,
    secure: isSecureCookie(),
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
}

export function setImpersonateCookie(response: NextResponse, entrepriseId: string) {
  response.cookies.set(IMPERSONATE_COOKIE, entrepriseId, {
    httpOnly: true,
    secure: isSecureCookie(),
    sameSite: "strict",
    path: "/",
    maxAge: IMPERSONATE_MAX_AGE,
  });
}

export function clearImpersonateCookie(response: NextResponse) {
  response.cookies.set(IMPERSONATE_COOKIE, "", {
    httpOnly: true,
    secure: isSecureCookie(),
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
}

export async function getImpersonateEntrepriseId(req?: NextRequest): Promise<string | undefined> {
  if (req) {
    return req.cookies.get(IMPERSONATE_COOKIE)?.value || undefined;
  }
  const cookieStore = await cookies();
  return cookieStore.get(IMPERSONATE_COOKIE)?.value || undefined;
}
