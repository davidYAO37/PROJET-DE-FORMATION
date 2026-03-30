import { NextRequest, NextResponse } from "next/server";
import { Assurance } from "@/models/assurance";
import { db } from "@/db/mongoConnect";

export async function GET() {
  try {
    await db();

    const assurances = await Assurance.find().lean();

    return NextResponse.json(assurances);
  } catch (error: any) {
    console.error("❌ ERREUR GET /assurances :", error);

    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await db();

    const body = await req.json();

    const assurance = await Assurance.create(body);

    return NextResponse.json(assurance);
  } catch (e: any) {
    console.error("❌ ERREUR POST /assurances :", e);

    return NextResponse.json(
      { error: e.message },
      { status: 400 }
    );
  }
}