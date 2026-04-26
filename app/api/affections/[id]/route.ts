import { NextRequest, NextResponse } from "next/server";
import Affection from "@/models/affection";
import { db } from "@/db/mongoConnect";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    await db();
    try {
        const { id } = await params;
        const body = await req.json();
        
        // Validation des champs requis
        if (!body.designation || !body.lettreCle) {
            return NextResponse.json({ 
                error: "Champs requis manquants", 
                details: !body.designation ? "designation est requis" : "lettreCle est requis"
            }, { status: 400 });
        }
        
        // Nettoyage des données
        const updateData = {
            designation: body.designation.toString().trim(),
            lettreCle: body.lettreCle.toString().trim()
        };
        
        // Vérification que les champs ne sont pas vides après nettoyage
        if (!updateData.designation || !updateData.lettreCle) {
            return NextResponse.json({ 
                error: "Champs requis vides", 
                details: "Les champs designation et lettreCle ne peuvent pas être vides"
            }, { status: 400 });
        }
        
        const affection = await Affection.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
        if (!affection) {
            return NextResponse.json({ error: "Affection non trouvée" }, { status: 404 });
        }
        
        console.log('Affection mise à jour:', affection);
        return NextResponse.json(affection);
    } catch (e: any) {
        console.error('Erreur PUT affection:', e);
        let errorMessage = e.message;
        let status = 400;
        
        // Gestion des erreurs MongoDB spécifiques
        if (e.code === 11000) {
            errorMessage = "Une affection avec cette désignation ou lettre clé existe déjà";
            status = 409;
        } else if (e.name === 'ValidationError') {
            errorMessage = "Erreur de validation: " + Object.values(e.errors).map((err: any) => err.message).join(', ');
        } else if (e.name === 'CastError') {
            errorMessage = "ID invalide";
            status = 400;
        }
        
        return NextResponse.json({ error: errorMessage }, { status });
    }
}
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    await db();
    try {
        const { id } = await params;
        
        const affection = await Affection.findByIdAndDelete(id);
        
        if (!affection) {
            console.log('Affection non trouvée avec ID:', id);
            return NextResponse.json({ 
                error: "Affection non trouvée", 
                id: id
            }, { status: 404 });
        }
        
        console.log('Affection supprimée avec succès:', affection);
        return NextResponse.json({ 
            message: "Affection supprimée avec succès",
            deleted: affection
        });
    } catch (e: any) {
        console.error('Erreur DELETE affection:', e);
        let errorMessage = e.message;
        let status = 400;
        
        if (e.name === 'CastError') {
            errorMessage = "ID invalide";
            status = 400;
        }
        
        return NextResponse.json({ error: errorMessage }, { status });
    }
}
