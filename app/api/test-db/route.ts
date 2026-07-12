import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('Test API simple');
    
    return NextResponse.json({
      success: true,
      message: 'Test API simple réussi',
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Erreur:', error);
    return NextResponse.json({
      success: false,
      message: 'Erreur',
      error: error.message
    }, { status: 500 });
  }
}
