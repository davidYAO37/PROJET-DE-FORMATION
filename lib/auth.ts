import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { User } from "@/models/users.model";
import { db } from "@/db/mongoConnect";

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
  };
}

export async function requireAuth(req: NextRequest, allowedRoles?: string[]) {
  const user = await getCurrentUser(req);
  if (!user) {
    return { error: NextResponse.json({ message: "Non authentifié" }, { status: 401 }), user: null };
  }

  if (allowedRoles && !allowedRoles.includes(user.type) && user.type !== "adminsuper") {
    return { error: NextResponse.json({ message: "Accès interdit" }, { status: 403 }), user: null };
  }

  return { user, error: null };
}

export async function setAuthCookie(response: NextResponse, token: string) {
  response.cookies.set(TOKEN_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: TOKEN_MAX_AGE,
  });
}

export async function removeAuthCookie(response: NextResponse) {
  response.cookies.set(TOKEN_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
}

export function setImpersonateCookie(response: NextResponse, entrepriseId: string) {
  response.cookies.set(IMPERSONATE_COOKIE, entrepriseId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: IMPERSONATE_MAX_AGE,
  });
}

export function clearImpersonateCookie(response: NextResponse) {
  response.cookies.set(IMPERSONATE_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
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
