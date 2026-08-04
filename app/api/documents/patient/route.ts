import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";
import { DocumentPatient } from "@/models/documentpatient";
import { ExamenHospitalisation } from "@/models/examenHospit";
import { Types } from "mongoose";

// GET /api/documents/patient?patientId=xxx
export async function GET(req: NextRequest) {
  try {
    await db();
    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get("patientId");

    if (!patientId) {
      return NextResponse.json({ error: "L'ID du patient est requis" }, { status: 400 });
    }

    const query: any = {};
    if (Types.ObjectId.isValid(patientId)) {
      query.$or = [{ patient: new Types.ObjectId(patientId) }, { idPatient: patientId }];
    } else {
      query.idPatient = patientId;
    }

    const documents = await DocumentPatient.find(query)
      .sort({ date: -1 })
      .lean();

    const formatted = documents.map((doc: any) => ({
      ...doc,
      _id: doc._id.toString(),
      document: doc.document ? doc.document.toString("base64") : undefined,
    }));

    return NextResponse.json({ success: true, data: formatted });
  } catch (error: any) {
    console.error("Erreur GET /api/documents/patient:", error);
    return NextResponse.json({ error: "Erreur serveur", message: error.message }, { status: 500 });
  }
}

// POST /api/documents/patient
export async function POST(req: NextRequest) {
  try {
    await db();
    const body = await req.json();

    const {
      libeleDocument,
      document,
      date,
      heure,
      patientId,
      patientP,
      typeDoc,
      ajouterPar,
      codeDossier,
      nPrestation,
      idMedecin,
      medecinNom,
      idprestation,
      extensionF,
      interpretation,
      entrepriseId,
    } = body;

    if (!libeleDocument || libeleDocument.trim() === "") {
      return NextResponse.json(
        { error: "Merci de saisir le Libellé du document SVP" },
        { status: 400 }
      );
    }

    const documentBuffer = document ? Buffer.from(document, "base64") : undefined;

    const newDoc = await DocumentPatient.create({
      libeleDocument,
      document: documentBuffer,
      date: date ? new Date(date) : new Date(),
      heure: heure || new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      patient: Types.ObjectId.isValid(patientId) ? new Types.ObjectId(patientId) : undefined,
      idPatient: patientId,
      patientP,
      typeDoc,
      ajouterPar,
      codeDossier,
      nPrestation,
      idMedecin,
      medecinNom,
      idprestation,
      extensionF,
      interpretation,
      entrepriseId,
    });

    // Mise à jour de l'examen hospitalisation lié (si un idprestation est fourni)
    if (documentBuffer && idprestation && idprestation !== "0" && idprestation !== "") {
      await ExamenHospitalisation.findByIdAndUpdate(idprestation, {
        Document: documentBuffer,
        ExtensionF: extensionF,
      });
    }

    return NextResponse.json({ success: true, data: { ...newDoc.toObject(), _id: newDoc._id.toString() } }, { status: 201 });
  } catch (error: any) {
    console.error("Erreur POST /api/documents/patient:", error);
    return NextResponse.json({ error: "Erreur serveur", message: error.message }, { status: 500 });
  }
}
