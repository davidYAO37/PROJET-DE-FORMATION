import { withTenant } from "@/lib/withTenant";
import { getTenantModel } from "@/lib/tenantModels";
import { IInfirmier } from "@/models/infirmier";
import { NextRequest, NextResponse } from "next/server";

const ROLES = ['admin', 'medecin', 'accueil', 'infirmier'];

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { context, response: tenantErrorResponse } = await withTenant(req, ROLES);
  if (!context) return tenantErrorResponse;
  const Infirmier = getTenantModel<IInfirmier>(context.connection, 'Infirmier');
  const { id } = await params;
  try {
    const infirmier = await Infirmier.findById(id);
    if (!infirmier) return NextResponse.json({ error: "Infirmier non trouvé" }, { status: 404 });
    return NextResponse.json(infirmier);
  } catch {
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { context, response: tenantErrorResponse } = await withTenant(req, ROLES);
  if (!context) return tenantErrorResponse;
  const Infirmier = getTenantModel<IInfirmier>(context.connection, 'Infirmier');
  const { id } = await params;
  try {
    const body = await req.json();
    const updated = await Infirmier.findByIdAndUpdate(id, body, { new: true });
    if (!updated) return NextResponse.json({ error: "Infirmier non trouvé" }, { status: 404 });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Erreur update infirmier:", error);
    return NextResponse.json({ error: "Erreur update" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { context, response: tenantErrorResponse } = await withTenant(req, ROLES);
  if (!context) return tenantErrorResponse;
  const Infirmier = getTenantModel<IInfirmier>(context.connection, 'Infirmier');
  const { id } = await params;
  try {
    await Infirmier.findByIdAndDelete(id);
    return NextResponse.json({ message: "Infirmier supprimé" });
  } catch {
    return NextResponse.json({ error: "Erreur suppression" }, { status: 500 });
  }
}
