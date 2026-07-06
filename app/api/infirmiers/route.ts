import { db } from "@/db/mongoConnect";
import { Infirmier } from "@/models/infirmier";
import { UserCollection } from "@/models/users.model";
import { NextResponse } from "next/server";
import { hashPassword } from "@/utils/auth";

export async function GET(req: Request) {
  await db();
  try {
    const { searchParams } = new URL(req.url);
    const entrepriseId = searchParams.get("entrepriseId");

    const infirmiers = entrepriseId
      ? await Infirmier.find({ entrepriseId })
      : await Infirmier.find({});

    return NextResponse.json(infirmiers);
  } catch (error) {
    console.error("Erreur API infirmiers:", error);
    return NextResponse.json({ error: "Erreur récupération infirmiers" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  await db();
  try {
    const body = await req.json();

    let entrepriseId = body.entrepriseId;
    if (!entrepriseId) entrepriseId = req.headers.get("x-entreprise-id");
    if (!entrepriseId) {
      console.log("⚠️ Aucun entrepriseId trouvé");
      entrepriseId = null;
    }

    body.entrepriseId = entrepriseId;

    const newInfirmier = await Infirmier.create(body);

    if (!body.userId && body.EmailInf) {
      try {
        const existingUser = await UserCollection.findOne({ email: body.EmailInf });
        if (!existingUser) {
          const hashedPassword = await hashPassword(body.EmailInf);
          const newUser = new UserCollection({
            nom:          body.nom,
            prenom:       body.prenoms,
            email:        body.EmailInf,
            type:         "infirmier",
            entrepriseId: entrepriseId,
            uid:          `infirmier_${newInfirmier._id}`,
            password:     hashedPassword,
          });
          await newUser.save();
          await Infirmier.findByIdAndUpdate(newInfirmier._id, { userId: newUser._id });
          console.log(`✅ Utilisateur infirmier créé: ${body.EmailInf}`);
        }
      } catch (userError) {
        console.error("❌ Erreur création utilisateur infirmier:", userError);
      }
    }

    return NextResponse.json(newInfirmier, { status: 201 });
  } catch (error) {
    console.error("Erreur ajout infirmier:", error);
    return NextResponse.json({ error: "Erreur ajout infirmier" }, { status: 500 });
  }
}
