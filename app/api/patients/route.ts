import { db } from "@/db/mongoConnect";
import { Patient } from "@/models/patient";
import { Console } from "console";
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
    console.log("le patient selectionné est :" + patients);
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



/* import { db } from "@/db/mongoConnect";
import { Patient } from "@/models/patient";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  await db();
  try {
    const { searchParams } = new URL(req.url);
    const Code_dossier = searchParams.get("Code_dossier");

    // Helper pour transformer un patient du modèle backend vers le format frontend
    const mapPatient = (p: any) => ({
      _id: p._id,
      nom: p.Nom,
      prenoms: p.Prenoms,
      age: p.Age_partient,
      sexe: p.sexe,
      contact: p.Contact,
      codeDossier: p.Code_dossier,
      matriculepatient: p.Matricule,
      dateNaissance: p.Date_naisse,
      tauxassurance: p.Taux,
      assurance: p.IDASSURANCE,
      societePatient: p.SOCIETE_PATIENT,
      souscripteur: p.Souscripteur,
      TarifPatient: p.TarifPatient,
    });

    if (Code_dossier) {
      // Permet de vérifier existence d’un code
      const patient = await Patient.findOne({ Code_dossier });
      return NextResponse.json(patient ? [mapPatient(patient)] : []);
    }

    const patients = await Patient.find({});
    return NextResponse.json(patients.map(mapPatient));
  } catch (error) {
    return NextResponse.json({ error: "Erreur lors de la récupération" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  await db();
  try {
    const body = await req.json();
    let { Code_dossier } = body;

    // Mapping des champs du frontend vers le modèle backend
    // (nom, prenoms, age, sexe, contact, TarifPatient, Code_dossier, matriculepatient, dateNaissance, tauxassurance, assurance, societePatient, souscripteur)
    const mapped: any = {
      Nom: body.nom || body.Nom,
      Prenoms: body.prenoms || body.Prenoms,
      sexe: body.sexe,
      Age_partient: body.age || body.Age_partient,
      Date_naisse: body.dateNaissance ? new Date(body.dateNaissance) : body.Date_naisse,
      Code_dossier: body.Code_dossier || body.codeDossier,
      Contact: body.contact || body.Contact,
      Matricule: body.matriculepatient || body.Matricule,
      Taux: body.tauxassurance || body.Taux,
      Souscripteur: body.souscripteur || body.Souscripteur,
      SOCIETE_PATIENT: body.societePatient || body.SOCIETE_PATIENT,
      TarifPatient: body.TarifPatient,
      // Ajoutez d'autres mappings si besoin
    };

    // Gestion de l'assurance (IDASSURANCE)
    if (body.assurance && typeof body.assurance === "string" && body.assurance !== "") {
      try {
        const mongoose = (await import("mongoose")).default;
        mapped.IDASSURANCE = new mongoose.Types.ObjectId(body.assurance);
      } catch { }
    }

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
    if (body.assurance && typeof body.assurance === "string" && body.assurance !== "") {
      try {
        const mongoose = (await import("mongoose")).default;
        body.assurance = new mongoose.Types.ObjectId(body.assurance);
      } catch { }
    } else {
      delete body.assurance;
    }

    if (body.TarifPatient === "Non Assuré") {
      mapped.IDASSURANCE = undefined;
      mapped.Taux = undefined;
      mapped.Matricule = "";
      mapped.SOCIETE_PATIENT = "";
      mapped.Souscripteur = "";
    }

    // Nettoyage des champs undefined ou vides
    Object.keys(mapped).forEach((k) => {
      if (
        mapped[k] === undefined ||
        mapped[k] === null ||
        (typeof mapped[k] === "string" && mapped[k].trim() === "")
      ) {
        delete mapped[k];
      }
    });

    const newPatient = await Patient.create(mapped);
    return NextResponse.json(newPatient, { status: 201 });
  } catch (error) {
    console.error("Erreur API /api/patients:", error);
    return NextResponse.json({ error: "Erreur lors de l'ajout" }, { status: 500 });
  }
}
 */