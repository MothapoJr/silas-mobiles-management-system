# Public deployment (EXPO URL)

Stack: Vercel (React build) -> rewrite /api/* -> Render (Express API) -> Neon (PostgreSQL).
The browser only ever talks to the Vercel domain, so the HttpOnly refresh cookie stays first-party.

## 1. Database (Neon)
1. Create a Neon project (region closest to you), copy the connection details.
2. From your machine, in `backend/`, set the same DB_* variables your `.env.example` lists,
   pointing at Neon (SSL required), then:
       npm run db:migrate
       npm run db:seed

## 2. API (Render)
- New Web Service -> connect the repo, Root Directory `backend`, Runtime Node.
- Build command: `npm ci`   Start command: `npm start`   Health check path: `/health`
- Environment variables: every key in `backend/.env.example`, plus
    NODE_ENV=production
    JWT secrets = long random values (never the dev ones):
      node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
    CORS / allowed origin = your Vercel URL (https://<project>.vercel.app)
- Needs in code (verify): `app.set('trust proxy', 1)`, DB SSL option for Neon,
  refresh cookie `secure: true` in production.

## 3. Frontend (Vercel)
- Import the repo, Root Directory `frontend`, framework preset Vite.
- Environment variable: `VITE_API_BASE_URL=/api`
- Edit `frontend/vercel.json`: replace the Render hostname, commit, push.

## 4. Keep it awake for the demo
Render free services sleep after 15 min idle (~1 min cold start).
Ping `https://<render-service>/health` every 5 min with UptimeRobot, and open the site 10 min before judging.

## 5. After the EXPO
Seed users share a known password (Demo123!). Rotate or delete them once marking is done.
