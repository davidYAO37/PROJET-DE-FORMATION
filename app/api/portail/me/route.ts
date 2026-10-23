import { NextRequest, NextResponse } from "next/server";
import { requirePatientAuth } from "@/lib/patientAuth";

export async function GET(req: NextRequest) {
  const { context, response } = await requirePatientAuth(req);
  if (!context) return response;

  const p = context.patient;
  return NextResponse.json(
    {
      patient: {
        _id: p._id.toString(),
        nom: p.Nom,
        prenoms: p.Prenoms,
        codeDossier: p.Code_dossier,
        sexe: p.sexe,
        dateNaissance: p.Date_naisse,
        contact: p.Contact,
        situationgeo: p.Situationgeo,
      },
    },
    { status: 200 }
  );
}
