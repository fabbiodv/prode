import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Crown, Medal, Trophy } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { hasEnvVars } from "@/lib/utils"
import { AuthButton } from "@/components/auth-button"
import { EnvVarWarning } from "@/components/env-var-warning"
import Link from "next/link"

interface RankingUser {
  position: number
  user_id: string
  email: string
  first_name: string
  last_name: string
  points: number
  exactPredictions: number
  partialPredictions: number
  totalPredictions: number
}

interface Prediction {
  id: number
  user_id: string
  match_id: number
  predicted_home_score: number
  predicted_away_score: number
  created_at: string
}

interface Match {
  id: number
  home_team: string
  away_team: string
  home_score: number | null
  away_score: number | null
  match_date: string
  stage: string
}

interface Profile {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  created_at: string
}

// Función para calcular puntos de una predicción
function calculatePoints(
  predictedHome: number,
  predictedAway: number,
  actualHome: number | null,
  actualAway: number | null
): { points: number; type: 'exact' | 'winner' | 'wrong' | 'pending' } {
  // Si el partido no ha terminado, no se pueden calcular puntos
  if (actualHome === null || actualAway === null) {
    return { points: 0, type: 'pending' };
  }

  // Resultado exacto: 3 puntos
  if (predictedHome === actualHome && predictedAway === actualAway) {
    return { points: 3, type: 'exact' };
  }

  // Ganador correcto: 1 punto
  const predictedResult = predictedHome > predictedAway ? 'home' :
    predictedHome < predictedAway ? 'away' : 'draw';
  const actualResult = actualHome > actualAway ? 'home' :
    actualHome < actualAway ? 'away' : 'draw';

  if (predictedResult === actualResult) {
    return { points: 1, type: 'winner' };
  }

  // Resultado incorrecto: 0 puntos
  return { points: 0, type: 'wrong' };
}

export default async function RankingPage() {
  const supabase = await createClient()

  try {
    // Obtener todas las predicciones con información del usuario
    const { data: predictions, error: predictionsError } = await supabase
      .from('predictions')
      .select('*');

    if (predictionsError) throw predictionsError;

    // Obtener todos los partidos
    const { data: matches, error: matchesError } = await supabase
      .from('matches')
      .select('*');

    if (matchesError) throw matchesError;

    // Obtener usuarios únicos que han hecho predicciones
    const uniqueUserIds = [...new Set((predictions || []).map((p: Prediction) => p.user_id))];

    // Obtener perfiles de usuarios de la tabla profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .in('id', uniqueUserIds);

    console.log(profiles);

    if (profilesError) {
      console.error('Error al obtener perfiles:', profilesError);
    }

    // Crear un mapa de usuarios para mejorar el rendimiento
    const userMap = new Map<string, { email: string; first_name: string; last_name: string }>();

    // Llenar el mapa con datos de la tabla profiles
    if (profiles) {
      profiles.forEach((profile: Profile) => {
        userMap.set(profile.id, {
          email: profile.email || '',
          first_name: profile.first_name || '',
          last_name: profile.last_name || ''
        });
      });
    }

    // Para usuarios que no tienen perfil, usar datos por defecto
    uniqueUserIds.forEach((userId: string) => {
      if (!userMap.has(userId)) {
        userMap.set(userId, {
          email: '',
          first_name: '',
          last_name: ''
        });
      }
    });

    // Calcular ranking
    const ranking: RankingUser[] = uniqueUserIds.map((userId: string) => {
      const userPredictions = (predictions || []).filter((p: Prediction) => p.user_id === userId);
      const userInfo = userMap.get(userId) || { email: '', first_name: '', last_name: '' };

      let totalPoints = 0;
      let exactPredictions = 0;
      let partialPredictions = 0;

      userPredictions.forEach((prediction: Prediction) => {
        const match = (matches || []).find((m: Match) => m.id === prediction.match_id);
        if (match) {
          const { points, type } = calculatePoints(
            prediction.predicted_home_score,
            prediction.predicted_away_score,
            match.home_score,
            match.away_score
          );

          totalPoints += points;
          if (type === 'exact') exactPredictions++;
          if (type === 'winner') partialPredictions++;
        }
      });

      return {
        position: 0, // Se asignará después de ordenar
        user_id: userId,
        email: userInfo.email,
        first_name: userInfo.first_name,
        last_name: userInfo.last_name,
        points: totalPoints,
        exactPredictions,
        partialPredictions,
        totalPredictions: userPredictions.length
      };
    }).sort((a: RankingUser, b: RankingUser) => {
      // Ordenar por puntos (descendente), luego por predicciones exactas (descendente)
      if (b.points !== a.points) return b.points - a.points;
      if (b.exactPredictions !== a.exactPredictions) return b.exactPredictions - a.exactPredictions;
      return b.partialPredictions - a.partialPredictions;
    }).map((user: RankingUser, index: number) => ({ ...user, position: index + 1 }));

    const getPositionIcon = (position: number) => {
      switch (position) {
        case 1:
          return <Crown className="h-5 w-5 text-yellow-500" />
        case 2:
          return <Medal className="h-5 w-5 text-gray-400" />
        case 3:
          return <Trophy className="h-5 w-5 text-amber-600" />
        default:
          return <span className="text-slate-500 font-bold">{position}</span>
      }
    }

    const getPositionBadge = (position: number) => {
      if (position <= 3) {
        return (
          <Badge
            variant="default"
            className={position === 1 ? "bg-yellow-500" : position === 2 ? "bg-gray-400" : "bg-amber-600"}
          >
            #{position}
          </Badge>
        )
      }
      return <Badge variant="outline">#{position}</Badge>
    }

    return (
      <div className="min-h-screen flex flex-col items-center">
        <div className="flex-1 w-full flex flex-col gap-5 items-center">
          <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
            <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
              <div className="flex gap-5 items-center font-semibold">
                <Link href={"/"}>Prode Flujin</Link>
                <Link href={"/mi-prode"} className="">Mi Prode</Link>
                <Link href={"/ranking"} className="border rounded-full px-2 py-1 bg-slate-500">Ranking</Link>
              </div>
              {!hasEnvVars ? <EnvVarWarning /> : <AuthButton />}
            </div>
          </nav>
          <div className="flex-1 flex flex-col gap-20 max-w-5xl p-5">
            <main className="container mx-auto px-4 py-6">
              <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2 flex items-center space-x-2">
                  <Crown className="h-8 w-8" />
                  <span>Ranking General</span>
                </h1>
                <p className="">Clasificación de todos los participantes</p>
              </div>

              {ranking.length === 0 ? (
                <Card>
                  <CardContent className="py-8">
                    <div className="text-center text-slate-500">
                      <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Aún no hay participantes en el ranking.</p>
                      <p className="text-sm">¡Haz tus primeras predicciones para aparecer aquí!</p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Tabla de Posiciones</CardTitle>
                    <div className="text-sm text-slate-600">
                      {ranking.length} participante{ranking.length !== 1 ? 's' : ''} en total
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {ranking.map((player) => (
                        <div
                          key={player.user_id}
                          className={`flex items-center justify-between p-4 rounded-lg transition-colors`}
                        >
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center justify-center w-8 h-8">
                              {getPositionIcon(player.position)}
                            </div>
                            <div>
                              <div className="font-semibold">{player.first_name} {player.last_name}</div>
                              <div className="text-sm text-slate-600">
                                {player.exactPredictions} exactos • {player.partialPredictions} parciales • {player.totalPredictions} predicciones
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-3">
                            <div className="text-right">
                              <div className="text-2xl font-bold">{player.points}</div>
                              <div className="text-xs text-slate-500">puntos</div>
                            </div>
                            {getPositionBadge(player.position)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="mt-6 p-4 rounded-lg border">
                <h3 className="font-semibold mb-2">🏆 Premios del Torneo</h3>
                <div className="text-sm space-y-1">
                  <div>
                    🥇 <strong>1er Lugar:</strong> $50.000
                  </div>
                  <div>
                    🥈 <strong>2do Lugar:</strong> .
                  </div>
                  <div>
                    🥉 <strong>3er Lugar:</strong> .
                  </div>
                </div>
              </div>

              <div className="mt-4 p-4 rounded-lg bg-blue-50 border border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-2">📊 Cómo se calcula el puntaje</h3>
                <div className="text-sm text-blue-800 space-y-1">
                  <div>• <strong>Resultado exacto:</strong> 3 puntos</div>
                  <div>• <strong>Ganador correcto:</strong> 1 punto</div>
                  <div>• <strong>Resultado incorrecto:</strong> 0 puntos</div>
                  <p className="text-xs mt-2 text-blue-700">
                    En caso de empate en puntos, se prioriza por predicciones exactas, luego por predicciones parciales.
                  </p>
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error('Error fetching ranking data:', error);

    return (
      <div className="min-h-screen">
        <main className="container mx-auto px-4 py-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2 flex items-center space-x-2">
              <Crown className="h-8 w-8" />
              <span>Ranking General</span>
            </h1>
            <p className="">Clasificación de todos los participantes</p>
          </div>

          <Card>
            <CardContent className="py-8">
              <div className="text-center text-red-500">
                <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Error al cargar el ranking.</p>
                <p className="text-sm">Por favor, intenta nuevamente más tarde.</p>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }
}
