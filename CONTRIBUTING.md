# Contributing to TheLaaw

## Team Roles

| Role | Lane |
|---|---|
| AI Lead | `backend/agents/`, `backend/tools/`, `statutes/` |
| Integration Lead | `backend/main.py`, `backend/orchestrator.py`, `backend/tools/` |
| Frontend Lead | `frontend/src/components/`, `frontend/src/app/` |
| Polish + Demo | `frontend/src/components/`, `statutes/`, slides |

Stay in your lane. Cross-lane changes need a heads-up in chat first.

---

## Commit Rules

### Format

```
<type>(<scope>): <short description>
```

**Types:**

| Type | When to use |
|---|---|
| `feat` | New feature or agent |
| `fix` | Bug fix |
| `wip` | Work in progress — not broken, not done |
| `wire` | Connecting two parts together (e.g. agent to API) |
| `style` | UI/CSS only, no logic change |
| `chore` | Config, deps, tooling |
| `data` | Statute files, vector DB indexing |

**Scopes:** `intake`, `research`, `reasoning`, `drafting`, `escalation`, `orchestrator`, `api`, `chat-ui`, `pdf`, `voice`, `auth`, `deploy`

### Examples

```
feat(intake): add pidgin language detection
fix(reasoning): handle empty citations from research agent
wire(orchestrator): connect drafting agent output to pdf generator
style(chat-ui): WhatsApp bubble layout and colors
data(statutes): chunk Lagos Tenancy Law 2011 into vector DB
wip(voice): YarnGPT transcription endpoint, not yet wired
chore: add chromadb to requirements.txt
```

### Rules

- **One concern per commit.** Don't bundle agent work with UI fixes.
- **`wip` commits are allowed** — push often so teammates aren't blocked.
- **Never commit `.env`** — it's gitignored. Share keys out of band.
- **Never commit generated PDFs** — gitignored.
- **Feature lock at hour 10** — after that, `fix` commits only.

---

## Branch Strategy

```
main          ← stable, demo-ready at all times
├── ai/       ← AI Lead's branch (agents, vector DB)
├── api/      ← Integration Lead's branch (backend wiring)
└── ui/       ← Frontend branches
```

Branch naming: `ai/intake-agent`, `api/orchestrator`, `ui/chat-bubbles`

Merge to `main` only when your piece works end-to-end. Don't merge broken code to `main` — judges may clone the repo.

## PRs

Keep PRs small and scoped to one thing. Title follows the same commit format. No approval needed during the hackathon — just don't merge while a teammate is mid-work on the same file.

## Feature Lock

**Hour 10 = feature lock.** After that:
- No new branches
- `fix` commits only on `main`
- Integration Lead owns the final merge
