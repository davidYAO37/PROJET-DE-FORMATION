import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { ParametreCRendu } from "@/models/ParametreCRendu";
import { db } from "@/db/mongoConnect";



// GET - Récupérer tous les paramètres de compte rendu
export async function GET(request: NextRequest) {
  try {
    await db();
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (id) {
      // Récupérer un paramètre spécifique par ID
      const parametre = await ParametreCRendu.findById(id);
      
      if (!parametre) {
        return NextResponse.json(
          { error: "Paramètre de compte rendu non trouvé" },
          { status: 404 }
        );
      }
      
      return NextResponse.json(parametre);
    } else {
      // Récupérer tous les paramètres
      const parametres = await ParametreCRendu.find().sort({ Date: -1 });
      return NextResponse.json(parametres);
    }
  } catch (error: any) {
    console.error("Erreur lors de la récupération des paramètres de compte rendu:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des paramètres de compte rendu" },
      { status: 500 }
    );
  }
}

// POST - Créer un nouveau paramètre de compte rendu
export async function POST(request: NextRequest) {
  try {
    await db();
    
    const body = await request.json();
    const { LettreCle, Date: dateParam, AjouterPar, HeureAjoute } = body;
    
    // Validation des champs requis
    if (!LettreCle || !dateParam || !AjouterPar) {
      return NextResponse.json(
        { error: "Les champs LettreCle, Date et AjouterPar sont requis" },
        { status: 400 }
      );
    }
    
    // Créer le nouveau paramètre
    const nouveauParametre = new ParametreCRendu({
      LettreCle,
      Date: new Date(dateParam),
      AjouterPar,
      HeureAjoute: HeureAjoute || new Date().toLocaleTimeString('fr-FR')
    });
    
    await nouveauParametre.save();
    
    return NextResponse.json(
      { message: "Paramètre de compte rendu créé avec succès", data: nouveauParametre },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Erreur lors de la création du paramètre de compte rendu:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création du paramètre de compte rendu" },
      { status: 500 }
    );
  }
}
