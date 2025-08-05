import { db } from "@/db/mongoConnect";
import { Patient } from "@/models/patient";
import { NextResponse } from "next/server";

export async function GET() {
  await db();
  try {
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
    const newPatient = await Patient.create(body);
    return NextResponse.json(newPatient, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Erreur lors de l'ajout" }, { status: 500 });
  }
}


/* import { db } from "@/db/mongoConnect";
import { Patient } from "@/models/patient";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await db();

  if (req.method === "POST") {
    try {
      const patient = await Patient.create(req.body);
      return res.status(201).json(patient);
    } catch (error) {
      return res.status(500).json({ error: "Erreur lors de la création" });
    }
  }

  if (req.method === "GET") {
    try {
      const patients = await Patient.find({});
      return res.status(200).json(patients);
    } catch (error) {
      return res.status(500).json({ error: "Erreur lors de la récupération" });
    }
  }

  return res.status(405).json({ error: "Méthode non autorisée" });
}
 */