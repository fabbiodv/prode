import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EnvVarWarning } from "@/components/env-var-warning";
import { AuthButton } from "@/components/auth-button";
import { hasEnvVars } from "@/lib/utils";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Target, CheckCircle, XCircle, Minus } from "lucide-react";

interface Match {
  id: number;
  home_team: string;
  away_team: string;
  match_date: string;
  stage: string;
  home_score: number | null;
  away_score: number | null;
}

interface Prediction {
  id: number;
  match_id: number;
  predicted_home_score: number;
  predicted_away_score: number;
  created_at: string;
}

interface MatchWithPrediction extends Match {
  prediction?: Prediction;
  points?: number;
  result_type?: 'exact' | 'winner' | 'wrong' | 'pending';
}

function calculatePoints(prediction: Prediction, match: Match): { points: number; type: string } {
  // Si el partido no tiene resultado aún
  if (match.home_score === null || match.away_score === null) {
    return { points: 0, type: 'pending' };
  }

  const predHome = prediction.predicted_home_score;
  const predAway = prediction.predicted_away_score;
  const realHome = match.home_score;
  const realAway = match.away_score;

  // Resultado exacto: 3 puntos
  if (predHome === realHome && predAway === realAway) {
    return { points: 3, type: 'exact' };
  }

  // Ganador correcto: 1 punto
  const predWinner = predHome > predAway ? 'home' : predHome < predAway ? 'away' : 'draw';
  const realWinner = realHome > realAway ? 'home' : realHome < realAway ? 'away' : 'draw';

  if (predWinner === realWinner) {
    return { points: 1, type: 'winner' };
  }

  // Resultado incorrecto: 0 puntos
  return { points: 0, type: 'wrong' };
}

function getResultIcon(type: string) {
  switch (type) {
    case 'exact':
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    case 'winner':
      return <Target className="h-5 w-5 text-yellow-600" />;
    case 'wrong':
      return <XCircle className="h-5 w-5 text-red-600" />;
    default:
      return <Minus className="h-5 w-5 text-gray-400" />;
  }
}

function getResultBadge(type: string, points: number) {
  const variants = {
    exact: "bg-green-100 text-green-800 border-green-200",
    winner: "bg-yellow-100 text-yellow-800 border-yellow-200",
    wrong: "bg-red-100 text-red-800 border-red-200",
    pending: "bg-gray-100 text-gray-600 border-gray-200"
  };

  const labels = {
    exact: `+${points} pts (Exacto)`,
    winner: `+${points} pts (Ganador)`,
    wrong: `${points} pts`,
    pending: "Pendiente"
  };

  return (
    <Badge className={variants[type as keyof typeof variants] || variants.pending}>
      {labels[type as keyof typeof labels] || labels.pending}
    </Badge>
  );
}

export default async function MiProdePage() {
  const supabase = await createClient();

  // Verificar autenticación
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/auth/login");
  }

  // Obtener partidos con resultados
  const { data: matches, error: matchesError } = await supabase
    .from('matches')
    .select('*')
    .order('match_date', { ascending: true });

  if (matchesError) {
    console.error('Error fetching matches:', matchesError);
  }

  // Obtener predicciones del usuario
  const { data: predictions, error: predictionsError } = await supabase
    .from('predictions')
    .select('*')
    .eq('user_id', user.id);

  if (predictionsError) {
    console.error('Error fetching predictions:', predictionsError);
  }

  // Combinar partidos con predicciones y calcular puntos
  const matchesWithPredictions: MatchWithPrediction[] = (matches || []).map(match => {
    const prediction = (predictions || []).find(p => p.match_id === match.id);

    if (prediction) {
      const { points, type } = calculatePoints(prediction, match);
      return {
        ...match,
        prediction,
        points,
        result_type: type
      };
    }

    return match;
  });

  // Calcular estadísticas
  const totalPredictions = matchesWithPredictions.filter(m => m.prediction).length;
  const finishedMatches = matchesWithPredictions.filter(m => m.home_score !== null && m.away_score !== null);
  const predictedFinishedMatches = finishedMatches.filter(m => m.prediction);
  const totalPoints = predictedFinishedMatches.reduce((sum, match) => sum + (match.points || 0), 0);
  const exactPredictions = predictedFinishedMatches.filter(m => m.result_type === 'exact').length;
  const winnerPredictions = predictedFinishedMatches.filter(m => m.result_type === 'winner').length;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col gap-5 items-center">
        <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
          <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
            <div className="flex gap-5 items-center font-semibold">
              <Link href={"/"}>Prode Flujin</Link>
              <Link href={"/mi-prode"} className="border rounded-full px-2 py-1 bg-slate-500">Mi Prode</Link>
              <Link href={"/ranking"} className="">Ranking</Link>
            </div>
            {!hasEnvVars ? <EnvVarWarning /> : <AuthButton />}
          </div>
        </nav>
        <div className="flex-1 flex flex-col gap-20 max-w-5xl p-5">
          <main className="container mx-auto px-4 py-6">
            <div className="mb-8">
              <h1 className="text-3xl font-bold  mb-2 flex items-center space-x-2">
                <Trophy className="h-8 w-8 text-yellow-600" />
                <span>Mi Prode</span>
              </h1>
              <p className="">Mis predicciones y resultados del Mundial de Clubes 2025</p>
            </div>

            {/* Estadísticas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{totalPoints}</div>
                  <div className="text-sm ">Puntos Totales</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{exactPredictions}</div>
                  <div className="text-sm ">Resultados Exactos</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-600">{winnerPredictions}</div>
                  <div className="text-sm ">Ganadores Correctos</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-slate-600">{totalPredictions}</div>
                  <div className="text-sm ">Predicciones Hechas</div>
                </CardContent>
              </Card>
            </div>

            {/* Lista de partidos */}
            <div className="space-y-4">
              {matchesWithPredictions.map((match) => (
                <Card key={match.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="text-xs">
                        {match.stage}
                      </Badge>
                      <div className="flex items-center space-x-2">
                        {match.prediction && match.result_type && (
                          <>
                            {getResultIcon(match.result_type)}
                            {getResultBadge(match.result_type, match.points || 0)}
                          </>
                        )}
                      </div>
                      <div className="text-sm ">
                        {formatDate(match.match_date)}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="space-y-4">
                      {/* Equipos */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 flex-1">
                          <span className="font-semibold ">{match.home_team}</span>
                        </div>
                        <div className="text-center">
                          <div className="text-sm  mb-1">vs</div>
                        </div>
                        <div className="flex items-center space-x-3 flex-1 justify-end">
                          <span className="font-semibold ">{match.away_team}</span>
                        </div>
                      </div>

                      {/* Resultado Real */}
                      {match.home_score !== null && match.away_score !== null && (
                        <div className="border border-gray-200 rounded-lg p-3">
                          <div className="text-xs  mb-2 text-center">Resultado Real</div>
                          <div className="flex items-center justify-center space-x-4">
                            <div className="text-xl font-bold ">{match.home_score}</div>
                            <span className="">-</span>
                            <div className="text-xl font-bold ">{match.away_score}</div>
                          </div>
                        </div>
                      )}

                      {/* Mi Predicción */}
                      {match.prediction ? (
                        <div className="border border-blue-200 rounded-lg p-3">
                          <div className="text-xs  mb-2 text-center">Mi Predicción</div>
                          <div className="flex items-center justify-center space-x-4">
                            <div className="text-xl font-bold ">{match.prediction.predicted_home_score}</div>
                            <span className="">-</span>
                            <div className="text-xl font-bold ">{match.prediction.predicted_away_score}</div>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-gray-50 rounded-lg p-3 text-center">
                          <div className="text-sm text-gray-600">No hiciste predicción para este partido</div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Información de puntaje */}
            <div className="mt-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-2">📋 Sistema de Puntaje</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• <strong>Resultado exacto:</strong> 3 puntos</li>
                <li>• <strong>Ganador correcto:</strong> 1 punto</li>
                <li>• <strong>Resultado incorrecto:</strong> 0 puntos</li>
              </ul>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
