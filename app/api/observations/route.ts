import { db } from "@/db/mongoConnect";
import { ObservationHospit } from "@/models/ObservationHospit";
import { NextResponse, NextRequest } from "next/server";
import { Types } from "mongoose";

// GET: Récupérer les observations selon les filtres
export async function GET(req: NextRequest) {
  await db();
  try {
    const { searchParams } = new URL(req.url);
    const hospitalisationId = searchParams.get("hospitalisationId");
    const patientId = searchParams.get("patientId");
    const codeDossier = searchParams.get("codeDossier");
    const codePrestation = searchParams.get("codePrestation");
    const entrepriseId = searchParams.get("entrepriseId");

    const filter: Record<string, any> = {};
    
    // Priorité à l'hospitalisationId
    if (hospitalisationId) {
      if (!Types.ObjectId.isValid(hospitalisationId)) {
        return NextResponse.json({ error: "Hospitalisation ID invalide" }, { status: 400 });
      }
      filter.Hospitalisation = new Types.ObjectId(hospitalisationId);
    }
    // Sinon, utiliser le patientId (compatibilité)
    else if (patientId) {
      if (!Types.ObjectId.isValid(patientId)) {
        return NextResponse.json({ error: "Patient ID invalide" }, { status: 400 });
      }
      filter.Patient = new Types.ObjectId(patientId);
    }
    
    // Filtres optionnels selon l'interface
    if (codeDossier) filter.Code_dossier = codeDossier;
    if (codePrestation) filter.CodePrestation = codePrestation;
    if (entrepriseId) filter.entrepriseId = entrepriseId;

    const observations = await ObservationHospit.find(filter)
      .populate('Patient', 'Nom Prenoms Code_dossier')
      .populate('Hospitalisation', 'PatientP Chambre Entrele Designationtypeacte')
      .sort({ createdAt: -1 });
      
    return NextResponse.json(observations);
  } catch (error) {
    console.error("Erreur GET observations:", error);
    return NextResponse.json({ 
      error: "Erreur récupération observations: " + (error as Error).message 
    }, { status: 500 });
  }
}

// POST: Créer une nouvelle observation
export async function POST(req: NextRequest) {
  await db();
  try {
    const body = await req.json();
    
    // Validation des champs requis (au moins Patient ou Hospitalisation)
    if (!body.Hospitalisation && !body.Patient) {
      return NextResponse.json({ 
        error: "Hospitalisation ou Patient est requis" 
      }, { status: 400 });
    }
    
    // Préparation des données selon l'interface IObservationHospit
    const observationData: any = {};
    
    // Champs ObjectId avec validation
    if (body.Patient) {
      if (!Types.ObjectId.isValid(body.Patient)) {
        return NextResponse.json({ error: "Patient ID invalide" }, { status: 400 });
      }
      observationData.Patient = new Types.ObjectId(body.Patient);
    }
    
    if (body.Hospitalisation) {
      if (!Types.ObjectId.isValid(body.Hospitalisation)) {
        return NextResponse.json({ error: "Hospitalisation ID invalide" }, { status: 400 });
      }
      observationData.Hospitalisation = new Types.ObjectId(body.Hospitalisation);
    }
    
    // Champs de type Date
    if (body.Date) {
      observationData.Date = new Date(body.Date);
    }
    
    // Champs de type string - validation simplifiée
    if (body.Heure !== undefined && body.Heure !== null) {
      observationData.Heure = body.Heure;
    }
    
    if (body.ObservationC !== undefined && body.ObservationC !== null) {
      observationData.ObservationC = body.ObservationC;
    }
    
    if (body.Poids !== undefined && body.Poids !== null) {
      observationData.Poids = body.Poids;
    }
    
    if (body.Temperature !== undefined && body.Temperature !== null) {
      observationData.Temperature = body.Temperature;
    }
    
    if (body.Tension !== undefined && body.Tension !== null) {
      observationData.Tension = body.Tension;
    }
    
    if (body.Glycemie !== undefined && body.Glycemie !== null) {
      observationData.Glycemie = body.Glycemie;
    }
    
    if (body.TailleCons !== undefined && body.TailleCons !== null) {
      observationData.TailleCons = body.TailleCons;
    }
    
    if (body.Code_dossier !== undefined && body.Code_dossier !== null) {
      observationData.Code_dossier = body.Code_dossier;
    }
    
    if (body.CodePrestation !== undefined && body.CodePrestation !== null) {
      observationData.CodePrestation = body.CodePrestation;
    }
    
    if (body.entrepriseId !== undefined && body.entrepriseId !== null) {
      observationData.entrepriseId = body.entrepriseId;
    }
    
    if (body.Intervenant !== undefined && body.Intervenant !== null) {
      observationData.Intervenant = body.Intervenant;
    }
    
    // Création de l'observation
    const observation = await ObservationHospit.create(observationData);
    
    // Retourner l'observation créée avec les populations
    const result = await ObservationHospit.findById(observation._id)
      .populate('Patient', 'Nom Prenoms Code_dossier')
      .populate('Hospitalisation', 'PatientP Chambre Entrele Designationtypeacte')
      .lean();
    
    return NextResponse.json(result, { status: 201 });
    
  } catch (error) {
    console.error("Erreur POST observation:", error);
    return NextResponse.json({ 
      error: "Erreur création observation: " + (error as Error).message 
    }, { status: 500 });
  }
}
