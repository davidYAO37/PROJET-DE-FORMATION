import { NextResponse, NextRequest } from "next/server";
import { verifyPassword } from "@/utils/auth";
import { signToken, setAuthCookie } from "@/lib/auth";
import { db } from "@/db/mongoConnect";
import { User } from "@/models/users.model";
import { Entreprise } from "@/models/entreprise";
import { getLicenceStatus } from "@/lib/licence";
import { JournalConnexion } from "@/models/journalConnexion";

const MAX_ATTEMPTS = 4;
const LOCK_DURATION_MINUTES = 30;

export async function POST(req: NextRequest) {
  try {
    await db();
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email et mot de passe requis" },
        { status: 400 }
      );
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).lean();

    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";

    const logConnexion = async (
      statut: "success" | "failure" | "locked",
      message?: string
    ) => {
      await JournalConnexion.create({
        userId: user ? user._id : undefined,
        entrepriseId: user ? user.entrepriseId : undefined,
        email: email.toLowerCase().trim(),
        ip: clientIp,
        userAgent,
        statut,
        message,
      });
    };

    if (!user) {
      await logConnexion("failure", "Utilisateur introuvable");
      return NextResponse.json(
        { message: "Email ou mot de passe incorrect" },
        { status: 401 }
      );
    }

    if (user.isLocked) {
      if (user.lockedUntil && user.lockedUntil > new Date()) {
        const remainingTime = Math.ceil(
          (user.lockedUntil.getTime() - Date.now()) / (1000 * 60)
        );
        await logConnexion(
          "locked",
          `Compte verrouillé - ${remainingTime} minutes restantes`
        );
        return NextResponse.json(
          {
            message: `Compte temporairement bloqué. Réessayez dans ${remainingTime} minutes.`,
            isLocked: true,
            lockedUntil: user.lockedUntil,
          },
          { status: 423 }
        );
      }

      if (!user.lockedUntil) {
        await logConnexion("locked", "Compte bloqué par un administrateur");
        return NextResponse.json(
          {
            message:
              "Compte bloqué par l'administrateur. Contactez l'administrateur pour le déverrouillage.",
            isLocked: true,
          },
          { status: 423 }
        );
      }

      await User.findByIdAndUpdate(user._id, {
        isLocked: false,
        lockedUntil: null,
        failedAttempts: 0,
        remainingAttempts: MAX_ATTEMPTS,
      });
    }

    if (!user.password) {
      await logConnexion("failure", "Compte sans mot de passe");
      return NextResponse.json(
        { message: "Compte non configuré pour la connexion locale" },
        { status: 401 }
      );
    }

    const isPasswordValid = await verifyPassword(password, user.password);

    if (!isPasswordValid) {
      const newFailedAttempts = (user.failedAttempts || 0) + 1;
      const remainingAttempts = MAX_ATTEMPTS - newFailedAttempts;

      await User.findByIdAndUpdate(user._id, {
        failedAttempts: newFailedAttempts,
        remainingAttempts: Math.max(0, remainingAttempts),
      });

      if (newFailedAttempts >= MAX_ATTEMPTS) {
        const lockedUntil = new Date(
          Date.now() + LOCK_DURATION_MINUTES * 60 * 1000
        );
        await User.findByIdAndUpdate(user._id, {
          isLocked: true,
          lockedUntil,
          failedAttempts: newFailedAttempts,
          remainingAttempts: 0,
        });
        await logConnexion(
          "locked",
          "Compte bloqué après 4 tentatives échouées"
        );
        return NextResponse.json(
          {
            message:
              "Compte bloqué après 4 tentatives échouées. Contactez un administrateur.",
            isLocked: true,
            remainingAttempts: 0,
            maxAttempts: MAX_ATTEMPTS,
          },
          { status: 423 }
        );
      }

      await logConnexion(
        "failure",
        `Mot de passe incorrect - ${remainingAttempts} tentatives restantes`
      );
      return NextResponse.json(
        {
          message: `Email ou mot de passe incorrect. ${remainingAttempts} tentative${
            remainingAttempts > 1 ? "s" : ""
          } restante${remainingAttempts > 1 ? "s" : ""}.`,
          remainingAttempts,
          maxAttempts: MAX_ATTEMPTS,
        },
        { status: 401 }
      );
    }

    await User.findByIdAndUpdate(user._id, {
      failedAttempts: 0,
      remainingAttempts: MAX_ATTEMPTS,
      isLocked: false,
      lockedUntil: null,
    });

    if (user.type !== "adminsuper") {
      const entreprise = await Entreprise.findById(user.entrepriseId).lean();

      if (!entreprise) {
        await logConnexion("failure", "Entreprise introuvable");
        return NextResponse.json(
          { message: "Entreprise associée introuvable" },
          { status: 403 }
        );
      }

      const licenceStatus = getLicenceStatus(entreprise);
      if (licenceStatus.isBlocked) {
        const message =
          licenceStatus.alerts[0]?.message || "Entreprise inactive ou licence invalide";
        await logConnexion("failure", message);
        return NextResponse.json({ message }, { status: 403 });
      }

      if (!user.entrepriseId) {
        await logConnexion("failure", "Utilisateur sans entreprise associée");
        return NextResponse.json(
          { message: "Aucune entreprise associée à cet utilisateur" },
          { status: 403 }
        );
      }
    }

    const token = signToken({
      userId: user._id.toString(),
      email: user.email,
      type: user.type || "user",
      entrepriseId: user.entrepriseId ? user.entrepriseId.toString() : "",
    });

    await logConnexion("success");

    const userResponse = {
      _id: user._id.toString(),
      nom: user.nom || "",
      prenom: user.prenom || "",
      email: user.email,
      type: user.type || "user",
      entrepriseId: user.entrepriseId ? user.entrepriseId.toString() : "",
      uid: user.uid || "",
      isLocked: false,
      failedAttempts: 0,
      remainingAttempts: MAX_ATTEMPTS,
    };

    const response = NextResponse.json(
      { message: "Connexion réussie", user: userResponse },
      { status: 200 }
    );
    await setAuthCookie(response, token);
    return response;
  } catch (error) {
    console.error("Erreur lors de la connexion :", error);
    return NextResponse.json(
      { message: "Erreur serveur" },
      { status: 500 }
    );
  }
}
