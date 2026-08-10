import { NextRequest, NextResponse } from "next/server";
import { IDocumentPatient } from "@/models/documentpatient";
import { IExamenHospitalisation } from "@/models/examenHospit";
import { Types } from "mongoose";
import { withTenant } from "@/lib/withTenant";
import { getTenantModel } from "@/lib/tenantModels";

const READ_ROLES = ["admin", "medecin", "accueil", "caisse", "comptable", "biologiste", "infirmier"];
const WRITE_ROLES = ["admin", "medecin", "biologiste", "infirmier"];

export async function GET(req: NextRequest, routeContext: { params: Promise<{ id: string }> }) {
  try {
    const { context, response } = await withTenant(req, READ_ROLES);
    if (!context) return response;
    const DocumentPatient = getTenantModel<IDocumentPatient>(context.connection, "DocumentPatient");
    const { id } = await routeContext.params;

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 });
    }

    const doc = await DocumentPatient.findById(id).lean();
    if (!doc) {
      return NextResponse.json({ error: "Document non trouvé" }, { status: 404 });
    }

    const formatted = {
      ...doc,
      _id: doc._id.toString(),
      document: doc.document ? doc.document.toString("base64") : undefined,
    };

    return NextResponse.json({ success: true, data: formatted });
  } catch (error: any) {
    console.error("Erreur GET /api/documents/patient/[id]:", error);
    return NextResponse.json({ error: "Erreur serveur", message: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, routeContext: { params: Promise<{ id: string }> }) {
  try {
    const { context, response } = await withTenant(req, WRITE_ROLES);
    if (!context) return response;
    const DocumentPatient = getTenantModel<IDocumentPatient>(context.connection, "DocumentPatient");
    const ExamenHospitalisation = getTenantModel<IExamenHospitalisation>(context.connection, "ExamenHospitalisation");
    const { id } = await routeContext.params;

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 });
    }

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

    const updateData: any = {
      libeleDocument,
      date: date ? new Date(date) : undefined,
      heure,
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
    };

    if (document) {
      updateData.document = Buffer.from(document, "base64");
    }

    const updatedDoc = await DocumentPatient.findByIdAndUpdate(id, updateData, { new: true }).lean();
    if (!updatedDoc) {
      return NextResponse.json({ error: "Document non trouvé" }, { status: 404 });
    }

    if (updateData.document && idprestation && idprestation !== "0" && idprestation !== "") {
      await ExamenHospitalisation.findByIdAndUpdate(idprestation, {
        Document: updateData.document,
        ExtensionF: extensionF,
      });
    }

    return NextResponse.json({ success: true, data: { ...updatedDoc, _id: updatedDoc._id.toString() } });
  } catch (error: any) {
    console.error("Erreur PUT /api/documents/patient/[id]:", error);
    return NextResponse.json({ error: "Erreur serveur", message: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, routeContext: { params: Promise<{ id: string }> }) {
  try {
    const { context, response } = await withTenant(req, WRITE_ROLES);
    if (!context) return response;
    const DocumentPatient = getTenantModel<IDocumentPatient>(context.connection, "DocumentPatient");
    const { id } = await routeContext.params;

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 });
    }

    const deletedDoc = await DocumentPatient.findByIdAndDelete(id).lean();
    if (!deletedDoc) {
      return NextResponse.json({ error: "Document non trouvé" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Document supprimé" });
  } catch (error: any) {
    console.error("Erreur DELETE /api/documents/patient/[id]:", error);
    return NextResponse.json({ error: "Erreur serveur", message: error.message }, { status: 500 });
  }
}
