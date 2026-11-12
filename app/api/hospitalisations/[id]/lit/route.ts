import { NextRequest, NextResponse } from 'next/server';
import { withTenant } from '@/lib/withTenant';
import { affecterLitSejour, LitServiceError } from '@/lib/litService';

// PUT /api/hospitalisations/[id]/lit — attribuer ou remplacer le lit du séjour
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { context, response } = await withTenant(req, ['admin', 'medecin', 'accueil', 'infirmier']);
  if (!context) return response;
  const { connection, userObjectId } = context;

  try {
    const { id } = await params;
    const body = await req.json();
    if (!body?.litId) {
      return NextResponse.json({ message: 'litId est requis' }, { status: 400 });
    }

    const sejour = await affecterLitSejour(connection, {
      hospitalisationId: id,
      litId: body.litId.toString(),
      chambreId: body.chambreId?.toString(),
      auteurId: userObjectId,
    });

    return NextResponse.json({ success: true, sejour });
  } catch (error) {
    if (error instanceof LitServiceError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    console.error('Erreur PUT hospitalisations/[id]/lit:', error);
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 });
  }
}
