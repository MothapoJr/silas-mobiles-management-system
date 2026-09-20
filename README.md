# Silas Mobiles Management System

Booking, inventory, staff and invoicing platform for Silas Mobiles
(Silas Projects), a Pretoria-based mobile equipment rental and event
catering business. Built by **The Dev-Masters** for INSY7315 (Information
Systems 3E, WIL).

Full requirements, architecture rationale, and diagrams live in the Task 1
documentation — this repository is Task 2 (Code & Implementation): T08
onward on the WBS. Treat the Task 1 doc as the source of truth for *why*;
treat this repo as the source of truth for *how it's actually built*, and
flag it if the two ever disagree.

## Tech stack

| Layer | Technology |
|---|---|
| Front-end | React 19 + Vite + Tailwind CSS 4 |
| Back-end | Node.js 24 + Express |
| ORM / DB | Sequelize + pg → PostgreSQL 15 (AWS RDS) |
| Hosting | AWS: EC2 (ASG) + ALB, CloudFront, S3, Route 53 — see `infrastructure/terraform` |
| Auth | JWT (15-min access token, HttpOnly-cookie refresh) + RBAC *(T11, not yet built)* |
| CI/CD | GitHub Actions → AWS CodeDeploy (backend), S3 + CloudFront invalidation (frontend) |
| IaC | Terraform |

## Repository layout

```
backend/            Express API (Node.js 24)
frontend/            React 19 + Vite + Tailwind 4 SPA
infrastructure/terraform/   AWS infra as code — see its own README
.github/workflows/    CI (lint/test/build) and CD (deploy) pipelines
docker-compose.yml    Local dev: Postgres + backend in containers
CONTRIBUTING.md          Gitflow branching model, PR process, branch protection
```

## Local development

```bash
# Backend + database
cp backend/.env.example backend/.env
docker compose up --build

# Frontend, in a second terminal
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

Frontend: `http://localhost:5173` · Backend health check: `http://localhost:3000/health`

Running the backend outside Docker instead (`cd backend && npm install && npm run dev`)
works too — just make sure `DB_HOST=localhost` in `backend/.env` in that case,
not `postgres` (that hostname only resolves inside the Compose network).

## Where things stand (T08/T09 on the WBS)

- ✅ AWS infrastructure as Terraform — `infrastructure/terraform`
- ✅ Repo scaffold, Gitflow, CI (lint + test) and CD (deploy) pipelines
- ✅ Backend: Express app shell, health check, config/secrets loading, Sequelize wired but unused
- ✅ Frontend: Vite + Tailwind shell, branded placeholder, live backend health check
- ⏭️ **Next (T10):** PostgreSQL schema — Sequelize models + migrations for the entities in Section 9.1.9/9.1.11 of the Task 1 doc
- ⏭️ **After that (T11–T15):** Auth, Client, Admin, Staff, Notifications API modules
- ⏭️ **T16–T19:** the real front-end screens — this repo's `App.jsx` is a placeholder, not a design

See `CONTRIBUTING.md` for the branching model and `infrastructure/terraform/README.md`
for deployment, including the manual steps Terraform can't do for you
(domain delegation, SES production access, confirming the alarm email
subscription).
