---
name: update-specs
description: Update IDEA.md and SPECS.md checklists and technical spec to reflect the current state of the codebase
disable-model-invocation: true
allowed-tools: Read, Glob, Grep, Edit, Write, Bash, Agent
---

Update project specs to reflect the current state of the codebase.

## Context

- Feature checklist: `specs/IDEA.md`
- Full technical spec: `specs/SPECS.md`
- Database schema: `src/server/db/schema.ts`
- Cron config: `vercel.json`

## Steps

1. Read the current `specs/IDEA.md` and `specs/SPECS.md`
2. Explore the codebase to understand what's currently implemented:
   - Pages and routes in `src/app/`
   - Database schema in `src/server/db/schema.ts`
   - API integrations in `src/lib/`
   - Cron jobs in `src/app/api/cron/` and `vercel.json`
   - Components in `src/components/`
3. Update `specs/IDEA.md`:
   - Check off `[x]` features that are fully implemented
   - Keep `[ ]` for features not yet built
   - Add any new features that were built but not originally listed
   - Update Future Enhancements if any were completed or new ones identified
4. Update `specs/SPECS.md`:
   - Update phase statuses (DONE / IN PROGRESS)
   - Check off completed items in implementation sequence
   - Update data model tables if schema changed (compare with `src/server/db/schema.ts`)
   - Update file structure tree to match reality
   - Update cron configuration to match `vercel.json`
   - Add any new env variables, pages, or integrations
   - Keep "Next Up" section current with prioritized work items
5. Do NOT invent features — only document what exists in code or is explicitly planned in IDEA.md
6. Show a brief summary of what changed in each file
