import { EnvVarWarning } from "@/components/env-var-warning";
import { AuthButton } from "@/components/auth-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { hasEnvVars } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { MatchCard } from "../components/match-card";

interface Match {
  id: number;
  home_team: string;
  home_score: number;
  away_team: string;
  away_score: number;
  match_date: string;
  stage: string;
}

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Obtener solo partidos futuros desde Supabase (ajustado a UTC-3)
  const currentDate = new Date();
  currentDate.setHours(currentDate.getHours() - 3);

  const { data: matchesData, error } = await supabase
    .from('matches')
    .select('*')
    .gte('match_date', currentDate.toISOString())
    .order('match_date', { ascending: true })

  if (error) {
    console.error('Error fetching matches:', error);
  }

  const matches: Match[] = matchesData || [];

  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col gap-5 items-center">
        <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
          <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
            <div className="flex gap-5 items-center font-semibold">
              <Link href={"/"}>Prode Flujin</Link>
              <Link href={"/mi-prode"} className="">Mi Prode</Link>
              <Link href={"/ranking"} className="">Ranking</Link>
            </div>
            {!hasEnvVars ? <EnvVarWarning /> : <AuthButton />}
          </div>
        </nav>
        <div className="flex-1 flex flex-col gap-20 max-w-5xl p-5">
          <main className="container mx-auto px-4 py-6">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">Mundial de Clubes 2025</h1>
              <p className="text-sm">Fixture completo del torneo - Haz tus predicciones</p>
            </div>

            {user ? (
              <>
                <div className="grid gap-4 md:gap-6">
                  {matches.map((match: Match) => (
                    <MatchCard key={match.id} match={match} userId={user.id} />
                  ))}
                </div>

                <div className="mt-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-blue-900 mb-2">📋 Cómo funciona el puntaje</h3>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>
                      • <strong>Resultado exacto:</strong> 3 puntos
                    </li>
                    <li>
                      • <strong>Ganador correcto:</strong> 1 punto
                    </li>
                    <li>
                      • <strong>Resultado incorrecto:</strong> 0 puntos
                    </li>
                  </ul>
                </div>
              </>
            ) : (
              <div className=" py-12">
                <div className=" rounded-lg p-8 border border-gray-200">
                  <h2 className="text-2xl font-bold mb-4">
                    Inicia sesión para hacer tus predicciones
                  </h2>
                  <p className="text-sm">
                    Para poder participar en el prode del Mundial de Clubes 2025 y hacer tus predicciones, necesitas tener una cuenta.
                  </p>

                </div>
              </div>
            )}
          </main>
        </div>

        <footer className="w-full flex items-center justify-center border-t mx-auto text-center text-xs gap-8 py-16">
          <p>
            Fabio Mazzarella
          </p>
          <ThemeSwitcher />
        </footer>
      </div>
    </main>
  );
}
