# Dream Maintenance Guide

Use the `dream-continuous-maintainer` subagent for ongoing maintenance, test/build verification, dependency-aware updates, GitHub reference checks, and encoding-sensitive changes.

## Required Checks

Before committing code changes:

- Run `git status --short --branch`.
- Run `npm test`.
- Run `npm run build` for frontend or build-related changes.
- For Chinese text, README, UI copy, or encoding fixes, scan edited files for common mojibake markers and replacement characters.
- Commit only intentional files.

## Repository Rules

- Do not commit `.claude/settings*.json`; these files are machine-local permission state.
- Do not commit `dev-server*.log`, `dist/`, `.venv/`, `node_modules/`, or generated local artifacts.
- `.claude/agents/*.md` files are project-level Claude Code subagents and may be committed when useful.
- Keep React/Vite changes consistent with existing project style.
- Prefer shared helpers plus `src/*.test.mjs` tests for reusable workflow logic.
- Never revert user changes unless explicitly asked.

## External Research

When referencing current GitHub projects or external docs:

- Prefer official documentation first.
- Prefer active, maintained GitHub repositories with recent commits and clear examples.
- Adapt small, relevant patterns instead of copying large chunks of code.
- Explain the reference and verification result before broad dependency or architecture changes.

