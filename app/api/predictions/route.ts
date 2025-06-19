import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { savePrediction, getPrediction, PredictionData } from '@/lib/predictions';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { match_id, predicted_home_score, predicted_away_score } = body;

    // Validar datos
    if (!match_id || predicted_home_score === undefined || predicted_away_score === undefined) {
      return NextResponse.json(
        { error: 'Datos incompletos' },
        { status: 400 }
      );
    }

    const predictionData: PredictionData = {
      user_id: user.id,
      match_id: parseInt(match_id),
      predicted_home_score: parseInt(predicted_home_score),
      predicted_away_score: parseInt(predicted_away_score)
    };

    const result = await savePrediction(predictionData);

    if ('error' in result) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ 
      message: 'Predicción guardada exitosamente',
      data: result.data 
    });

  } catch (error) {
    console.error('Error en API de predicciones:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const matchId = searchParams.get('match_id');

    if (!matchId) {
      return NextResponse.json(
        { error: 'match_id requerido' },
        { status: 400 }
      );
    }

    const result = await getPrediction(user.id, parseInt(matchId));

    return NextResponse.json({
      data: result.data,
      error: result.error
    });

  } catch (error) {
    console.error('Error al obtener predicción:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 