import { createClient } from "@/lib/supabase/server";

export interface PredictionData {
  user_id: string;
  match_id: number;
  predicted_home_score: number;
  predicted_away_score: number;
}

export async function savePrediction(predictionData: PredictionData) {
  const supabase = await createClient();

  // Primero verificar si el partido ya comenzó
  /*const { data: match, error: matchError } = await supabase
    .from('matches')
    .select('match_date')
    .eq('id', predictionData.match_id)
    .single();

  if (matchError) {
    return { error: 'Partido no encontrado' };
  }*/

  //const matchDateTime = new Date(match.match_date);
  //const now = new Date();
  //const timeDifferenceMs = now.getTime() - matchDateTime.getTime();
  //const timeDifferenceHours = timeDifferenceMs / (1000 * 60 * 60);

  /*
  if (timeDifferenceHours >= 0) {
    if (timeDifferenceHours <= 2) {
      return { error: 'No se pueden guardar predicciones durante el partido (en curso)' };
    } else {
      return { error: 'No se pueden guardar predicciones después del partido (terminado)' };
    }
  }
  */
  // Verificar si ya existe una predicción
  const { data: existingPrediction } = await supabase
    .from('predictions')
    .select('id')
    .eq('user_id', predictionData.user_id)
    .eq('match_id', predictionData.match_id)
    .single();

  if (existingPrediction) {
    // Actualizar predicción existente
    const result = await supabase
      .from('predictions')
      .update({
        predicted_home_score: predictionData.predicted_home_score,
        predicted_away_score: predictionData.predicted_away_score
      })
      .eq('id', existingPrediction.id)
      .select();

    return result.error ? { error: result.error.message } : { data: result.data };
  } else {
    // Crear nueva predicción
    const result = await supabase
      .from('predictions')
      .insert([predictionData])
      .select();

    return result.error ? { error: result.error.message } : { data: result.data };
  }
}

export async function getPrediction(userId: string, matchId: number) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('predictions')
    .select('*')
    .eq('user_id', userId)
    .eq('match_id', matchId)
    .single();

  return { data, error };
} 