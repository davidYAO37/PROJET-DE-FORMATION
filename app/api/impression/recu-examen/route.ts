import { NextResponse } from 'next/server';
import { db } from '@/db/mongoConnect';
import mongoose from 'mongoose';
import { ObjectId, WithId, Document } from 'mongodb';

// Interface pour la facturation
interface IFacturation extends WithId<Document> {
    _id: ObjectId;
    IDFACTURATION?: string;
    CodePrestation?: string;
    DatePres?: Date;
    // Ajoutez d'autres champs si nécessaire
}

// Interface pour les lignes de prestation
interface ILignePrestation extends WithId<Document> {
    IDFACTURATION: string | ObjectId;
    IDPARTIENT?: string | ObjectId;
    IDHOSPITALISATION?: string | ObjectId;
    Prestation?: string;
    // Ajoutez d'autres champs si nécessaire
}
export async function GET(request: Request) {
  try {
    // Récupérer l'ID depuis les paramètres de requête
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID de facturation manquant' },
        { status: 400 }
      );
    }

    // Se connecter à la base de données
    await db();
    
    // Vérifier que la connexion est établie
    if (!mongoose.connection.db) {
      throw new Error('La connexion à la base de données a échoué');
    }

    console.log('🔍 Recherche de la facture avec ID:', id);
    
    let facturation: IFacturation | null = null;
    
    try {
        // 1. Vérifier si l'ID est un ObjectId valide
        if (ObjectId.isValid(id)) {
            console.log('🔎 Tentative de recherche par _id (ObjectId)...');
            facturation = await mongoose.connection.db.collection<IFacturation>('Facturation').findOne({
                _id: new ObjectId(id)
            });
            console.log('Résultat recherche par _id:', facturation ? '✅ Trouvé' : '❌ Non trouvé');
        }

        // 2. Si pas trouvé, essayer avec IDFACTURATION (chaîne)
        if (!facturation) {
            console.log('🔍 Tentative de recherche par IDFACTURATION...');
            facturation = await mongoose.connection.db.collection<IFacturation>('Facturation').findOne({
                IDFACTURATION: id
            });
            console.log('Résultat recherche par IDFACTURATION:', facturation ? '✅ Trouvé' : '❌ Non trouvé');
        }

        // 3. Si toujours pas trouvé, essayer avec _id comme chaîne (si ce n'est pas déjà un ObjectId)
        if (!facturation && !ObjectId.isValid(id)) {
            console.log('🔍 Tentative de recherche par _id (chaîne)...');
            facturation = await mongoose.connection.db.collection<IFacturation>('Facturation').findOne({
                _id: id as any // Forcer le type car nous savons que c'est une chaîne
            });
            console.log('Résultat recherche par _id (chaîne):', facturation ? '✅ Trouvé' : '❌ Non trouvé');
        }

        // 4. Si toujours pas trouvé, afficher les erreurs
        if (!facturation) {
            console.error('❌ Aucune facture trouvée avec les critères :', {
                _id: id,
                IDFACTURATION: id
            });
            
            // Récupérer des exemples de documents pour le débogage
            const sampleDocs = await mongoose.connection.db.collection<IFacturation>('Facturation')
                .find({})
                .limit(2)
                .toArray();
                
            console.log('📋 Exemples de documents dans la collection Facturation:', 
                JSON.stringify(sampleDocs.map(d => ({
                    _id: d._id?.toString(),
                    IDFACTURATION: d.IDFACTURATION,
                    // Ajouter d'autres champs utiles pour le débogage
                    ...(d.CodePrestation && { CodePrestation: d.Code_PrestATION }),
                    ...(d.DatePres && { DatePres: d.DatePres })
                })), null, 2)
            );

            return NextResponse.json(
                { 
                    error: 'Aucune facture trouvée avec cet ID',
                    receivedId: id,
                    idType: typeof id,
                    sampleIds: sampleDocs.map(d => ({
                        _id: d._id?.toString(),
                        IDFACTURATION: d.IDFACTURATION,
                        CodePrestation: d.CodePrestation
                    }))
                },
                { status: 404 }
            );
        }
    } catch (error: any) {
        const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
        const errorStack = error instanceof Error ? error.stack : undefined;
        
        console.error('❌ Erreur lors de la recherche de la facture:', {
            message: errorMessage,
            stack: errorStack,
            receivedId: id,
            idType: typeof id
        });
        
        return NextResponse.json(
            { 
                error: 'Erreur lors de la recherche de la facture',
                details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
                receivedId: id,
                idType: typeof id
            },
            { status: 500 }
        );
    }

    // Récupérer les lignes de prestation associées
    const idToSearch = facturation._id || id; // Utiliser l'ID de la facture trouvée ou l'ID original
    const lignesPrestation = await mongoose.connection.db!.collection<ILignePrestation>('LignePrestation')
      .find({
        $or: [
          { IDFACTURATION: idToSearch },
          { IDFACTURATION: idToSearch.toString() }
        ],
        statutPrescriptionMedecin: 3
      })
      .toArray();
      
    console.log(`🔍 ${lignesPrestation.length} lignes de prestation trouvées`);

    // Si aucune ligne de prestation trouvée
    if (!lignesPrestation || lignesPrestation.length === 0) {
      return NextResponse.json(
        { error: 'Aucune prestation trouvée pour cette facture' },
        { status: 404 }
      );
    }

    // Récupérer les IDs nécessaires pour les jointures
    const idPatient = lignesPrestation[0].IDPARTIENT;
    const idHospitalisation = lignesPrestation[0].IDHOSPITALISATION;

    // Récupérer les données du patient
    const patient = await mongoose.connection.db!.collection('Patient').findOne({
      IDPARTIENT: idPatient
    });

    // Récupérer les données d'hospitalisation
    const examenHospitalisation = await mongoose.connection.db!.collection('ExamenHospitalisation').findOne({
      IDHOSPITALISATION: idHospitalisation
    });

    // Récupérer le type d'acte
    let typeActe = null;
    if (examenHospitalisation) {
      typeActe = await mongoose.connection.db!.collection('TypeActe').findOne({
        IDTYPE_ACTE: examenHospitalisation.IDTYPE_ACTE
      });
    }

    // Préparer les données du patient
    const patientData = {
      Nom: patient?.Nom || '',
      Code_dossier: patient?.Code_dossier || '',
      Sexe: patient?.Sexe || '',
      Age_partient: patient?.Age_partient || 0,
      Contact: patient?.Contact || '',
      GROUPSA: patient?.GROUPSA || '',
      Date_naisse: patient?.Date_naisse ? new Date(patient.Date_naisse).toISOString().split('T')[0] : ''
    };

    // Préparer les lignes de prestation
    const lignes = await Promise.all(lignesPrestation.map(async (ligne) => {
      return {
        Prestation: ligne.Prestation || '',
        CoefficientActe: ligne.CoefficientActe || 0,
        Qte: ligne.Qte || 0,
        Prix: ligne.Prix || 0,
        PrixTotal: ligne.PrixTotal || 0,
        PartAssurance: ligne.PartAssurance || 0,
        Partassuré_LI: ligne.Partassuré || 0,
        totalsurplus: ligne.totalsurplus || 0,
        Designation: typeActe?.Designation || ''
      };
    }));

    // Calculer le total des prix
    const totalPrix = lignes.reduce((sum, item) => sum + (parseFloat(String(item.PrixTotal)) || 0), 0);

    // Préparer les données de la facture
    const factureData = {
      ...facturation,
      TotalPrix: totalPrix,
      // Assurer que les champs requis existent
      Assuance: facturation.Assuance || '',
      Modepaiement_FA: facturation.Modepaiement || '',
      CodePrestation_FA: facturation.CodePrestation || ''
    };

    // Retourner la réponse formatée
    return NextResponse.json({
      patient: patientData,
      facture: factureData,
      lignes
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des données:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la récupération des données' },
      { status: 500 }
    );
  }
}
