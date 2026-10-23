import { NextRequest, NextResponse } from "next/server";
import { removePatientAuthCookie } from "@/lib/patientAuth";

export async function POST(_req: NextRequest) {
  const response = NextResponse.json({ message: "Déconnexion réussie" }, { status: 200 });
  await removePatientAuthCookie(response);
  return response;
}
