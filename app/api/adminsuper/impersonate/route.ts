import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";
import { Entreprise } from "@/models/entreprise";
import {
  requireAuth,
  getImpersonateEntrepriseId,
  setImpersonateCookie,
  clearImpersonateCookie,
} from "@/lib/auth";

export async function GET(req: NextRequest) {
  const { user, error } = await requireAuth(req, ["adminsuper"]);
  if (error) return error;
  if (user!.type !== "adminsuper") {
    return NextResponse.json({ message: "Accès interdit" }, { status: 403 });
  }

  const entrepriseId = await getImpersonateEntrepriseId(req);
  if (!entrepriseId) {
    return NextResponse.json({ active: false });
  }

  await db();
  const entreprise = await Entreprise.findById(entrepriseId).lean();
  if (!entreprise) {
    const response = NextResponse.json({ active: false });
    clearImpersonateCookie(response);
    return response;
  }

  return NextResponse.json({
    active: true,
    entrepriseId,
    nomSociete: entreprise.NomSociete,
  });
}

export async function POST(req: NextRequest) {
  const { user, error } = await requireAuth(req, ["adminsuper"]);
  if (error) return error;
  if (user!.type !== "adminsuper") {
    return NextResponse.json({ message: "Accès interdit" }, { status: 403 });
  }

  const { entrepriseId } = await req.json();
  if (!entrepriseId) {
    return NextResponse.json({ message: "entrepriseId requis" }, { status: 400 });
  }

  await db();
  const entreprise = await Entreprise.findById(entrepriseId).lean();
  if (!entreprise) {
    return NextResponse.json({ message: "Entreprise introuvable" }, { status: 404 });
  }

  const response = NextResponse.json({
    active: true,
    entrepriseId,
    nomSociete: entreprise.NomSociete,
  });
  setImpersonateCookie(response, entrepriseId);
  return response;
}

export async function DELETE(req: NextRequest) {
  const { user, error } = await requireAuth(req, ["adminsuper"]);
  if (error) return error;
  if (user!.type !== "adminsuper") {
    return NextResponse.json({ message: "Accès interdit" }, { status: 403 });
  }

  const response = NextResponse.json({ active: false });
  clearImpersonateCookie(response);
  return response;
}
