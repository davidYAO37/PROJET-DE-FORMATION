import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/lib/withTenant";
import { getTenantModel } from "@/lib/tenantModels";
import { IActeParamLabo } from "@/models/acteParamLabo";

const READ_ROLES = ["admin", "accueil", "biologiste", "caisse", "comptable", "infirmier", "medecin", "pharmacien", "radiologue", "technicienlabo"];
const WRITE_ROLES = ["admin"];

export async function GET(request: NextRequest) {
  const { context, response } = await withTenant(request, READ_ROLES);
  if (!context) return response;
  const ActeParamLabo = getTenantModel<IActeParamLabo>(context.connection, "ActeParamLabo");

  try {
    const { searchParams } = new URL(request.url);
    const idactep = searchParams.get('idactep');
    
    let filter = {};
    if (idactep) {
      filter = { IDACTEP: idactep };
    }
    
    const actesParams = await ActeParamLabo.find(filter).sort({ ORdonnacementAffichage: 1, NUM_PARAM: 1 });
    
    // Transformer les données pour correspondre à l'interface attendue
    const transformedParams = actesParams.map((param, index) => ({
      _id: param._id,
      IDACTE_PARAMLABO: String(index + 1),
      ValeurMaxNormale: param.ValeurMaxNormale,
      ValeurMinNormale: param.ValeurMinNormale,
      ValeurNormale: param.ValeurNormale,
      IDPARAM_LABO: param.IDPARAM_LABO,
      IDACTEP: param.IDACTEP,
      PlageMaxEnfant: param.PlageMaxEnfant,
      PlageMinEnfant: param.PlageMinEnfant,
      PlageMinMaxEnfant: param.PlageMinMaxEnfant,
      PLageMinFemme: param.PLageMinFemme,
      PlageMaxFemme: param.PlageMaxFemme,
      PlageMinMaxFemme: param.PlageMinMaxFemme,
      PlageMinHomme: param.PlageMinHomme,
      PlageMaxHomme: param.PlageMaxHomme,
      PlageMinMaxHomme: param.PlageMinMaxHomme,
      PlageMinMaxNé: param.PlageMinMaxNé,
      PlageRefMinNe: param.PlageRefMinNe,
      PlageRefMaxNé: param.PlageRefMaxNé,
      NUM_PARAM: param.NUM_PARAM,
      Param_designation: param.Param_designation,
      ParamAbrege: param.ParamAbrege,
      UnitéParam: param.UnitéParam,
      TypeTexte: param.TypeTexte,
      ORdonnacementAffichage: param.ORdonnacementAffichage
    }));
    
    return NextResponse.json(transformedParams);
  } catch (error) {
    console.error("Erreur lors de la récupération des actes param labo:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des actes param labo" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const { context, response } = await withTenant(request, WRITE_ROLES);
  if (!context) return response;
  const ActeParamLabo = getTenantModel<IActeParamLabo>(context.connection, "ActeParamLabo");

  try {
    const body = await request.json();
    
    const nouvelActeParam = new ActeParamLabo(body);
    await nouvelActeParam.save();
    
    return NextResponse.json(nouvelActeParam, { status: 201 });
  } catch (error) {
    console.error("Erreur lors de la création de l'acte param labo:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de l'acte param labo" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const { context, response } = await withTenant(request, WRITE_ROLES);
  if (!context) return response;
  const ActeParamLabo = getTenantModel<IActeParamLabo>(context.connection, "ActeParamLabo");

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: "ID du paramètre requis" },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    
    const param = await ActeParamLabo.findById(id);
    if (!param) {
      return NextResponse.json(
        { error: "Paramètre non trouvé" },
        { status: 404 }
      );
    }
    
    // Mettre à jour tous les champs fournis
    const updatableFields = [
      'ValeurMaxNormale', 'ValeurMinNormale', 'ValeurNormale', 'IDPARAM_LABO',
      'PlageMaxEnfant', 'PlageMinEnfant', 'PlageMinMaxEnfant', 'PLageMinFemme',
      'PlageMaxFemme', 'PlageMinMaxFemme', 'PlageMinHomme', 'PlageMaxHomme',
      'PlageMinMaxHomme', 'PlageMinMaxNé', 'PlageRefMinNe', 'PlageRefMaxNé',
      'NUM_PARAM', 'Param_designation', 'ParamAbrege', 'UnitéParam',
      'TypeTexte', 'ORdonnacementAffichage', 'IDACTEP'
    ];
    
    updatableFields.forEach(field => {
      if (body[field] !== undefined) {
        (param as any)[field] = body[field];
      }
    });
    
    await param.save();
    
    // Transformer les données pour correspondre à l'interface attendue
    const transformedParam = {
      _id: param._id,
      IDACTE_PARAMLABO: param._id, // Utiliser _id comme IDACTE_PARAMLABO
      ValeurMaxNormale: param.ValeurMaxNormale,
      ValeurMinNormale: param.ValeurMinNormale,
      ValeurNormale: param.ValeurNormale,
      IDPARAM_LABO: param.IDPARAM_LABO,
      IDACTEP: param.IDACTEP,
      PlageMaxEnfant: param.PlageMaxEnfant,
      PlageMinEnfant: param.PlageMinEnfant,
      PlageMinMaxEnfant: param.PlageMinMaxEnfant,
      PLageMinFemme: param.PLageMinFemme,
      PlageMaxFemme: param.PlageMaxFemme,
      PlageMinMaxFemme: param.PlageMinMaxFemme,
      PlageMinHomme: param.PlageMinHomme,
      PlageMaxHomme: param.PlageMaxHomme,
      PlageMinMaxHomme: param.PlageMinMaxHomme,
      PlageMinMaxNé: param.PlageMinMaxNé,
      PlageRefMinNe: param.PlageRefMinNe,
      PlageRefMaxNé: param.PlageRefMaxNé,
      NUM_PARAM: param.NUM_PARAM,
      Param_designation: param.Param_designation,
      ParamAbrege: param.ParamAbrege,
      UnitéParam: param.UnitéParam,
      TypeTexte: param.TypeTexte,
      ORdonnacementAffichage: param.ORdonnacementAffichage
    };
    
    return NextResponse.json(transformedParam);
  } catch (error) {
    console.error("Erreur lors de la mise à jour du paramètre:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du paramètre" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const { context, response } = await withTenant(request, WRITE_ROLES);
  if (!context) return response;
  const ActeParamLabo = getTenantModel<IActeParamLabo>(context.connection, "ActeParamLabo");

  try {
    const { searchParams } = new URL(request.url);
    const idactep = searchParams.get('idactep');
    const id = searchParams.get('id');
    
    // Suppression par IDACTEP (tous les paramètres d'un acte)
    if (idactep) {
      await ActeParamLabo.deleteMany({ IDACTEP: idactep });
      return NextResponse.json({ message: "Actes param labo supprimés avec succès" });
    }
    
    // Suppression par ID (un paramètre spécifique)
    if (id) {
      const result = await ActeParamLabo.findByIdAndDelete(id);
      if (!result) {
        return NextResponse.json(
          { error: "Paramètre non trouvé" },
          { status: 404 }
        );
      }
      return NextResponse.json({ message: "Paramètre supprimé avec succès" });
    }
    
    return NextResponse.json(
      { error: "ID ou IDACTEP est requis" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Erreur lors de la suppression des actes param labo:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression des actes param labo" },
      { status: 500 }
    );
  }
}
