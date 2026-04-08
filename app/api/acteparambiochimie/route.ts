import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/mongoConnect";
import { ActeParamBiochimie } from "@/models/acteParamBiochimie";

export async function GET(req: NextRequest) {
    await db();
    
    try {
        const { searchParams } = new URL(req.url);
        const idactep = searchParams.get('idactep');
        
        let filter = {};
        if (idactep) {
            filter = { IDACTEP: idactep };
        }
        
        const actesParams = await ActeParamBiochimie.find(filter)
            .populate('IDPARAM_BIOCHIME')
            .sort({ ORdonnacementAffichage: 1 })
            .lean();
            
        const transformedParams = actesParams.map((param, index) => ({
            _id: param._id,
            IDACTEP: param.IDACTEP,
            IDPARAM_BIOCHIME: param.IDPARAM_BIOCHIME,
            param_designb: param.param_designb,
            ORdonnacementAffichage: param.ORdonnacementAffichage,
            IDACTE_PARAMBIOCHIMIE: String(index + 1)
        }));
        
        return NextResponse.json(transformedParams);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    await db();
    
    try {
        const body = await req.json();
        const nouvelActeParam = new ActeParamBiochimie(body);
        await nouvelActeParam.save();
        return NextResponse.json(nouvelActeParam, { status: 201 });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}

export async function PUT(req: NextRequest) {
    await db();
    
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        
        if (!id) {
            return NextResponse.json({ error: "ID est requis" }, { status: 400 });
        }
        
        const body = await req.json();
        const updatedParam = await ActeParamBiochimie.findByIdAndUpdate(
            id,
            body,
            { new: true, runValidators: true }
        );
        
        if (!updatedParam) {
            return NextResponse.json({ error: "ActeParamBiochimie non trouvé" }, { status: 404 });
        }
        
        return NextResponse.json(updatedParam);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}

export async function DELETE(req: NextRequest) {
    await db();
    
    try {
        const { searchParams } = new URL(req.url);
        const idactep = searchParams.get('idactep');
        const id = searchParams.get('id');
        
        // Suppression par IDACTEP (tous les paramètres d'un acte)
        if (idactep) {
            await ActeParamBiochimie.deleteMany({ IDACTEP: idactep });
            return NextResponse.json({ message: "Actes param biochimie supprimés avec succès" });
        }
        
        // Suppression par ID (un paramètre spécifique)
        if (id) {
            const result = await ActeParamBiochimie.findByIdAndDelete(id);
            if (!result) {
                return NextResponse.json({ error: "Paramètre non trouvé" }, { status: 404 });
            }
            return NextResponse.json({ message: "Paramètre supprimé avec succès" });
        }
        
        return NextResponse.json(
            { error: "ID ou IDACTEP est requis" },
            { status: 400 }
        );
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
