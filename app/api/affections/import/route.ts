import { NextRequest, NextResponse } from "next/server";
import Affection from "@/models/affection";
import { db } from "@/db/mongoConnect";

export async function POST(req: NextRequest) {
    await db();
    
    try {
        const body = await req.json();
        console.log('Request body:', JSON.stringify(body, null, 2));
        
        const { rows } = body;
        
        if (!rows || !Array.isArray(rows)) {
            return NextResponse.json({ 
                error: 'Invalid request format',
                details: 'rows array is required'
            }, { status: 400 });
        }
        
        console.log(`Processing ${rows.length} rows`);
        
        // Valider et transformer les données
        const affectionsToInsert = rows.map((row: any, index: number) => {
            console.log(`Processing row ${index}:`, JSON.stringify(row, null, 2));
            
            // S'assurer que les champs requis existent
            if (!row.designation || !row.lettreCle) {
                const error = `Champs requis manquants dans la ligne ${index + 1}: designation=${!!row.designation}, lettreCle=${!!row.lettreCle}`;
                console.error(error);
                throw new Error(error);
            }
            
            const designation = row.designation.toString().trim();
            const lettreCle = row.lettreCle.toString().trim();
            
            if (!designation || !lettreCle) {
                const error = `Champs requis vides dans la ligne ${index + 1}: designation="${designation}", lettreCle="${lettreCle}"`;
                console.error(error);
                throw new Error(error);
            }
            
            return {
                designation,
                lettreCle
            };
        });
        
        console.log('Validated data:', JSON.stringify(affectionsToInsert, null, 2));
        
        // Insérer en masse
        const result = await Affection.insertMany(affectionsToInsert, { ordered: false });
        
        return NextResponse.json({ 
            message: `${result.length} affections importées avec succès`,
            inserted: result.length 
        });
    } catch (e: any) {
        console.error('Import error:', e);
        return NextResponse.json({ 
            error: e.message,
            details: e.message.includes('duplicate key') ? 'Doublon détecté' : 
                    e.message.includes('required') ? 'Champs requis manquants' :
                    'Erreur lors de l\'importation'
        }, { status: 400 });
    }
}
