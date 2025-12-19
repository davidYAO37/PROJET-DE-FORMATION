import { db } from "@/db/mongoConnect";
import { Patient } from "@/models/patient";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  await db();
  try {
    const { searchParams } = new URL(req.url);
    const Code_dossier = searchParams.get("Code_dossier");

    if (Code_dossier) {
      // Permet de vérifier existence d’un code
      const patient = await Patient.findOne({ Code_dossier });
      return NextResponse.json(patient ? [patient] : []);
    }

    const patients = await Patient.find({});
    //console.log("le patient selectionné est :" + patients);
    ({ patients });
    return NextResponse.json(patients);

  } catch (error) {
    return NextResponse.json({ error: "Erreur lors de la récupération" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  await db();
  try {
    const body = await req.json();
    let { Code_dossier } = body;

    // Vérification unicité côté serveur
    const existing = await Patient.findOne({ Code_dossier });

    if (existing) {
      // 👉 Cas 1 : l’utilisateur a tapé manuellement un code
      if (!/^P00\d+$/.test(Code_dossier)) {
        return NextResponse.json(
          { error: "Ce code dossier existe déjà. Veuillez en choisir un autre." },
          { status: 409 }
        );
      }

      // 👉 Cas 2 : code auto (P00xxx) → on génère le suivant disponible
      let nextNum = 1;
      const last = await Patient.findOne({ Code_dossier: /^P00\d+$/ })
        .sort({ Code_dossier: -1 })
        .collation({ locale: "en_US", numericOrdering: true }); // bien trier P009 < P010

      if (last) {
        const match = last.Code_dossier.match(/^P00(\d+)$/);
        if (match) {
          nextNum = parseInt(match[1], 10) + 1;
        }
      }

      // Boucle tant qu’il y a collision (sécurité pour concurrence)
      let newCode = `P00${nextNum}`;
      while (await Patient.findOne({ Code_dossier: newCode })) {
        nextNum++;
        newCode = `P00${nextNum}`;
      }
      Code_dossier = newCode;
    }

    body.Code_dossier = Code_dossier;

    // Nettoyage des champs optionnels
    if (body.IDASSURANCE && typeof body.IDASSURANCE === "string" && body.IDASSURANCE !== "") {
      try {
        const mongoose = (await import("mongoose")).default;
        body.IDASSURANCE = new mongoose.Types.ObjectId(body.IDASSURANCE);
      } catch { }
    } else {
      delete body.IDASSURANCE;
    }

    if (body.TarifPatient === "Non Assuré") {
      body.IDASSURANCE = undefined;
      body.Taux = undefined;
      body.Matricule = "";
      body.SOCIETE_PATIENT = "";
      body.Souscripteur = "";
    }

    // Nettoyage des champs undefined ou vides
    Object.keys(body).forEach((k) => {
      if (
        body[k] === undefined ||
        body[k] === null ||
        (typeof body[k] === "string" && body[k].trim() === "")
      ) {
        delete body[k];
      }
    });

    const newPatient = await Patient.create(body);
    return NextResponse.json(newPatient, { status: 201 });
  } catch (error) {
    console.error("Erreur API /api/patients:", error);
    return NextResponse.json({ error: "Erreur lors de l'ajout" }, { status: 500 });
  }
}



