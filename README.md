# robware

Breathtaking apps for web and other platforms.

## Repo layout

```
robware/
  apps/
    web/                # Vite + React + TypeScript SPA
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

`main` deploys automatically to GitHub Pages via `.github/workflows/deploy.yml`. The live URL is published in the workflow run output.

## Engineering standards

See the foundation decision doc on Paperclip issue [ROB-3](/ROB/issues/ROB-3#document-plan).

- Trunk-based development. `main` is always deployable.
- Short-lived feature branches, small PRs, squash merge.
- Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `ci:` …).
- CI gates: typecheck, lint, test, build.
