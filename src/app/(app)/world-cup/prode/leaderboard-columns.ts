// Definición compartida de las columnas del ranking. Vive en un módulo sin
// "use client" para que también pueda importarse desde Server Components (p. ej.
// la página de reglamento), donde un import desde un módulo cliente devolvería
// una referencia/proxy en vez del array real.
export const COLUMNS: { key: string; label: string; help: string }[] = [
  { key: "pts", label: "Pts", help: "Puntos totales" },
  {
    key: "exact",
    label: "Exact",
    help: "Aciertos exactos (resultado y marcador, 2 pts)",
  },
  {
    key: "bien",
    label: "Bien",
    help: "Resultado acertado pero marcador distinto (1 pt)",
  },
  {
    key: "fall",
    label: "Fall",
    help: "Fallados: partidos evaluados sin puntos",
  },
  { key: "ac", label: "%Ac", help: "% de aciertos sobre partidos evaluados" },
  {
    key: "ex",
    label: "%Ex",
    help: "% de aciertos exactos sobre partidos evaluados",
  },
  {
    key: "prom",
    label: "Prom",
    help: "Promedio de puntos por partido evaluado",
  },
  { key: "carg", label: "Carg", help: "Pronósticos cargados (total)" },
  { key: "eval", label: "Eval", help: "Partidos ya jugados de los cargados" },
  {
    key: "racha",
    label: "Racha",
    help: "Partidos consecutivos sumando puntos",
  },
  {
    key: "maxracha",
    label: "Máx",
    help: "Racha más larga alcanzada (histórica)",
  },
]
