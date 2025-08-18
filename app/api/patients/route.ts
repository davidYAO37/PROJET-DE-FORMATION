import { db } from "@/db/mongoConnect";
import { Patient } from "@/models/patient";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  await db();
  try {
    const { searchParams } = new URL(req.url);
    const codeDossier = searchParams.get("codeDossier");

    if (codeDossier) {
      // Permet de vérifier existence d’un code
      const patient = await Patient.findOne({ codeDossier });
      return NextResponse.json(patient ? [patient] : []);
    }

    const patients = await Patient.find({});
    return NextResponse.json(patients);
  } catch (error) {
    return NextResponse.json({ error: "Erreur lors de la récupération" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  await db();
  try {
    const body = await req.json();
    let { codeDossier } = body;

    // Vérification unicité côté serveur
    const existing = await Patient.findOne({ codeDossier });

    if (existing) {
      // 👉 Cas 1 : l’utilisateur a tapé manuellement un code
      if (!/^P00\d+$/.test(codeDossier)) {
        return NextResponse.json(
          { error: "Ce code dossier existe déjà. Veuillez en choisir un autre." },
          { status: 409 }
        );
      }

      // 👉 Cas 2 : code auto (P00xxx) → on génère le suivant disponible
      let nextNum = 1;
      const last = await Patient.findOne({ codeDossier: /^P00\d+$/ })
        .sort({ codeDossier: -1 })
        .collation({ locale: "en_US", numericOrdering: true }); // bien trier P009 < P010

      if (last) {
        const match = last.codeDossier.match(/^P00(\d+)$/);
        if (match) {
          nextNum = parseInt(match[1], 10) + 1;
        }
      }

      // Boucle tant qu’il y a collision (sécurité pour concurrence)
      let newCode = `P00${nextNum}`;
      while (await Patient.findOne({ codeDossier: newCode })) {
        nextNum++;
        newCode = `P00${nextNum}`;
      }
      codeDossier = newCode;
    }

    body.codeDossier = codeDossier;

    // Nettoyage des champs optionnels
    if (body.assurance && typeof body.assurance === "string" && body.assurance !== "") {
      try {
        const mongoose = (await import("mongoose")).default;
        body.assurance = new mongoose.Types.ObjectId(body.assurance);
      } catch { }
    } else {
      delete body.assurance;
    }

    if (body.typevisiteur === "Non Assuré") {
      delete body.assurance;
      body.tauxassurance = undefined;
      body.matriculepatient = "";
    }

    const newPatient = await Patient.create(body);
    return NextResponse.json(newPatient, { status: 201 });
  } catch (error) {
    console.error("Erreur API /api/patients:", error);
    return NextResponse.json({ error: "Erreur lors de l'ajout" }, { status: 500 });
  }
}
