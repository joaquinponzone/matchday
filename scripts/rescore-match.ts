/**
 * One-off script: resetea y recalcula los puntos del prode para uno o más
 * partidos. Útil cuando cambia la lógica de puntuación o se descubre un error.
 *
 * Uso:
 *   bun run rescore-match [matchNumber...]
 *   bun run rescore-match 82           # re-puntúa solo el partido 82
 *   bun run rescore-match 74 75 82     # re-puntúa múltiples partidos
 */

import { resetMatchPoints, syncProdeResults } from "@/server/db/queries"

const rawArgs = process.argv.slice(2)
const args = rawArgs.map(Number)
if (!rawArgs.length || args.some((n) => !Number.isInteger(n) || n < 1)) {
  console.error("Uso: bun run rescore-match <matchNumber> [matchNumber...]")
  if (rawArgs.length) console.error(`Argumentos inválidos: ${rawArgs.join(" ")}`)
  process.exit(1)
}

console.log(`Reseteando puntos de los partidos: ${args.join(", ")}...`)
for (const num of args) {
  await resetMatchPoints(num)
  console.log(`  ✓ partido ${num} reseteado`)
}

console.log("Recalculando con fetch fresco de la API de FIFA...")
const result = await syncProdeResults({ fresh: true })
console.log(
  `Listo. Partidos evaluados: ${result.matches}, predicciones recalculadas: ${result.calculated}`
)
// El cliente libsql puede mantener vivo el event loop → salir explícitamente.
process.exit(0)
