import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/mongoConnect';
import { Medecin } from '@/models/medecin';

export async function GET(req: NextRequest, { params }: { params: Promise<{ name: string }> }) {
  try {
    await db();
    
    const { name } = await params;
    
    if (!name) {
      return NextResponse.json(
        { error: 'Nom du médecin requis' },
        { status: 400 }
      );
    }

    // Logique WinDev : HLitRecherchePremier(MEDECIN,Nom,gsUtilisateur)
    // Rechercher par nom et prénoms exacts, avec fallback sur nom seul
    const fullName = decodeURIComponent(name);
    
    // 1. Essayer recherche par nom complet exact
    let medecin = await Medecin.findOne({ 
      nom: fullName.split(' ')[0],
      prenoms: fullName.split(' ').slice(1).join(' ')
    });
    
    // 2. Si pas trouvé, essayer recherche par nom seul (cas où localStorage contient seulement le nom)
    if (!medecin) {
      medecin = await Medecin.findOne({ 
        nom: fullName 
      });
    }
    
    // 3. Si toujours pas trouvé, essayer recherche insensible à la casse
    if (!medecin) {
      medecin = await Medecin.findOne({ 
        $expr: { 
          $eq: [
            { $toLower: `$${'$'}concat(nom, ' ', prenoms)` },
            fullName.toLowerCase()
          ]
        }
      });
    }

    if (!medecin) {
      return NextResponse.json(
        { error: 'Médecin non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json(medecin);
    
  } catch (error) {
    console.error('Erreur lors de la recherche du médecin:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la recherche du médecin' },
      { status: 500 }
    );
  }
}
