import { NextRequest, NextResponse } from 'next/server';
import { withTenant } from '@/lib/withTenant';
import { getTenantModel } from '@/lib/tenantModels';
import { IMedecin } from '@/models/medecin';
import { UserCollection } from '@/models/users.model';
import { hashPassword } from '@/utils/auth';

const WRITE_ROLES = ['admin'];

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { context, response } = await withTenant(req, WRITE_ROLES);
  if (!context) return response;

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "ID du médecin requis" }, { status: 400 });
  }

  const Medecin = getTenantModel<IMedecin>(context.connection, 'Medecin');

  try {
    const medecin = await Medecin.findById(id);
    if (!medecin) {
      return NextResponse.json({ error: "Médecin non trouvé" }, { status: 404 });
    }

    const medecinEntrepriseId = medecin.entrepriseId ? String(medecin.entrepriseId) : undefined;
    const connectedEntrepriseId = context.user.entrepriseId ? String(context.user.entrepriseId) : undefined;

    // Sécurité tenant : le médecin doit appartenir au tenant de l'utilisateur connecté
    if (context.user.type !== 'adminsuper' && medecinEntrepriseId && medecinEntrepriseId !== connectedEntrepriseId) {
      return NextResponse.json({ error: "Ce médecin n'appartient pas à votre tenant" }, { status: 403 });
    }

    if (medecin.userId) {
      return NextResponse.json({ error: "Ce médecin a déjà un utilisateur" }, { status: 400 });
    }

    const effectiveEntrepriseId = medecinEntrepriseId || connectedEntrepriseId;
    if (!effectiveEntrepriseId) {
      return NextResponse.json({ error: "Aucune entreprise identifiée" }, { status: 400 });
    }

    const email = medecin.EmailMed ? medecin.EmailMed.trim().toLowerCase() : '';
    if (!email) {
      return NextResponse.json({ error: "Le médecin doit avoir un email pour créer son utilisateur" }, { status: 400 });
    }

    const existingUser = await UserCollection.findOne({
      email,
      entrepriseId: effectiveEntrepriseId
    });

    if (existingUser) {
      await Medecin.findByIdAndUpdate(id, { userId: existingUser._id });
      return NextResponse.json({
        message: "Utilisateur existant lié au médecin",
        userId: existingUser._id,
        email: existingUser.email
      }, { status: 200 });
    }

    const existingUid = await UserCollection.findOne({
      uid: `medecin_${id}`,
      entrepriseId: effectiveEntrepriseId
    });

    if (existingUid) {
      return NextResponse.json({ error: "Un utilisateur avec cet identifiant existe déjà" }, { status: 409 });
    }

    const userType = medecin.specialite?.toLowerCase().trim() === 'radiologie' ? 'radiologue' : 'medecin';
    const password = email;
    const hashedPassword = await hashPassword(password);

    const newUser = new UserCollection({
      nom: medecin.nom,
      prenom: medecin.prenoms,
      email,
      type: userType,
      entrepriseId: effectiveEntrepriseId,
      uid: `medecin_${id}`,
      password: hashedPassword,
    });

    await newUser.save();
    await Medecin.findByIdAndUpdate(id, { userId: newUser._id });

    return NextResponse.json({
      message: "Utilisateur créé et lié au médecin",
      userId: newUser._id,
      email: newUser.email,
      defaultPassword: password
    }, { status: 201 });

  } catch (error: any) {
    console.error("Erreur création utilisateur médecin:", error);
    return NextResponse.json({
      error: "Erreur lors de la création de l'utilisateur",
      details: error.message
    }, { status: 500 });
  }
}
