import { NextResponse } from 'next/server';
import { readdir } from 'fs/promises';
import { join } from 'path';

export async function GET() {
  try {
    const logosDir = join(process.cwd(), 'public', 'uploads', 'logos');
    
    try {
      const files = await readdir(logosDir);
      return NextResponse.json(files);
    } catch (dirError) {
      // Le répertoire n'existe pas encore
      return NextResponse.json([]);
    }
  } catch (error) {
    console.error('Erreur lecture répertoire logos:', error);
    return NextResponse.json({ error: 'Erreur lecture logos' }, { status: 500 });
  }
}
