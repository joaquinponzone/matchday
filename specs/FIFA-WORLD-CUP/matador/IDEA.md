# Matador — Juego de goleadores del Mundial

Segundo juego del Mundial, complementario al Prode. Cada usuario arma un equipo de goleadores y va sumando puntos a medida que sus jugadores anotan goles.

Referencia visual: ver `./screenshots/` (capturas del "Global Goalscorer" de FIFA+).

---

## Mecánica central

- Cada usuario elige **5 jugadores** de una lista curada de convocados al Mundial.
- Los picks son **siempre editables** — no hay fecha de cierre.
- Cuando un jugador anota un gol, los usuarios que lo tienen en su equipo suman puntos.

## Sistema de puntuación

Inspirado en FIFA+: **cuanto menos popular es un jugador, más puntos da por gol**.

Los puntos por gol dependen del porcentaje de usuarios activos que eligieron a ese jugador en el momento en que se calculan los puntos (post-partido):

| % de usuarios que lo eligieron | Puntos por gol |
|---|---|
| 0 – 9% | 10 pts |
| 10 – 19% | 9 pts |
| 20 – 29% | 8 pts |
| 30 – 39% | 7 pts |
| 40 – 49% | 6 pts |
| 50 – 59% | 5 pts |
| 60 – 69% | 4 pts |
| 70 – 79% | 3 pts |
| 80 – 89% | 2 pts |
| 90 – 100% | 1 pt |

## Persistencia de puntos

Los puntos ganados **persisten aunque el usuario cambie de jugador**. Si tenías a Haaland cuando metió 2 goles y después lo sacás, esos 6 puntos (2 goles × 3 pts) quedan en tu cuenta. No cobrás sus goles futuros.

## Lista de jugadores

- Lista curada y estática de ~50-100 jugadores, definida antes del torneo.
- Almacenada en DB para poder actualizar los goles acumulados en tiempo real.
- Los jugadores se identifican con su ID de football-data.org para el tracking automático de goles.

> ⚠️ **Pendiente**: la lista no se puede armar hasta que cierren las convocatorias oficiales al Mundial.

## Tracking de goles

Automático via cron: después de cada partido del Mundial, se consulta la API de football-data.org para obtener los goleadores y se actualizan los puntos de cada usuario.

## Tabla de posiciones

- Ranking de usuarios por puntos totales acumulados.
- En caso de empate, desempata por cantidad de goles de sus jugadores.
- Muestra nickname del usuario (si configuró uno) o nombre.

---

## Estado

**En diseño** — implementación bloqueada hasta confirmación de convocatorias al Mundial.

Ver plan técnico detallado en: `/Users/m4pro/.claude/plans/smooth-conjuring-squid.md`
