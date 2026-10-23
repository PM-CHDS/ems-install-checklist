# EMS Checklist — notes for agents

Web app for filling EnergoStation EMS installation and commissioning checklists on
site. The checklist itself is data, not code: `checklists/rtu-ems/` holds markdown +
YAML that is compiled and validated at build time. Start there before changing form
behaviour.

- [README.md](README.md) — what the app does and how to run it
- [MEMORY.md](MEMORY.md) — architecture, decisions, and the non-obvious traps
- [docs/AUTHORING.md](docs/AUTHORING.md) — editing a checklist; field keys, gating, versioning
- [docs/DEPLOY.md](docs/DEPLOY.md) — self-hosting

Three rules worth knowing before you touch anything:

- **Never rename a field `id`** in a published checklist — answers are stored against it.
- **Don't bump `version` in `checklist.yaml`** without being asked; it's the checklist
  owner's call.
- **No comprehensive testing unless explicitly asked** — no full e2e suite, no full
  example fill. Verify just the change you made (compile/typecheck plus a targeted
  check), and say what you did and didn't test.

## Agent skills

### Issue tracker

Issues live as markdown files under `.scratch/<feature>/` in this repo — there is no
git remote. See `docs/agents/issue-tracker.md`.

### Triage labels

The five canonical triage roles, each label string equal to its name. See
`docs/agents/triage-labels.md`.

### Domain docs

Single-context: `CONTEXT.md` and `docs/adr/` at the repo root. See
`docs/agents/domain.md`.
