import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/mongoConnect';
import { Facturation } from '@/models/Facturation';
import { Consultation } from '@/models/consultation';
import { Prescription } from '@/models/Prescription';
import { ExamenHospitalisation } from '@/models/examenHospit';
import mongoose from 'mongoose';

export async function PUT(request: NextRequest) {
  try {
    await db();
    const body = await request.json();
    const {
      idConsultation,
      idPrescription,
      idHospitalisation,
      idFacturation,
      assuranceId,
      nomAssurance,
      societePatient,
      idSocieteAssurance,
      matricule,
      numBon,
    } = body;

    const hasData = assuranceId || (nomAssurance !== undefined && nomAssurance !== '') ||
      (societePatient !== undefined && societePatient !== '') ||
      (idSocieteAssurance !== undefined && idSocieteAssurance !== '') ||
      (matricule !== undefined && matricule !== '') ||
      (numBon !== undefined && numBon !== '');

    if (!hasData) {
      return NextResponse.json({ success: false, message: 'Aucune donnée à modifier' }, { status: 400 });
    }

    // 1. Consultation
    if (idConsultation) {
      const consData: Record<string, any> = {};
      if (assuranceId) consData.IDASSURANCE = new mongoose.Types.ObjectId(assuranceId);
      if (nomAssurance !== undefined && nomAssurance !== '') consData.assurance = nomAssurance;
      if (societePatient !== undefined && societePatient !== '') consData.SOCIETE_PATIENT = societePatient;
      if (idSocieteAssurance !== undefined && idSocieteAssurance !== '') consData.IDSOCIETEASSURANCE = idSocieteAssurance;
      if (matricule !== undefined && matricule !== '') consData.numero_carte = matricule;
      if (numBon !== undefined && numBon !== '') consData.NumBon = numBon;
      await Consultation.findByIdAndUpdate(idConsultation, { $set: consData });
    }

    // 2. Facturation (prestation / hospitalisation / pharmacie)
    if (idFacturation) {
      const factData: Record<string, any> = {};
      if (assuranceId) factData.IDASSURANCE = new mongoose.Types.ObjectId(assuranceId);
      if (nomAssurance !== undefined && nomAssurance !== '') factData.Assurance = nomAssurance;
      if (societePatient !== undefined && societePatient !== '') factData.SOCIETE_PATIENT = societePatient;
      if (idSocieteAssurance !== undefined && idSocieteAssurance !== '') factData.IDSOCIETEASSURANCE = new mongoose.Types.ObjectId(idSocieteAssurance);
      if (matricule !== undefined && matricule !== '') factData.Numcarte = matricule;
      if (numBon !== undefined && numBon !== '') factData.NumBon = numBon;
      await Facturation.findByIdAndUpdate(idFacturation, { $set: factData });
    }

    // 3. Prescription
    if (idPrescription) {
      const presData: Record<string, any> = {};
      if (assuranceId) presData.IDASSURANCE = new mongoose.Types.ObjectId(assuranceId);
      if (nomAssurance !== undefined && nomAssurance !== '') presData.Assurance = nomAssurance;
      if (societePatient !== undefined && societePatient !== '') presData.SOCIETE_PATIENT = societePatient;
      if (idSocieteAssurance !== undefined && idSocieteAssurance !== '') presData.IDSOCIETEASSURANCE = idSocieteAssurance;
      if (matricule !== undefined && matricule !== '') presData.Numcarte = matricule;
      if (numBon !== undefined && numBon !== '') presData.NumBon = numBon;
      await Prescription.findByIdAndUpdate(idPrescription, { $set: presData });
    }

    // 4. ExamenHospitalisation
    if (idHospitalisation) {
      const hospData: Record<string, any> = {};
      if (assuranceId) hospData.IDASSURANCE = new mongoose.Types.ObjectId(assuranceId);
      if (nomAssurance !== undefined && nomAssurance !== '') hospData.Assurance = nomAssurance;
      if (societePatient !== undefined && societePatient !== '') hospData.SOCIETE_PATIENT = societePatient;
      if (idSocieteAssurance !== undefined && idSocieteAssurance !== '') hospData.IDSOCIETEASSURANCE = new mongoose.Types.ObjectId(idSocieteAssurance);
      if (matricule !== undefined && matricule !== '') hospData.Numcarte = matricule;
      if (numBon !== undefined && numBon !== '') hospData.NumBon = numBon;
      await ExamenHospitalisation.findByIdAndUpdate(idHospitalisation, { $set: hospData });
    }

    return NextResponse.json({ success: true, message: 'Ligne modifiée avec succès' });
  } catch (error) {
    console.error('Erreur modification ligne bordereau assurance:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur', error: error instanceof Error ? error.message : 'Erreur' },
      { status: 500 }
    );
  }
}
