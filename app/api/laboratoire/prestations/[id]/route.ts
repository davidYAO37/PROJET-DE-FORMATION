import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";
import { LignePrestation } from "@/models/lignePrestation";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await db();
    const { id } = await params;

    const prestations = await LignePrestation.find({
      idHospitalisation: id,
    })
      .sort({
        ordonnancementAffichage: 1,
        createdAt: 1,
      })
      .lean();
    return NextResponse.json(prestations);
  } catch (error) {
    console.error(error);

    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
