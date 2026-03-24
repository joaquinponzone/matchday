---
name: update-worklog
description: Create or update today's worklog entry with commits and work summary
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Bash, Glob
argument-hint: [optional-date-YYYYMMDD]
---

Update the daily worklog with today's work (or a specific date if provided).

## Context

- Worklog directory: `specs/worklog/`
- Git history: !`git log --oneline --since="7 days ago" --format="%h %ad %s" --date=short`

## Steps

1. Determine the target date:
   - Use `$ARGUMENTS` if a date was provided (format: YYYYMMDD)
   - Otherwise use today's date
2. Get commits for that date: `git log --oneline --after="YYYY-MM-DDT00:00:00" --before="YYYY-MM-DDT23:59:59"`
3. Read the existing worklog file at `specs/worklog/YYYYMMDD-chores.md` if it exists
4. Create or update the worklog file with this structure:

```markdown
# YYYY-MM-DD — {Brief summary of the day's theme}

## Commits

- `{hash}` {commit message}
- ...

## Work Done

### {Category} (e.g. "UI", "Backend", "Database", "Integrations", "Infra", "Docs")
- Bullet points describing what was built/changed

## Pending
- Items started but not finished
```

5. Group work into logical categories, not one bullet per commit
6. Be specific — mention pages, endpoints, components, tables by name
7. If updating an existing worklog, merge new commits and work items without duplicating
8. If no commits exist for the target date, inform the user instead of creating an empty file
