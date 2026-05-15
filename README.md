# robware

Breathtaking apps for web and other platforms.

## robware Poster (v0)

The first robware app: a free, single-page tool that turns a short sentence into a beautifully-typeset poster you can download. Editorial typography, four hand-tuned looks, three social aspects. Pure client-side — your text never leaves the browser. No account, no upload, no fuss.

- **Live:** <https://marvbuster.github.io/robware/>
- **Source:** `apps/web/`
- **What it does:** type a sentence, pick a style (Editorial · Monolith · Salon · Vapor) and an aspect (1:1 · 4:5 · 9:16), download a PNG at full social resolution.
- **Shareable looks:** `?preset=monolith&aspect=story` etc.

## Repo layout

```
robware/
  apps/
    web/                # Vite + React + TypeScript SPA — the Poster app
  packages/             # shared libraries (empty until >=2 apps share)
  .github/workflows/    # CI + GitHub Pages deploy
```

## Prerequisites

- Node 20+
- npm 10+ (ships with Node 20)

## Quick start

```bash
git clone git@github.com:Marvbuster/robware.git
cd robware
npm install
npm run dev
```

The dev server runs at <http://localhost:5173>.

## Common commands

All run from the repo root.

| Command             | What it does                          |
| ------------------- | ------------------------------------- |
| `npm run dev`       | Start the web dev server (HMR).       |
| `npm run build`     | Build the web app to `apps/web/dist`. |
| `npm run preview`   | Serve the built bundle locally.       |
| `npm test`          | Run Vitest in all workspaces.         |
| `npm run typecheck` | TypeScript check across workspaces.   |
| `npm run lint`      | ESLint across workspaces.             |
| `npm run format`    | Prettier-format the whole repo.       |

## Deploy

`main` deploys automatically to GitHub Pages via `.github/workflows/deploy.yml`. The live URL is published in the workflow run output and pinned at the top of this README.

## Engineering standards

See the foundation decision doc on Paperclip issue [ROB-3](/ROB/issues/ROB-3#document-plan).

- Trunk-based development. `main` is always deployable.
- Short-lived feature branches, small PRs, squash merge.
- Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `ci:` …).
- CI gates: typecheck, lint, test, build.
