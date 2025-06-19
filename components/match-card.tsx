"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Save, Check } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface Match {
  id: number
  home_team: string
  home_score: number
  away_team: string
  away_score: number
  match_date: string
  stage: string
}

interface Prediction {
  id: number
  user_id: string
  match_id: number
  predicted_home_score: number
  predicted_away_score: number
  created_at: string
}

interface MatchCardProps {
  match: Match
  userId: string
  showPredictionForm?: boolean
}

export function MatchCard({ match, userId, showPredictionForm = true }: MatchCardProps) {
  const [homeGoals, setHomeGoals] = useState("")
  const [awayGoals, setAwayGoals] = useState("")
  const [saved, setSaved] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [existingPrediction, setExistingPrediction] = useState<Prediction | null>(null)
  const supabase = createClient()

  // Verificar el estado del partido
  const getMatchStatus = () => {
    const matchDateTime = new Date(match.match_date)
    const now = new Date()
    const timeDifferenceMs = now.getTime() - matchDateTime.getTime()
    const timeDifferenceHours = timeDifferenceMs / (1000 * 60 * 60)

    if (timeDifferenceHours < 0) {
      return { status: 'upcoming', canPredict: true }
    } else if (timeDifferenceHours >= 0 && timeDifferenceHours <= 2) {
      return { status: 'in_progress', canPredict: false }
    } else {
      return { status: 'finished', canPredict: false }
    }
  }

  const matchStatus = getMatchStatus()

  // Cargar predicción existente al montar el componente
  useEffect(() => {
    const loadExistingPrediction = async () => {
      const { data, error } = await supabase
        .from('predictions')
        .select('*')
        .eq('user_id', userId)
        .eq('match_id', match.id)
        .single()

      if (data && !error) {
        setExistingPrediction(data)
        setHomeGoals(data.predicted_home_score.toString())
        setAwayGoals(data.predicted_away_score.toString())
      }
    }

    if (userId && match.id) {
      loadExistingPrediction()
    }
  }, [userId, match.id, supabase])

  const handleSavePrediction = async () => {
    if (homeGoals !== "" && awayGoals !== "") {
      // Verificación adicional antes de enviar
      if (!matchStatus.canPredict) {
        console.error('No se puede guardar la predicción: el partido ya comenzó o terminó')
        return
      }

      setIsLoading(true)
      
      try {
        const response = await fetch('/api/predictions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            match_id: match.id,
            predicted_home_score: parseInt(homeGoals),
            predicted_away_score: parseInt(awayGoals)
          })
        })

        const result = await response.json()

        if (!response.ok) {
          console.error('Error saving prediction:', result.error)
          // Si el error es porque el partido ya comenzó o terminó, actualizar el estado
          if (result.error?.includes('en curso') || result.error?.includes('terminado')) {
            // Forzar re-render para actualizar el estado del partido
            window.location.reload()
          }
        } else {
          setSaved(true)
          setTimeout(() => setSaved(false), 2000)
          
          // Recargar la predicción existente
          const { data } = await supabase
            .from('predictions')
            .select('*')
            .eq('user_id', userId)
            .eq('match_id', match.id)
            .single()
          
          if (data) {
            setExistingPrediction(data)
          }
        }
      } catch (error) {
        console.error('Error saving prediction:', error)
      } finally {
        setIsLoading(false)
      }
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("es-ES", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  return (
    <Card className="w-full hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="text-xs">
            {match.stage}
          </Badge>
          <div className="text-sm">
            {formatDate(match.match_date)}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3 flex-1">
            <span className="font-semibold text-sm sm:text-base">{match.home_team}</span>
          </div>

          {showPredictionForm ? (
            <div className="flex items-center space-x-2 mx-4">
              <Input
                type="number"
                min="0"
                max="20"
                value={homeGoals}
                onChange={(e) => setHomeGoals(e.target.value)}
                className="w-13 h-10 text-center"
                placeholder="0"
                disabled={!matchStatus.canPredict}
              />
              <span className="text-slate-400 font-bold">-</span>
              <Input
                type="number"
                min="0"
                max="20"
                value={awayGoals}
                onChange={(e) => setAwayGoals(e.target.value)}
                className="w-13 h-10 text-center"
                placeholder="0"
                disabled={!matchStatus.canPredict}
              />
            </div>
          ) : (
            <div className="flex items-center space-x-2 mx-4">
              <div className="w-12 h-10 bg-slate-100 rounded-md flex items-center justify-center">
                <span className="font-bold text-slate-600">-</span>
              </div>
              <span className="text-slate-400 font-bold">-</span>
              <div className="w-12 h-10 bg-slate-100 rounded-md flex items-center justify-center">
                <span className="font-bold text-slate-600">-</span>
              </div>
            </div>
          )}

          <div className="flex items-center space-x-3 flex-1 justify-end">
            <span className="font-semibold text-sm sm:text-base text-right">{match.away_team}</span>
          </div>
        </div>

        {showPredictionForm && (
          <div className="flex flex-col items-center space-y-2">
            {!matchStatus.canPredict && (
              <div className={`text-xs px-3 py-1 rounded-full border ${
                matchStatus.status === 'in_progress' 
                  ? 'text-amber-600 bg-amber-50 border-amber-200' 
                  : 'text-red-600 bg-red-50 border-red-200'
              }`}>
                {matchStatus.status === 'in_progress' 
                  ? '⚽ Partido en curso - No se pueden modificar predicciones'
                  : '🏁 Partido terminado - No se pueden modificar predicciones'
                }
              </div>
            )}
            <Button
              onClick={handleSavePrediction}
              disabled={homeGoals === "" || awayGoals === "" || isLoading || !matchStatus.canPredict}
              size="sm"
              className="flex items-center space-x-2"
            >
              {saved ? (
                <>
                  <Check className="h-4 w-4" />
                  <span>Guardado</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>{isLoading ? "Guardando..." : existingPrediction ? "Actualizar Predicción" : "Guardar Predicción"}</span>
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
