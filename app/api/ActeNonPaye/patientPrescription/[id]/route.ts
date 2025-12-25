import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";
import mongoose from "mongoose";

/**
 * Mettre à jour le statut d'une prescription
 * Met à jour uniquement statutPrescriptionMedecin à 1
 */
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    await db();
    try {
        const { id } = await params;
        const body = await req.json();
    // Vérification de l'ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.error('ID de prescription invalide:', id);
      return NextResponse.json(
        { 
          success: false, 
          message: "ID de prescription invalide",
          error: "INVALID_ID"
        },
        { status: 400 }
      );
    }
    
    await db();
    
    if (!mongoose.connection.db) {
      console.error('Erreur de connexion à la base de données');
      return NextResponse.json(
        { 
          success: false, 
          message: "Erreur de connexion à la base de données",
          error: "DATABASE_CONNECTION_ERROR"
        },
        { status: 500 }
      );
    }
    
    // Essayer avec différentes variantes du nom de la collection
    const collectionNames = ['patientprescriptions', 'patient_prescriptions', 'patientPrescriptions'];
    let updateResult = null;
    
    for (const collectionName of collectionNames) {
      try {
        console.log(`Tentative avec la collection: ${collectionName}`);
        const collection = mongoose.connection.db.collection(collectionName);
        
        // Vérifier si le document existe
        const existingDoc = await collection.findOne({ _id: new mongoose.Types.ObjectId(id) });
        
        if (existingDoc) {
          updateResult = await collection.findOneAndUpdate(
            { _id: new mongoose.Types.ObjectId(id) },
            { 
              $set: { 
                statutPrescriptionMedecin: 1,
                updatedAt: new Date()
              } 
            },
            { 
              returnDocument: 'after',
              projection: {
                _id: 1,
                statutPrescriptionMedecin: 1,
                updatedAt: 1
              }
            }
          );
          
          if (updateResult && updateResult.value) {
            console.log(`Mise à jour réussie avec la collection: ${collectionName}`);
            break;
          }
        }
      } catch (err) {
        console.error(`Erreur avec la collection ${collectionName}:`, err);
        continue;
      }
    }

    if (!updateResult || !updateResult.value) {
      console.error('Aucune prescription trouvée avec ID:', id);
      
      // Afficher les collections disponibles pour le débogage
      const collections = await mongoose.connection.db.listCollections().toArray();
      const availableCollections = collections.map(c => c.name);
      
      return NextResponse.json(
        { 
          success: false, 
          message: `Prescription non trouvée avec l'ID: ${id}`,
          availableCollections,
          timestamp: new Date().toISOString()
        },
        { status: 404 }
      );
    }

    console.log('Statut de la prescription mis à jour avec succès:', updateResult.value._id);
    
    return NextResponse.json({
      success: true,
      data: {
        id: updateResult.value._id,
        statutPrescriptionMedecin: 1
      },
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la prescription:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : "Erreur lors de la mise à jour de la prescription"
      },
      { status: 500 }
    );
  }
}
