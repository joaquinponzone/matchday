# Contribuir a Matchday

Gracias por querer ayudar! Este es un proyecto personal, así que las contribuciones son principalmente ideas, specs y mejoras pequeñas. Acá va cómo hacerlo bien.

## Reglas básicas

- **Nunca mergees tu propio PR.** Solo el codeowner (@joaquinponzone) mergea. Siempre.
- Mantené los cambios enfocados — una cosa por PR.
- Ante la duda, abrí un issue o discussion antes de escribir código.

## Workflow

### 1. Fork & clone

```bash
git clone https://github.com/joaquinponzone/matchday.git
cd matchday
bun install
```

### 2. Crear una rama

Partí desde `main`. Usá un nombre descriptivo con prefijo:

| Prefijo | Cuándo usarlo |
|---|---|
| `feat/` | Feature nueva o mejora |
| `fix/` | Corrección de bug |
| `spec/` | Ideas, specs o solo docs |
| `chore/` | Tooling, config, dependencias |

```bash
git checkout main
git pull origin main
git checkout -b feat/nombre-de-tu-feature
```

### 3. Hacer los cambios

Para ideas y specs, agregá un archivo en `specs/` (ej. `specs/TU_IDEA.md`). No hace falta tocar código para eso.

Para cambios de código, seguí las convenciones de [CLAUDE.md](./CLAUDE.md):
- Comillas dobles, sin punto y coma, indentación de 2 espacios
- Server Components por defecto — solo `"use client"` cuando sea necesario
- Corré los checks antes de pushear:

```bash
bun run lint
bun run typecheck
bun run format
```

### 4. Push y abrir un PR

```bash
git push origin feat/nombre-de-tu-feature
```

Después abrí un Pull Request contra `main` en GitHub.

**Formato del título del PR:** `feat: descripción corta` / `fix: descripción corta` / `spec: descripción corta`

En la descripción del PR, explicá brevemente:
- ¿Qué hace o propone?
- ¿Por qué es útil?
- ¿Alguna pregunta abierta o algo para discutir?

### 5. Esperar review

El codeowner va a revisar y mergear. No lo mergees vos — aunque parezca listo.

## Ideas & Specs

Si solo tenés una idea y no querés escribir código, lo más fácil es:

1. Crear una rama: `git checkout -b spec/tu-idea`
2. Agregar un markdown: `specs/TU_IDEA.md`
3. Abrir un PR — describí la idea en el body del PR o en el archivo

No hace falta código. Las ideas son bienvenidas.

## Setup local

Vas a necesitar:
- [Bun](https://bun.sh/) como runtime
- Un archivo `.env.local` — pedile las variables a @joaquinponzone

```bash
bun install
bun run dev
```

Consultá [CLAUDE.md](./CLAUDE.md) para todos los comandos disponibles.
