import { NextRequest, NextResponse } from 'next/server';
import { LignePrestation } from '@/models/lignePrestation';
import { Patient } from '@/models/patient';
import { ParametreCRendu } from '@/models/ParametreCRendu';
import { db } from '@/db/mongoConnect';

export async function GET(request: NextRequest) {
  try {
    await db();
    
    const { searchParams } = new URL(request.url);
    const dateDebut = searchParams.get('dateDebut');
    const dateFin = searchParams.get('dateFin');
    const search = searchParams.get('search');

    // Récupérer les paramètres de compte rendu (lettres clés)
    const parametresCR = await ParametreCRendu.find({});
    const lettresCles = parametresCR.map(p => p.LettreCle);

    // Construire la requête de base pour les lignes de prestations
    let query: any = {
      actePayeCaisse: 'Payé',
      ...(lettresCles.length > 0 && { lettreCle: { $in: lettresCles } })
    };

    // Ajouter le filtre de dates
    if (dateDebut || dateFin) {
      query.dateLignePrestation = {};
      if (dateDebut) {
        query.dateLignePrestation.$gte = new Date(dateDebut);
      }
      if (dateFin) {
        query.dateLignePrestation.$lte = new Date(dateFin);
      }
    }

    // Récupérer les lignes de prestations
    const lignePrestations = await LignePrestation.find(query)
      .populate('IdPatient', 'Nom Prenoms Contact Code_dossier Date_naisse')
      .sort({ dateLignePrestation: -1 });

    // Extraire les patients uniques
    const patientsMap = new Map<string, any>();
    const lignePrestationsFormatees = [];

    for (const ligne of lignePrestations) {
      const patient = ligne.IdPatient as any;
      
      // Appliquer le filtre de recherche si nécessaire
      if (search) {
        const searchLower = search.toLowerCase();
        const patientMatch = patient.Nom.toLowerCase().includes(searchLower) ||
                           patient.Prenoms.toLowerCase().includes(searchLower) ||
                           patient.Code_dossier.toLowerCase().includes(searchLower);
        const prestationMatch = ligne.prestation.toLowerCase().includes(searchLower);
        
        if (!patientMatch && !prestationMatch) {
          continue;
        }
      }

      // Ajouter le patient à la map s'il n'existe pas déjà
      const patientId = patient._id.toString();
      if (!patientsMap.has(patientId)) {
        patientsMap.set(patientId, {
          _id: patient._id,
          Nom: patient.Nom,
          Prenoms: patient.Prenoms,
          Contact: patient.Contact,
          Code_dossier: patient.Code_dossier,
          Date_naisse: patient.Date_naisse
        });
      }

      // Formater la ligne de prestation
      lignePrestationsFormatees.push({
        _id: ligne._id,
        dateLignePrestation: ligne.dateLignePrestation,
        prestation: ligne.prestation,
        lettreCle: ligne.lettreCle,
        medecinExecutant: ligne.medecinExecutant,
        resultatSaisiePar: ligne.resultatSaisiePar,
        dateSaisieResultat: ligne.dateSaisieResultat,
        compteRenduValidePar: ligne.compteRenduValidePar,
        compteRenduValideLe: ligne.compteRenduValideLe,
        acteMedecin: ligne.acteMedecin,
        IdPatient: ligne.IdPatient
      });
    }

    // Convertir la map en tableau
    const patients = Array.from(patientsMap.values());

    return NextResponse.json({
      patients,
      lignePrestations: lignePrestationsFormatees
    });

  } catch (error: any) {
    console.error('Erreur dans tPatientsRadio:', error);
    return NextResponse.json(
      { error: 'Erreur lors du chargement des patients' },
      { status: 500 }
    );
  }
}
