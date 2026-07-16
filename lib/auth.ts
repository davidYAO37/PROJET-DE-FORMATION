import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";
import { UserCollection } from "@/models/users.model";

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || "change-me-in-production";
const TOKEN_NAME = "easy_medical_token";
const TOKEN_MAX_AGE = 60 * 60 * 24 * 7; // 7 jours

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
  } catch (error) {
    return null;
  }
}

export async function getTokenFromCookies(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(TOKEN_NAME)?.value;
}

export async function getCurrentUser(req?: NextRequest) {
  const token = req?.cookies?.get(TOKEN_NAME)?.value || (await getTokenFromCookies());
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) return null;

  await db();
  const user = await UserCollection.findById(payload.userId).lean();
  if (!user) return null;

  const typedUser = user as any;

  return {
    _id: typedUser._id.toString(),
    nom: typedUser.nom,
    prenom: typedUser.prenom,
    email: typedUser.email,
    type: typedUser.type,
    entrepriseId: typedUser.entrepriseId ? typedUser.entrepriseId.toString() : undefined,
  };
}

export async function requireAuth(req: NextRequest, allowedRoles?: string[]) {
  const user = await getCurrentUser(req);
  if (!user) {
    return { error: NextResponse.json({ message: "Non authentifié" }, { status: 401 }), user: null };
  }

  if (allowedRoles && !allowedRoles.includes(user.type)) {
    return { error: NextResponse.json({ message: "Accès interdit" }, { status: 403 }), user: null };
  }

  return { user, error: null };
}

export async function setAuthCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(TOKEN_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: TOKEN_MAX_AGE,
  });
}

export async function removeAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.set(TOKEN_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
}
