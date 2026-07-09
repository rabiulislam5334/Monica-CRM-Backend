# Monica CRM – Favorite & Notes Feature (Node.js Reimplementation)

Backend Intern Assignment submission for **Envobyte Ltd.**

> **Note on tech stack:** The original assignment targets the Monica CRM
> (Laravel/PHP/MySQL) codebase. Per the hiring team's update email
> (deadline extended to 11:59 PM, 09 July 2026), candidates unfamiliar with
> PHP/Laravel may implement the same requirements using another stack. This
> submission is built with **Node.js, Express, PostgreSQL (via Supabase),
> and Prisma ORM**, reproducing Monica's Contact model and implementing the
> Favorite & Notes feature as a standalone API with equivalent behavior and
> evaluation criteria (setup, DB changes, endpoints, search/filter, stats,
> tests).

## Tech Stack

- **Node.js + Express 5** – REST API
- **PostgreSQL (hosted on Supabase) + Prisma ORM 7** – database & migrations
- **@prisma/adapter-pg + pg** – Prisma 7 driver adapter (required to connect to Supabase's connection pooler)
- **JWT (jsonwebtoken) + bcryptjs** – authentication
- **Zod** – request validation
- **Jest + Supertest** – feature tests

## Database: Supabase (PostgreSQL)

This project uses [Supabase](https://supabase.com) as a managed PostgreSQL host.

1. Create a free project at supabase.com.
2. Go to **Project Settings → Database → Connection string** and copy the
   **Connection pooler** URI (port `5432`, transaction mode).
3. Paste it into `.env` as `DATABASE_URL`.

### ⚠️ Important: do not add `sslmode=require` to the connection string

Recent versions of `pg` treat `sslmode=require` in the connection string as
an alias for `verify-full`, which fails with
`self-signed certificate in certificate chain` against Supabase's pooler
certificate. SSL is instead handled explicitly in code
(`src/config/prisma.js` and `prisma/seed.js` pass `ssl: { rejectUnauthorized: false }`
to the `pg.Pool`), so the connection string should be used **without** a
`sslmode` query parameter:

```env
# Correct
DATABASE_URL="postgresql://postgres.xxxx:PASSWORD@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"

# Avoid — causes a TLS certificate error
DATABASE_URL="postgresql://postgres.xxxx:PASSWORD@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres?sslmode=require"
```

If your password contains special characters (`@`, `#`, `%`, etc.), URL-encode
them (e.g. `@` → `%40`).

### Why a driver adapter (`@prisma/adapter-pg`) is used

Prisma 7 requires an explicit driver adapter instead of its previous
built-in query engine binary. `src/config/prisma.js` and `prisma/seed.js`
both create a `pg.Pool` wrapped in `PrismaPg`, and pass that adapter into
`new PrismaClient({ adapter })`.

## Project Structure

src/
app.js # Express app (routes, middleware)
server.js # Entry point
config/prisma.js # Prisma client (pg driver adapter, Supabase-ready)
controllers/ # authController, contactController
routes/ # authRoutes, contactRoutes
middlewares/ # auth (JWT), errorHandler
utils/response.js # consistent JSON response envelope
validators/validators.js # zod schemas + validation middleware
prisma/
schema.prisma # User + Contact models
migrations/ # SQL migration history
seed.js # Default test data (Supabase-aware)
tests/
contact.test.js # Feature tests (mocked Prisma client)
prisma.config.ts # Prisma CLI config (loads .env)

## Setup Instructions

1. **Clone this repository**

```bash
   git clone <this-repo-url>
   cd monica-crm-backend-node
   npm install
```

2. **Create a Supabase project** and get the pooler connection string (see
   [Database: Supabase](#database-supabase-postgresql) above).

3. **Configure environment variables**

```bash
   cp .env.example .env
```

Set in `.env`:

```env
   DATABASE_URL="postgresql://<user>:<password>@<supabase-pooler-host>:5432/postgres"
   JWT_SECRET="a-long-random-secret"
   JWT_EXPIRES_IN="7d"
   PORT=5000
   NODE_ENV=development
```

4. **Run migrations**

```bash
   npx prisma migrate dev --name init
```

Creates the `users` and `contacts` tables, including `is_favorite`
(boolean, default false) and `personal_note` (nullable text) on
`contacts`.

5. **Seed default test data**

```bash
   npm run prisma:seed
```

Creates a demo user (`test@example.com` / `password123`) and 5 sample
contacts (some favorited, some with notes) — equivalent to Monica's
`php artisan db:seed`.

6. **Run the server**

```bash
   npm run dev      # development (nodemon)
   npm start        # production
```

Server runs on `http://localhost:5000`. Health check: `GET /api/health`.

7. **Run tests**

```bash
   npm test
```

## Branch

All work for this assignment is on the `envobyte-intern-assignment` branch.

## API Endpoints

All `/api/contacts/*` routes require `Authorization: Bearer <token>`
(obtained via `POST /api/auth/login`).

| Method | Endpoint                     | Description                                            |
| ------ | ---------------------------- | ------------------------------------------------------ |
| POST   | `/api/auth/register`         | Register a new user                                    |
| POST   | `/api/auth/login`            | Login, returns JWT                                     |
| GET    | `/api/contacts`              | List contacts (pagination, sort, `favorite`, `search`) |
| GET    | `/api/contacts/favorites`    | List favorite contacts                                 |
| GET    | `/api/contacts/stats`        | Summary statistics                                     |
| GET    | `/api/contacts/:id`          | Get single contact (includes new fields)               |
| POST   | `/api/contacts/:id/favorite` | Mark favorite                                          |
| DELETE | `/api/contacts/:id/favorite` | Remove favorite                                        |
| PATCH  | `/api/contacts/:id/favorite` | Toggle favorite status                                 |
| PUT    | `/api/contacts/:id/note`     | Update personal note                                   |

### Search & Filtering

GET /api/contacts?favorite=1
GET /api/contacts?search=john
GET /api/contacts?favorite=1&search=john
GET /api/contacts?page=2&limit=10&sort=first_name&order=asc

Filtering, search, and pagination share one Prisma query builder
(`buildContactWhere`) reused by both the main listing endpoint and
`/favorites`, so query logic is not duplicated.

### Response Format

```json
// success
{ "success": true, "data": { ... }, "meta": { "page": 1, "limit": 20, "total": 125, "totalPages": 7 } }

// error
{ "success": false, "message": "Contact not found" }
```

### Stats Response

```json
{
  "success": true,
  "data": {
    "total_contacts": 125,
    "favorite_contacts": 18,
    "contacts_with_notes": 42
  }
}
```

Computed with three parallel `COUNT` queries scoped to the authenticated
user — no contacts are loaded into memory.

## Implementation Approach

- **Ownership scoping:** every contact query is scoped to `req.user.id`
  (from the JWT), so users can only see/modify their own contacts.
- **Toggle vs mark/remove:** `PATCH` flips the current `isFavorite` value;
  `POST`/`DELETE` set it explicitly. All three reuse the same
  ownership-check helper (`ensureOwnedContact`).
- **Validation:** Zod schemas validate both request bodies and list query
  params, rejecting malformed input with `422` before it reaches the
  database layer.
- **Route ordering:** `/favorites` and `/stats` are registered before the
  dynamic `/:id` route so Express doesn't mistake them for an id param.
- **Error handling:** centralized middleware maps Prisma error codes
  (`P2025` not found, `P2002` unique constraint) to proper HTTP statuses.
- **Testing strategy:** feature tests mock the Prisma client directly
  (instead of requiring a live database), covering marking a contact
  favorite, updating a personal note, and filtering by `favorite=1`.

## Assumptions

- "Authenticated user's contacts" is modeled as a simple `User → Contact`
  ownership relationship, since this standalone reimplementation doesn't
  include Monica's full multi-account structure.
- Search matches `first_name`, `last_name`, and `email` (case-insensitive
  partial match).
- Minimal `POST /api/auth/register` and `/login` endpoints were added
  since the assignment requires an "authenticated user" but this
  standalone project has no pre-existing auth system to reuse.

## Limitations / Trade-offs

- Focused reimplementation of the Contact + Favorite/Notes module, not a
  full port of Monica CRM (activities, reminders, tags, etc. are out of
  scope).
- No rate limiting / refresh-token rotation — out of scope for this
  assignment.
- Tests use a mocked Prisma client rather than a live/ephemeral test
  database, keeping the suite fast and dependency-free.

## Deployment (optional)

Not required by the assignment, but deploys cleanly as:

- **Database:** Supabase (already used for local dev too).
- **App hosting:** Render/Railway — run `npx prisma migrate deploy` then
  `npm start`, with the same `DATABASE_URL` (without `sslmode=require`)
  and `JWT_SECRET` set as environment variables.

## Estimated Time Spent

~5-7 hours (setup, schema/migrations, Supabase/SSL troubleshooting, auth,
endpoints, search/filter/stats, tests, README).
