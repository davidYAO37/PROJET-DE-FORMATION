import { NextRequest, NextResponse } from "next/server";
import { ActeClinique } from "@/models/acteclinique";
import { db } from "@/db/mongoConnect";

export async function GET(request: NextRequest) {
  try {
    await db();
    
    const { searchParams } = new URL(request.url);
    const lettreCle = searchParams.get('lettreCle');
    const id = searchParams.get('id');
    
    // Si un ID est fourni, récupérer un acte spécifique
    if (id) {
      const acte = await ActeClinique.findById(id);
      if (!acte) {
        return NextResponse.json(
          { error: "Acte clinique non trouvé" },
          { status: 404 }
        );
      }
      
      const transformedActe = {
        _id: acte._id,
        Designation: acte.designationacte,
        ResultatMultiple: acte.TypeResultat === 1 || acte.resultatacte === "Multiple",
        LettreCle: acte.lettreCle,
        Interpretation: acte.Interpretation || ""
      };
      
      return NextResponse.json(transformedActe);
    }
    
    // Sinon, récupérer tous les actes avec filtre optionnel
    let filter = {};
    if (lettreCle) {
      filter = { lettreCle: lettreCle };
    }
    
    const actes = await ActeClinique.find(filter).sort({ designationacte: 1 });
    
    // Transformer les données pour correspondre à l'interface attendue
    const transformedActes = actes.map(acte => ({
      _id: acte._id,
      Designation: acte.designationacte,
      ResultatMultiple: acte.TypeResultat === 1 || acte.resultatacte === "Multiple",
      LettreCle: acte.lettreCle,
      Interpretation: acte.Interpretation || ""
    }));
    
    return NextResponse.json(transformedActes);
  } catch (error) {
    console.error("Erreur lors de la récupération des actes cliniques:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des actes cliniques" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await db();
    const body = await request.json();
    
    const nouvelActe = new ActeClinique({
      designationacte: body.Designation,
      lettreCle: body.LettreCle || "B",
      TypeResultat: body.ResultatMultiple ? 1 : 0,
      resultatacte: body.ResultatMultiple ? "Multiple" : "Simple",
      Interpretation: body.Interpretation || ""
    });
    
    await nouvelActe.save();
    
    const transformedActe = {
      _id: nouvelActe._id,
      Designation: nouvelActe.designationacte,
      ResultatMultiple: nouvelActe.TypeResultat === 1,
      LettreCle: nouvelActe.lettreCle,
      Interpretation: nouvelActe.Interpretation || ""
    };
    
    return NextResponse.json(transformedActe, { status: 201 });
  } catch (error) {
    console.error("Erreur lors de la création de l'acte clinique:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de l'acte clinique" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await db();
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: "ID de l'acte clinique requis" },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    
    const acte = await ActeClinique.findById(id);
    if (!acte) {
      return NextResponse.json(
        { error: "Acte clinique non trouvé" },
        { status: 404 }
      );
    }
    
    // Mettre à jour les champs fournis
    if (body.Designation !== undefined) {
      acte.designationacte = body.Designation;
    }
    if (body.LettreCle !== undefined) {
      acte.lettreCle = body.LettreCle;
    }
    if (body.ResultatMultiple !== undefined) {
      acte.TypeResultat = body.ResultatMultiple ? 1 : 0;
      acte.resultatacte = body.ResultatMultiple ? "Multiple" : "Simple";
    }
    if (body.Interpretation !== undefined) {
      acte.Interpretation = body.Interpretation;
    }
    
    await acte.save();
    
    const transformedActe = {
      _id: acte._id,
      Designation: acte.designationacte,
      ResultatMultiple: acte.TypeResultat === 1,
      LettreCle: acte.lettreCle,
      Interpretation: acte.Interpretation || ""
    };
    
    return NextResponse.json(transformedActe);
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'acte clinique:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de l'acte clinique" },
      { status: 500 }
    );
  }
}
