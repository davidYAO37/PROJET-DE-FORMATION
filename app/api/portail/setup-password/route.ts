import { NextRequest, NextResponse } from "next/server";
import { hashPassword } from "@/utils/auth";
import { signPatientToken, setPatientAuthCookie } from "@/lib/patientAuth";
import { getTenantConnection } from "@/lib/tenantDb";
import { getTenantModel } from "@/lib/tenantModels";
import { IPatient } from "@/models/patient";
import { db } from "@/db/mongoConnect";
import { Entreprise, IEntreprise } from "@/models/entreprise";
import { hasModuleAccess } from "@/lib/moduleAccess";
import "@/models";

// Première connexion : le patient crée son mot de passe portail après
// vérification de son identité (date de naissance + numéro de contact
// tels qu'enregistrés à l'accueil).
export async function POST(req: NextRequest) {
  try {
    const { entrepriseId, codeDossier, dateNaissance, contact, password } =
      await req.json();

    if (!entrepriseId || !codeDossier || !dateNaissance || !contact || !password) {
      return NextResponse.json(
        { message: "Tous les champs sont requis" },
        { status: 400 }
      );
    }

    if (String(password).length < 6) {
      return NextResponse.json(
        { message: "Le mot de passe doit contenir au moins 6 caractères" },
        { status: 400 }
      );
    }

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
      return NextResponse.json(
        { message: "Informations de vérification incorrectes" },
        { status: 401 }
      );
    }

    if (patient.MotDePassePortail) {
      return NextResponse.json(
        { message: "Un mot de passe existe déjà pour ce dossier. Connectez-vous." },
        { status: 409 }
      );
    }

    const birth = patient.Date_naisse ? new Date(patient.Date_naisse) : null;
    const inputBirth = new Date(dateNaissance);
    const sameDay =
      birth &&
      !isNaN(inputBirth.getTime()) &&
      birth.getFullYear() === inputBirth.getFullYear() &&
      birth.getMonth() === inputBirth.getMonth() &&
      birth.getDate() === inputBirth.getDate();

    const normalizePhone = (v: string) => String(v || "").replace(/[\s\-().+]/g, "");
    const phoneOk =
      !!patient.Contact &&
      normalizePhone(patient.Contact).endsWith(normalizePhone(contact).slice(-8));

    if (!sameDay || !phoneOk) {
      return NextResponse.json(
        { message: "Informations de vérification incorrectes" },
        { status: 401 }
      );
    }

    const hashed = await hashPassword(String(password));
    await Patient.findByIdAndUpdate(patient._id, {
      MotDePassePortail: hashed,
      portailFailedAttempts: 0,
      portailLockedUntil: null,
    });

    const token = signPatientToken({
      patientId: patient._id.toString(),
      codeDossier: patient.Code_dossier,
      entrepriseId: String(entrepriseId),
    });

    const response = NextResponse.json(
      { message: "Mot de passe créé avec succès" },
      { status: 200 }
    );
    await setPatientAuthCookie(response, token);
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    const lower = String(message).toLowerCase();
    const licenceIndicators = ["licence", "maintenance", "suspend", "resili", "résili", "expir"];
    const status = licenceIndicators.some((kw) => lower.includes(kw)) ? 403 : 500;
    console.error("Erreur setup mot de passe portail:", error);
    return NextResponse.json({ message }, { status });
  }
}
