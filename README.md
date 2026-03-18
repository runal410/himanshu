# DMA Playbook & Tool — Premapped IRO Catalogue

Production-oriented multi-tenant DMA platform monorepo using pnpm workspaces.

## Apps
- `apps/web`: React + Vite + TanStack Router/Query + Tailwind + Chart.js
- `apps/api`: NestJS-style modular API with Prisma schema, OpenAPI config, RBAC, audit logging, exports job scaffolding
- `packages/shared`: shared types, scoring formulas, zod schemas, sector catalog seed generation
- `infra/docker`: local development stack for Postgres, Redis, MinIO, reverse proxy

## Quick start
```bash
pnpm i && docker compose -f infra/docker/compose.yml up -d && pnpm -w dev
```

- Web: `http://localhost:5173`
- API: `http://localhost:3000`
- OpenAPI docs: `http://localhost:3000/api/docs`

## Notes
This repository includes realistic sector/IRO seed generation (11 sectors x 30 IROs = 330 rows), demo stakeholder data, multi-tenant scoping, configurable scoring formulas, matrix quadrant classification, export job scaffolding, and auditable mutation patterns.
