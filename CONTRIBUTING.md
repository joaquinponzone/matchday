# Contributing to Matchday

Thanks for helping out! This is a personal project, so contributions are mainly ideas, specs, and small improvements. Here's how to do it properly.

## Ground Rules

- **Never merge your own PR.** Only the codeowner (@joaquinponzone) merges. Always.
- Keep changes focused — one thing per PR.
- When in doubt, open an issue or discussion first before writing code.

## Workflow

### 1. Fork & clone

```bash
git clone https://github.com/joaquinponzone/matchday.git
cd matchday
bun install
```

### 2. Create a feature branch

Branch off `main`. Use a descriptive name with a prefix:

| Prefix | When to use |
|---|---|
| `feat/` | New feature or enhancement |
| `fix/` | Bug fix |
| `spec/` | Ideas, specs, or docs only |
| `chore/` | Tooling, config, deps |

```bash
git checkout main
git pull origin main
git checkout -b feat/your-feature-name
```

### 3. Make your changes

For ideas and specs, add a file under `specs/` (e.g. `specs/YOUR_IDEA.md`). No need to touch code for that.

For code changes, follow the conventions in [CLAUDE.md](./CLAUDE.md):
- Double quotes, no semicolons, 2-space indent
- Server Components by default — only `"use client"` when needed
- Run checks before pushing:

```bash
bun run lint
bun run typecheck
bun run format
```

### 4. Push and open a PR

```bash
git push origin feat/your-feature-name
```

Then open a Pull Request against `main` on GitHub.

**PR title format:** `feat: short description` / `fix: short description` / `spec: short description`

In the PR description, briefly explain:
- What does this do or propose?
- Why is it useful?
- Any open questions or things to discuss?

### 5. Wait for review

The codeowner will review and merge. Don't merge it yourself — even if it looks ready.

## Ideas & Specs

If you just have an idea and don't want to write code, the easiest path is:

1. Create a branch: `git checkout -b spec/your-idea`
2. Add a markdown file: `specs/YOUR_IDEA.md`
3. Open a PR — describe the idea in the PR body or the file itself

No code needed. Ideas are welcome.

## Local Setup

You'll need:
- [Bun](https://bun.sh/) runtime
- A `.env.local` file — ask @joaquinponzone for the required variables

```bash
bun install
bun run dev
```

See [CLAUDE.md](./CLAUDE.md) for all available commands.
