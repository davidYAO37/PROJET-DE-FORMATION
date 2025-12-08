import { NextRequest, NextResponse } from "next/server";
import { Consultation } from "@/models/consultation";
import { db } from "@/db/mongoConnect";

export async function GET(req: NextRequest) {
    await db();
    try {
        const { searchParams } = new URL(req.url);
        const CodePrestation = searchParams.get("CodePrestation");

        if (!CodePrestation) {
            return NextResponse.json({ error: "Code Prestation requis" }, { status: 400 });
        }

        const consultation = await Consultation.findOne({
            CodePrestation: { $regex: `^${CodePrestation.trim()}$`, $options: "i" }
        })
            .populate("IdPatient", "Nom Prenoms")     // ✅ avec majuscules
            .populate("IDMEDECIN", "nom prenoms");     // ✅ avec minuscules

        if (!consultation) {
            return NextResponse.json({ error: "Consultation non trouvée" }, { status: 404 });
        }

        return NextResponse.json(consultation);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
