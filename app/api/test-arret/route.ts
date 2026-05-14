import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Test simple sans MongoDB
    return NextResponse.json({
      success: true,
      message: 'Test API fonctionne',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Test simple pour voir les données reçues
    return NextResponse.json({
      success: true,
      message: 'Données reçues avec succès',
      data: body,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
