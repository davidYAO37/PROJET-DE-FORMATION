
import { db } from "@/db/mongoConnect";
import { Consultation } from "@/models/consultation";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";

// Fonction pour valider les ObjectIds
const isValidObjectId = (value: any): boolean => {
  if (!value) return false;
  if (typeof value !== 'string') return false;
  return mongoose.Types.ObjectId.isValid(value) && String(new mongoose.Types.ObjectId(value)) === value;
};

// Fonction pour nettoyer le payload et convertir les ObjectIds invalides
const cleanPayload = (payload: any): any => {
  const cleaned = { ...payload };

  // Liste des champs qui doivent être des ObjectIds
  const objectIdFields = [
    'IDASSURANCE',
    'IDSOCIETEASSURANCE',
    'IdPatient',
    'idMedecin',
    'IDSOCIETEPARTENAIRE',
    'IDCHAMBRE',
  ];

  objectIdFields.forEach((field) => {
    if (field in cleaned) {
      const value = cleaned[field];

      // Si la valeur est "RAS" ou autre string invalide, la supprimer
      if (value === "RAS" || value === "" || (typeof value === 'string' && !isValidObjectId(value))) {
        delete cleaned[field];
      }
      // Si c'est un ObjectId valide, le garder
      else if (typeof value === 'string' && isValidObjectId(value)) {
        cleaned[field] = new mongoose.Types.ObjectId(value);
      }
    }
  });

  return cleaned;
};

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await db();
    const { id } = await params;
    const body = await req.json();
    if (!id) {
      return NextResponse.json(
        { error: "ID manquant", message: "L'identifiant de la consultation est requis" },
        { status: 400 }
      );
    }

    // Vérifier si la consultation existe
   const consultations = await Consultation.findById(id);
      
    if (!consultations) {
      return NextResponse.json(
        { error: "Consultation non trouvée" },
        { status: 404 }
      );
    }

    // Nettoyer le payload pour éliminer les ObjectIds invalides
    const cleanedBody = cleanPayload(body);

    console.log("✨ Payload nettoyé:", { cleanedKeys: Object.keys(cleanedBody) });

    // Mettre à jour le statut de la prescription

       const updated = await Consultation.findByIdAndUpdate(
         id,
         { ...cleanedBody, updatedAt: new Date() },
         { new: true, runValidators: false },
        
       );
   
       if (!updated) {
         return NextResponse.json(
           { error: "Consultation introuvable", message: "La consultation à mettre à jour n'existe pas après mise à jour" },
           { status: 404 }
         );
       }
   
       console.log("✅ Consultation mise à jour avec succès:", updated._id);
   
       return NextResponse.json({
         success: true,
         message: "Consultation mise à jour avec succès",
         id: updated._id,
         data: updated,
       });
     } catch (error: any) {
       console.error("Erreur PUT /api/consnonFacture/[id]:", error);
       return NextResponse.json(
         { error: "Erreur serveur", message: error.message || "Une erreur est survenue lors de la mise à jour" },
         { status: 500 }
       );
     }
}
