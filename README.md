# 🏆 Prode Flujin - Mundial de Clubes 2025

Una aplicación web de predicciones deportivas para el Mundial de Clubes FIFA 2025, donde los usuarios pueden hacer sus pronósticos sobre los partidos y competir por puntos.

## ✨ Características

- 🔮 **Predicciones de partidos**: Predice el resultado de todos los partidos del Mundial de Clubes 2025
- 📊 **Sistema de puntuación**: 
  - 3 puntos por resultado exacto
  - 1 punto por acertar el ganador
  - 0 puntos por resultado incorrecto
- 👤 **Autenticación segura**: Sistema de usuarios con Supabase Auth
- 📱 **Diseño responsivo**: Interfaz optimizada para móviles y escritorio
- 🌙 **Modo oscuro**: Cambia entre tema claro y oscuro
- 📈 **Estadísticas personales**: Revisa tus predicciones y puntuación total

## 🚀 Tecnologías

- **Frontend**: Next.js 15, React 19, TypeScript
- **Estilos**: Tailwind CSS, Radix UI
- **Backend**: Supabase (Base de datos + Autenticación)
- **Desarrollo**: Turbopack, ESLint

## 📋 Requisitos Previos

- Node.js 18.0 o superior
- npm o yarn
- Cuenta de Supabase

## 🛠️ Instalación

1. **Clona el repositorio**
```bash
git clone <url-del-repositorio>
cd prode
```

2. **Instala las dependencias**
```bash
npm install
```

3. **Configura las variables de entorno**
Crea un archivo `.env.local` en la raíz del proyecto:
```env
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key
```

4. **Inicia el servidor de desarrollo**
```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

## 🗂️ Estructura del Proyecto

```
prode/
├── app/                    # App Router de Next.js
│   ├── api/               # API routes
│   ├── auth/              # Páginas de autenticación
│   ├── mi-prode/          # Página de estadísticas personales
│   └── page.tsx           # Página principal
├── components/            # Componentes reutilizables
│   ├── ui/                # Componentes de UI (Radix + Tailwind)
│   └── ...
├── lib/                   # Utilidades y configuraciones
│   ├── supabase/          # Cliente de Supabase
│   └── utils.ts           # Funciones utilitarias
└── ...
```

## 📊 Base de Datos

El proyecto utiliza Supabase con las siguientes tablas principales:

### `matches`
- `id`: ID único del partido
- `home_team`: Equipo local
- `away_team`: Equipo visitante
- `home_score`: Goles del equipo local
- `away_score`: Goles del equipo visitante
- `match_date`: Fecha y hora del partido
- `stage`: Fase del torneo

### `predictions`
- `id`: ID único de la predicción
- `user_id`: ID del usuario
- `match_id`: ID del partido
- `predicted_home_score`: Goles predichos para el equipo local
- `predicted_away_score`: Goles predichos para el equipo visitante
- `created_at`: Fecha de creación

## 🎮 Cómo Usar

1. **Regístrate o inicia sesión** en la aplicación
2. **Explora los partidos** disponibles en la página principal
3. **Haz tus predicciones** clickeando en cada partido
4. **Revisa tus estadísticas** en la sección "Mi Prode"
5. **Compite** con otros usuarios por la mayor puntuación

## 🚀 Scripts Disponibles

```bash
# Desarrollo con Turbopack
npm run dev

# Construir para producción
npm run build

# Iniciar servidor de producción
npm start

# Linting
npm run lint
```

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-caracteristica`)
3. Commit tus cambios (`git commit -am 'Agrega nueva característica'`)
4. Push a la rama (`git push origin feature/nueva-caracteristica`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto es de uso personal. 

## 👨‍💻 Autor

**Fabio Mazzarella**

---

¡Disfruta haciendo tus predicciones y que gane el mejor! 🏆
