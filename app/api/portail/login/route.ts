import { NextRequest, NextResponse } from "next/server";
import { verifyPassword } from "@/utils/auth";
import { signPatientToken, setPatientAuthCookie } from "@/lib/patientAuth";
import { getTenantConnection } from "@/lib/tenantDb";
import { getTenantModel } from "@/lib/tenantModels";
import { IPatient } from "@/models/patient";
import { db } from "@/db/mongoConnect";
import { Entreprise, IEntreprise } from "@/models/entreprise";
import { hasModuleAccess } from "@/lib/moduleAccess";
import "@/models";

const MAX_ATTEMPTS = 4;
const LOCK_DURATION_MINUTES = 30;
const GENERIC_ERROR = "Numéro de dossier ou mot de passe incorrect";

export async function POST(req: NextRequest) {
  try {
    const { entrepriseId, codeDossier, password } = await req.json();

    if (!entrepriseId || !codeDossier || !password) {
      return NextResponse.json(
        { message: "Établissement, numéro de dossier et mot de passe requis" },
        { status: 400 }
      );
    }

    // Vérifie que l'entreprise a souscrit le module portail patient.
    await db();
    const entreprise = await Entreprise.findById(String(entrepriseId)).lean<IEntreprise | null>();
    if (!entreprise || !hasModuleAccess(entreprise, "portail_patient")) {
      return NextResponse.json(
        { message: "Le portail patient n'est pas activé pour cet établissement" },
        { status: 403 }
      );
    }

    const connection = await getTenantConnection(String(entrepriseId));
    const Patient = getTenantModel<IPatient>(connection, "Patient");

    const patient = await Patient.findOne({
      Code_dossier: String(codeDossier).trim(),
    });

    if (!patient) {
      return NextResponse.json({ message: GENERIC_ERROR }, { status: 401 });
    }

    // Compte verrouillé ?
    if (patient.portailLockedUntil && patient.portailLockedUntil > new Date()) {
      const remaining = Math.ceil(
        (patient.portailLockedUntil.getTime() - Date.now()) / (1000 * 60)
      );
      return NextResponse.json(
        {
          message: `Compte temporairement bloqué. Réessayez dans ${remaining} minutes.`,
          isLocked: true,
        },
        { status: 423 }
      );
    }

    // Le patient n'a pas encore défini de mot de passe portail → parcours
    // "première connexion" côté client (vérification date de naissance + contact).
    if (!patient.MotDePassePortail) {
      return NextResponse.json(
        {
          needsSetup: true,
          message: "Première connexion : vous devez créer votre mot de passe.",
        },
        { status: 200 }
      );
    }

    const isValid = await verifyPassword(password, patient.MotDePassePortail);

    if (!isValid) {
      const attempts = (patient.portailFailedAttempts || 0) + 1;
      const update: any = { portailFailedAttempts: attempts };

      if (attempts >= MAX_ATTEMPTS) {
        update.portailLockedUntil = new Date(
          Date.now() + LOCK_DURATION_MINUTES * 60 * 1000
        );
        update.portailFailedAttempts = 0;
        await Patient.findByIdAndUpdate(patient._id, update);
        return NextResponse.json(
          {
            message:
              "Compte bloqué après 4 tentatives échouées. Réessayez dans 30 minutes.",
            isLocked: true,
          },
          { status: 423 }
        );
      }

      await Patient.findByIdAndUpdate(patient._id, update);
      const remainingAttempts = MAX_ATTEMPTS - attempts;
      return NextResponse.json(
        {
          message: `${GENERIC_ERROR}. ${remainingAttempts} tentative${
            remainingAttempts > 1 ? "s" : ""
          } restante${remainingAttempts > 1 ? "s" : ""}.`,
          remainingAttempts,
        },
        { status: 401 }
      );
    }

    await Patient.findByIdAndUpdate(patient._id, {
      portailFailedAttempts: 0,
      portailLockedUntil: null,
    });

    const token = signPatientToken({
      patientId: patient._id.toString(),
      codeDossier: patient.Code_dossier,
      entrepriseId: String(entrepriseId),
    });

    const response = NextResponse.json(
      {
        message: "Connexion réussie",
        patient: {
          _id: patient._id.toString(),
          nom: patient.Nom,
          prenoms: patient.Prenoms,
          codeDossier: patient.Code_dossier,
        },
      },
      { status: 200 }
    );
    await setPatientAuthCookie(response, token);
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    const lower = String(message).toLowerCase();
    const licenceIndicators = ["licence", "maintenance", "suspend", "resili", "résili", "expir"];
    const status = licenceIndicators.some((kw) => lower.includes(kw)) ? 403 : 500;
    console.error("Erreur login portail patient:", error);
    return NextResponse.json({ message }, { status });
  }
}
