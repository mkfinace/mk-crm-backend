# MK Finance — Car CRM Backend

NestJS + Prisma + PostgreSQL backend for the New Car Website + Dealer + Finance CRM.
See `/CLAUDE.md` (in the main site repo) for the full specification this implements.

## Local development
```
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run start:dev
```
API runs on http://localhost:4000 — Swagger docs at http://localhost:4000/api-docs

## Deploy (Render + Neon)
1. Create a free Neon Postgres project at neon.tech — copy the connection string.
2. In `prisma/schema.prisma`, change `provider = "sqlite"` to `provider = "postgresql"`.
3. On Render: New → Web Service → connect this repo.
   - Build Command: `npm install && npx prisma generate && npx prisma migrate deploy`
   - Start Command: `npm run start:prod`
   - Environment Variables: `DATABASE_URL` = your Neon connection string, `JWT_SECRET` = a long random string, `PORT` = 4000
