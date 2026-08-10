import { IMedecin } from "@/models/medecin";
import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/lib/withTenant";
import { getTenantModel } from "@/lib/tenantModels";

const READ_ROLES = ["admin", "medecin", "accueil", "caisse", "comptable", "biologiste", "infirmier"];
const WRITE_ROLES = ["admin"];

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { context, response } = await withTenant(req, READ_ROLES);
  if (!context) return response;
  const Medecin = getTenantModel<IMedecin>(context.connection, "Medecin");
  const { id } = await params;
  try {
    const medecin = await Medecin.findById(id);
    if (!medecin) return NextResponse.json({ error: "Médecin non trouvé" }, { status: 404 });
    return NextResponse.json(medecin);
  } catch {
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { context, response } = await withTenant(req, WRITE_ROLES);
  if (!context) return response;
  const Medecin = getTenantModel<IMedecin>(context.connection, "Medecin");
  const { id } = await params;
  try {
    const body = await req.json();
    console.log("Données reçues pour modification médecin:", body);
    const updated = await Medecin.findByIdAndUpdate(id, body, { new: true });
    if (!updated) return NextResponse.json({ error: "Médecin non trouvé" }, { status: 404 });
    console.log("Médecin modifié:", updated);
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Erreur update médecin:", error);
    return NextResponse.json({ error: "Erreur update" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { context, response } = await withTenant(req, WRITE_ROLES);
  if (!context) return response;
  const Medecin = getTenantModel<IMedecin>(context.connection, "Medecin");
  const { id } = await params;
  try {
    await Medecin.findByIdAndDelete(id);
    return NextResponse.json({ message: "Médecin supprimé" });
  } catch {
    return NextResponse.json({ error: "Erreur suppression" }, { status: 500 });
  }
}
