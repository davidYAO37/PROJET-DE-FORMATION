import { db } from "@/db/mongoConnect";
import { Testimonial } from "@/models/Testimonial";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

const defaultTestimonials = [
  {
    name: "Dr. Amani Koné",
    role: "Directrice médicale, Clinique Espoir",
    text: "Avant Easy Medical, nos dossiers étaient éparpillés. Aujourd'hui, chaque médecin accède au parcours patient en temps réel. Cela a changé la qualité de nos soins.",
    rating: 5,
    active: true,
    order: 1,
  },
  {
    name: "Serge Yao",
    role: "Responsable caisse, Polyclinique Les Orchidées",
    text: "La caisse est devenue un jeu d'enfant. Les factures se génèrent automatiquement et le suivi des impayés est ultra-clair. Un vrai gain de temps quotidien.",
    rating: 5,
    active: true,
    order: 2,
  },
  {
    name: "Dr. Fatou Bamba",
    role: "Médecin généraliste",
    text: "Je peux consulter les antécédents, prescriptions et résultats de labo en quelques clics. La prise de décision est plus rapide et plus sûre.",
    rating: 5,
    active: true,
    order: 3,
  },
  {
    name: "Kouadio Jean",
    role: "Gestionnaire de pharmacie",
    text: "Le stock de médicaments est enfin maîtrisé. Je reçois des alertes avant les ruptures et la dispensation est liée directement aux prescriptions.",
    rating: 4,
    active: true,
    order: 4,
  },
  {
    name: "Dr. Koffi Mensah",
    role: "Biologiste, Laboratoire Bio-Santé",
    text: "L'intégration des résultats biologiques dans le dossier patient a supprimé les doubles saisies. Nos délais de validation ont été divisés par deux.",
    rating: 5,
    active: true,
    order: 5,
  },
  {
    name: "Aïcha Diallo",
    role: "Secrétaire médicale",
    text: "L'accueil est fluidifié. L'enregistrement d'un patient prend moins d'une minute et le rendez-vous est transmis automatiquement au service concerné.",
    rating: 5,
    active: true,
    order: 6,
  },
  {
    name: "M. Emmanuel N'Guessan",
    role: "Directeur administratif",
    text: "Les tableaux de bord me donnent une vision claire de l'activité. Je peux enfin piloter la clinique avec des chiffres fiables et actualisés.",
    rating: 5,
    active: true,
    order: 7,
  },
  {
    name: "Dr. Rose Achi",
    role: "Gynécologue",
    text: "La confidentialité et la traçabilité des dossiers sont essentielles dans mon service. Easy Medical répond parfaitement à ces exigences avec une interface intuitive.",
    rating: 5,
    active: true,
    order: 8,
  },
];

async function seedTestimonialsIfEmpty() {
  const count = await Testimonial.countDocuments();
  if (count === 0) {
    await Testimonial.insertMany(defaultTestimonials);
    console.log("✅ 8 témoignages par défaut insérés");
  }
}

// GET /api/testimonials — Récupérer les témoignages actifs
export async function GET(req: NextRequest) {
  await db();
  try {
    await seedTestimonialsIfEmpty();

    const { searchParams } = new URL(req.url);
    const activeOnly = searchParams.get("active") !== "false";

    const query = activeOnly ? { active: true } : {};
    const testimonials = await Testimonial.find(query)
      .sort({ order: 1, createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, data: testimonials });
  } catch (error) {
    console.error("Erreur récupération témoignages:", error);
    return NextResponse.json(
      { success: false, error: "Erreur récupération témoignages" },
      { status: 500 }
    );
  }
}

// POST /api/testimonials — Créer un témoignage (protégé, adminsuper uniquement)
export async function POST(req: NextRequest) {
  await db();
  try {
    const { user, error } = await requireAuth(req, ["adminsuper"]);
    if (error || !user) return error;

    const body = await req.json();
    const { name, role, text, rating, active, order } = body;

    if (!name || !role || !text) {
      return NextResponse.json(
        { success: false, error: "Nom, rôle et texte sont requis" },
        { status: 400 }
      );
    }

    const testimonial = await Testimonial.create({
      name,
      role,
      text,
      rating: rating ?? 5,
      active: active ?? true,
      order: order ?? 0,
    });

    return NextResponse.json({ success: true, data: testimonial });
  } catch (error) {
    console.error("Erreur création témoignage:", error);
    return NextResponse.json(
      { success: false, error: "Erreur création témoignage" },
      { status: 500 }
    );
  }
}

// PUT /api/testimonials — Mettre à jour un témoignage (protégé, adminsuper uniquement)
export async function PUT(req: NextRequest) {
  await db();
  try {
    const { user, error } = await requireAuth(req, ["adminsuper"]);
    if (error || !user) return error;

    const body = await req.json();
    const { _id, name, role, text, rating, active, order } = body;

    if (!_id) {
      return NextResponse.json(
        { success: false, error: "ID requis" },
        { status: 400 }
      );
    }

    const updated = await Testimonial.findByIdAndUpdate(
      _id,
      { name, role, text, rating, active, order },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Témoignage non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Erreur mise à jour témoignage:", error);
    return NextResponse.json(
      { success: false, error: "Erreur mise à jour témoignage" },
      { status: 500 }
    );
  }
}

// DELETE /api/testimonials — Supprimer un témoignage (protégé, adminsuper uniquement)
export async function DELETE(req: NextRequest) {
  await db();
  try {
    const { user, error } = await requireAuth(req, ["adminsuper"]);
    if (error || !user) return error;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID requis" },
        { status: 400 }
      );
    }

    const deleted = await Testimonial.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Témoignage non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: "Témoignage supprimé" });
  } catch (error) {
    console.error("Erreur suppression témoignage:", error);
    return NextResponse.json(
      { success: false, error: "Erreur suppression témoignage" },
      { status: 500 }
    );
  }
}
