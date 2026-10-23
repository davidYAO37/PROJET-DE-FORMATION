import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import mongoose, { Connection } from "mongoose";
import { getTenantConnection } from "@/lib/tenantDb";
import { getTenantModel } from "@/lib/tenantModels";
import { IPatient } from "@/models/patient";
import "@/models";

const PATIENT_TOKEN_NAME = "easy_medical_patient_token";
const PATIENT_TOKEN_MAX_AGE = 60 * 60 * 12; // 12h — session patient plus courte

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error("❌ JWT_SECRET (ou NEXTAUTH_SECRET) doit être défini dans les variables d'environnement");
  }
  return secret;
}

function isSecureCookie(): boolean {
  const override = process.env.COOKIE_SECURE;
  if (override !== undefined && override !== "") {
    return override === "true";
  }
  return process.env.NODE_ENV === "production";
}

export interface PatientJWTPayload {
  patientId: string;
  codeDossier: string;
  entrepriseId: string;
  kind: "patient";
}

export function signPatientToken(payload: Omit<PatientJWTPayload, "kind">): string {
  return jwt.sign({ ...payload, kind: "patient" }, getJwtSecret(), { expiresIn: "12h" });
}

export function verifyPatientToken(token: string): PatientJWTPayload | null {
  try {
    const payload = jwt.verify(token, getJwtSecret()) as PatientJWTPayload;
    if (payload.kind !== "patient" || !payload.patientId || !payload.entrepriseId) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function setPatientAuthCookie(response: NextResponse, token: string) {
  response.cookies.set(PATIENT_TOKEN_NAME, token, {
    httpOnly: true,
    secure: isSecureCookie(),
    sameSite: "strict",
    path: "/",
    maxAge: PATIENT_TOKEN_MAX_AGE,
  });
}

export async function removePatientAuthCookie(response: NextResponse) {
  response.cookies.set(PATIENT_TOKEN_NAME, "", {
    httpOnly: true,
    secure: isSecureCookie(),
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
}

export interface PatientContext {
  patient: any;
  patientId: mongoose.Types.ObjectId;
  codeDossier: string;
  entrepriseId: string;
  connection: Connection;
}

type RequirePatientResult =
  | { context: PatientContext; response: null }
  | { context: null; response: NextResponse };

export async function requirePatientAuth(req: NextRequest): Promise<RequirePatientResult> {
  const token =
    req.cookies.get(PATIENT_TOKEN_NAME)?.value ||
    (await cookies()).get(PATIENT_TOKEN_NAME)?.value;

  if (!token) {
    return {
      context: null,
      response: NextResponse.json({ message: "Non authentifié" }, { status: 401 }),
    };
  }

  const payload = verifyPatientToken(token);
  if (!payload) {
    return {
      context: null,
      response: NextResponse.json({ message: "Session invalide ou expirée" }, { status: 401 }),
    };
  }

  try {
    // getTenantConnection applique automatiquement le blocage de licence.
    const connection = await getTenantConnection(payload.entrepriseId);
    const Patient = getTenantModel<IPatient>(connection, "Patient");
    const patient = await Patient.findById(payload.patientId).lean();

    if (!patient) {
      return {
        context: null,
        response: NextResponse.json({ message: "Patient introuvable" }, { status: 401 }),
      };
    }

    return {
      context: {
        patient,
        patientId: new mongoose.Types.ObjectId(payload.patientId),
        codeDossier: payload.codeDossier,
        entrepriseId: payload.entrepriseId,
        connection,
      },
      response: null,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur de connexion";
    const lower = String(message).toLowerCase();
    const licenceIndicators = ["licence", "maintenance", "suspend", "resili", "résili", "expir"];
    const isLicenceIssue = licenceIndicators.some((kw) => lower.includes(kw));
    return {
      context: null,
      response: NextResponse.json({ message }, { status: isLicenceIssue ? 403 : 500 }),
    };
  }
}
