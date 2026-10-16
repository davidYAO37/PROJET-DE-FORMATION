import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";
import { UserCollection } from "@/models/users.model";
import { requireAuth } from "@/lib/auth";
import { Entreprise } from "@/models/entreprise";
import { JournalAction } from "@/models/journalAction";
import { sanitizePermissions } from "@/lib/permissions";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user: currentUser, error } = await requireAuth(req, ["admin"], { actions: ["gestion_utilisateurs"] });
    if (error) return error;

    await db();
    const { id } = await params;

    if (currentUser!.type !== "adminsuper") {
      const targetUser = await UserCollection.findById(id).lean();
      if (!targetUser || String(targetUser.entrepriseId) !== String(currentUser!.entrepriseId)) {
        return NextResponse.json({ message: "Accès interdit" }, { status: 403 });
      }
    }

    const body = await req.json();

    // Validation des champs requis
    if (!body.nom || !body.prenom || !body.email || !body.type) {
      return NextResponse.json({
        message: "Tous les champs sont requis"
      }, { status: 400 });
    }

    // Vérifier si l'email existe déjà (pour un autre utilisateur)
    const existingUser = await UserCollection.findOne({
      email: body.email,
      _id: { $ne: id }
    });

    if (existingUser) {
      return NextResponse.json({
        message: "Cet email est déjà utilisé par un autre utilisateur"
      }, { status: 400 });
    }

    // Mettre à jour l'utilisateur
    const updateData: any = {
      nom: body.nom,
      prenom: body.prenom,
      email: body.email,
      type: body.type
    };

    // État précédent (pour l'audit des changements de rôle/permissions)
    const targetUserDoc: any = await UserCollection.findById(id)
      .select("type email entrepriseId permissions")
      .lean();
    const previousPermissions: unknown = targetUserDoc?.permissions;

    // Permissions personnalisées : validées contre les modules du tenant
    // de l'utilisateur cible. admin/adminsuper gardent l'accès complet.
    if (body.hasOwnProperty('permissions')) {
      const isPrivileged = body.type === "admin" || body.type === "adminsuper";
      if (isPrivileged) {
        updateData.permissions = { services: [], actions: [], customized: false };
      } else {
        const targetEntrepriseId = targetUserDoc?.entrepriseId || currentUser!.entrepriseId;
        const entreprise = targetEntrepriseId
          ? await Entreprise.findById(targetEntrepriseId).select("modules").lean()
          : null;
        const tenantModules = (entreprise as any)?.modules as string[] | undefined;
        const sanitized = sanitizePermissions(body.permissions, tenantModules);
        if (!sanitized) {
          return NextResponse.json({ message: "Permissions invalides." }, { status: 400 });
        }
        updateData.permissions = sanitized;
      }
    }

    if (body.hasOwnProperty('isLocked')) {
      updateData.isLocked = body.isLocked;
    }
    if (body.hasOwnProperty('failedAttempts')) {
      updateData.failedAttempts = body.failedAttempts;
    }
    if (body.hasOwnProperty('remainingAttempts')) {
      updateData.remainingAttempts = body.remainingAttempts;
    }
    if (body.hasOwnProperty('lockedUntil')) {
      updateData.lockedUntil = body.lockedUntil;
    }

    const updatedUser = await UserCollection.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return NextResponse.json({
        message: "Utilisateur non trouvé"
      }, { status: 404 });
    }

    // Audit : tracer toute modification de permissions ou de rôle.
    const permissionsChanged =
      body.hasOwnProperty('permissions') &&
      JSON.stringify(previousPermissions || null) !== JSON.stringify(updateData.permissions || null);
    const typeChanged = targetUserDoc && targetUserDoc.type !== body.type;
    if (permissionsChanged || typeChanged) {
      try {
        await JournalAction.create({
          actorId: currentUser!._id,
          actorEmail: currentUser!.email,
          actorType: currentUser!.type,
          entrepriseId: updatedUser.entrepriseId || currentUser!.entrepriseId,
          action: permissionsChanged ? "permissions_changed" : "role_changed",
          targetUserId: updatedUser._id,
          targetEmail: updatedUser.email,
          details: {
            previousType: targetUserDoc?.type,
            newType: body.type,
            previousPermissions: previousPermissions || null,
            newPermissions: updateData.permissions || null,
          },
          ip: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "",
          userAgent: req.headers.get("user-agent") || "",
        });
      } catch (e) {
        console.error("Erreur journal d'audit permissions:", e);
      }
    }

    return NextResponse.json({
      message: "Utilisateur mis à jour avec succès",
      user: updatedUser
    });

  } catch (error: any) {
    console.error("Erreur lors de la mise à jour de l'utilisateur:", error);

    if (error.code === 11000) {
      return NextResponse.json({
        message: "Cet email est déjà utilisé"
      }, { status: 400 });
    }

    return NextResponse.json({
      message: "Erreur serveur lors de la mise à jour"
    }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user: currentUser, error } = await requireAuth(req, ["admin"], { actions: ["gestion_utilisateurs"] });
    if (error) return error;

    await db();
    const { id } = await params;

    if (currentUser!.type !== "adminsuper") {
      const targetUser = await UserCollection.findById(id).lean();
      if (!targetUser || String(targetUser.entrepriseId) !== String(currentUser!.entrepriseId)) {
        return NextResponse.json({ message: "Accès interdit" }, { status: 403 });
      }
    }

    const deletedUser = await UserCollection.findByIdAndDelete(id);

    if (!deletedUser) {
      return NextResponse.json({
        message: "Utilisateur non trouvé"
      }, { status: 404 });
    }

    return NextResponse.json({
      message: "Utilisateur supprimé avec succès"
    });

  } catch (error) {
    console.error("Erreur lors de la suppression de l'utilisateur:", error);
    return NextResponse.json({
      message: "Erreur serveur lors de la suppression"
    }, { status: 500 });
  }
}
