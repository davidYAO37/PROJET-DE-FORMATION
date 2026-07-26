import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/lib/withTenant";
import { getTenantModel } from "@/lib/tenantModels";
import { IDocumentHospitalisation } from "@/models/hospitalisation/DocumentHospitalisation";

const ROLES = ["admin", "medecin", "infirmier"];

export async function GET(req: NextRequest) {
  const { context, response } = await withTenant(req, ROLES);
  if (!context) return response;
  const { connection } = context;

  try {
    const { searchParams } = new URL(req.url);
    const hospitalisationId = searchParams.get("hospitalisationId");
    const type = searchParams.get("type");

    const query: Record<string, string> = {};
    if (hospitalisationId) query.hospitalisationId = hospitalisationId;
    if (type) query.type = type;

    const Document = getTenantModel<IDocumentHospitalisation>(connection, "DocumentHospitalisation");
    const documents = await Document.find(query)
      .populate("uploadedBy", "nom prenoms")
      .sort({ date: -1 })
      .lean();

    return NextResponse.json({ success: true, data: documents });
  } catch (error) {
    console.error("Erreur GET documents:", error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur", details: error instanceof Error ? error.message : "" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const { context, response } = await withTenant(req, ROLES);
  if (!context) return response;
  const { connection, userObjectId } = context;

  try {
    const body = await req.json();
    if (!body.hospitalisationId || !body.patientId || !body.titre || !body.type) {
      return NextResponse.json(
        { success: false, error: "hospitalisationId, patientId, titre et type sont requis" },
        { status: 400 }
      );
    }

    const createData: Partial<IDocumentHospitalisation> = {
      ...body,
      uploadedBy: userObjectId,
      date: body.date ? new Date(body.date) : new Date(),
    };

    if (body.fichierBase64) {
      createData.fichier = Buffer.from(body.fichierBase64, "base64");
    }

    const Document = getTenantModel<IDocumentHospitalisation>(connection, "DocumentHospitalisation");
    const document = await Document.create(createData);

    return NextResponse.json({ success: true, data: document }, { status: 201 });
  } catch (error) {
    console.error("Erreur POST document:", error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur", details: error instanceof Error ? error.message : "" },
      { status: 500 }
    );
  }
}
