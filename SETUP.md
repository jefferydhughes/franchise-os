# FranchiseOS — Setup Guide

## Prerequisites

- Node.js 18+ and npm
- A Supabase project (free tier works)
- A Clerk application (free tier works)
- An Anthropic API key (for Claude)
- Vercel account (for deployment)

---

## 1. Environment Variables

Copy `dashboard-app/.env.local.example` to `dashboard-app/.env.local` and fill in all values.

| Variable | Where to get it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API → `anon` `public` key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Settings → API → `service_role` key (keep secret!) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk Dashboard → API Keys → Publishable key |
| `CLERK_SECRET_KEY` | Clerk Dashboard → API Keys → Secret key |
| `CLERK_WEBHOOK_SECRET` | Clerk Dashboard → Webhooks → Create endpoint → Signing secret |
| `ANTHROPIC_API_KEY` | console.anthropic.com → API Keys |
| `OPENAI_API_KEY` | platform.openai.com → API Keys (for embeddings) |
| `TWILIO_ACCOUNT_SID` | Twilio Console → Account SID |
| `TWILIO_AUTH_TOKEN` | Twilio Console → Auth Token |
| `TWILIO_PHONE_NUMBER` | Twilio Console → Phone Numbers (E.164 format: +1xxxxxxxxxx) |

For the swarm scripts (`start-swarm.ts`, `bootstrap-brand.ts`), set these as shell environment variables or create a `.env` file in the project root.

---

## 2. Supabase Schema

Run the full schema in Supabase SQL Editor:

1. Go to your Supabase Dashboard → SQL Editor
2. Open `architecture/supabase-schema.sql`
3. Run the entire file

This creates:
- 8 tables: `brands`, `territories`, `franchisees`, `leads`, `initiatives`, `agent_events`, `memory_entries`, `campaigns`
- pgvector extension for 1536-dimension embeddings
- `match_memories()` RPC function for vector similarity search
- `update_updated_at()` triggers on all tables
- Row Level Security (RLS) policies using Clerk org_id from JWT
- Seed data: Skill Samurai brand + 3 territories (Dallas, Phoenix, Tampa)

---

## 3. Bootstrap a New Brand

```bash
# From the project root:
export SUPABASE_URL=https://eggucsttihoxhxaaeiph.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=your-key-here

npx tsx scripts/bootstrap-brand.ts --brand=skill-samurai --name="Skill Samurai"
```

This creates:
- A `brands/{slug}/` directory with 6 template config files
- A brand record in the `brands` table
- An example territory in the `territories` table
- An initialization event in `agent_events`

---

## 4. Start the Agent Swarm

```bash
# From the project root:
export SUPABASE_URL=https://eggucsttihoxhxaaeiph.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=your-key-here

npx tsx scripts/start-swarm.ts --brand=skill-samurai
```

The swarm controller will:
- Load all 20 agent definitions from `swarm/agents/`
- Load 36 dispatch rules from `swarm/dispatch-rules.json`
- Resolve the brand slug to a UUID via Supabase
- Poll `agent_events` every 5 seconds for pending events
- Dispatch matching events to the appropriate agent

Press `Ctrl+C` for graceful shutdown.

---

## 5. Run the Dashboard Locally

```bash
cd dashboard-app
cp .env.local.example .env.local
# Fill in your secrets in .env.local

npm install
npm run dev
```

Open http://localhost:3000 to see the War Room dashboard.

---

## 6. Deploy to Vercel

The dashboard is deployed at:
- **Production:** https://dashboard-app-five-steel.vercel.app
- **Inspect:** https://vercel.com/jeffs-projects-3a93e6bd/dashboard-app

### Add Environment Variables in Vercel

Go to Vercel Dashboard → dashboard-app → Settings → Environment Variables and add all variables from `.env.local`.

### Add Custom Domains

#### zorspace.io (Primary domain)

1. Vercel Dashboard → dashboard-app → Settings → Domains
2. Add `zorspace.io`
3. Vercel will provide DNS records — add them at your domain registrar:
   - `A` record: `76.76.21.21`
   - Or `CNAME`: `cname.vercel-dns.com`
4. Add `www.zorspace.io` as a redirect to `zorspace.io`

#### os.skillsamurai.com (Skill Samurai instance)

1. Vercel Dashboard → dashboard-app → Settings → Domains
2. Add `os.skillsamurai.com`
3. At the skillsamurai.com DNS provider, add:
   - `CNAME` record: `os` → `cname.vercel-dns.com`
4. Vercel will auto-provision an SSL certificate

### Configure Clerk for Custom Domains

1. Clerk Dashboard → Domains → Add domain
2. Add `zorspace.io` and `os.skillsamurai.com`
3. Update `NEXT_PUBLIC_CLERK_DOMAIN` in Vercel env vars if needed

---

## 7. Configure Clerk Webhooks

1. Clerk Dashboard → Webhooks → Add Endpoint
2. URL: `https://zorspace.io/api/webhooks/clerk` (or your Vercel URL)
3. Events to subscribe:
   - `organization.created`
   - `organization.updated`
   - `organizationMembership.created`
4. Copy the Signing Secret → set as `CLERK_WEBHOOK_SECRET` in Vercel

---

## Project Structure

```
franchise-os/
├── architecture/          # Schema, specs, layer docs
├── brand-engine/          # Brand loader, config validator, onboarding
├── brands/example-brand/  # Skill Samurai brand config
├── dashboard-app/         # Next.js 16 War Room dashboard
│   └── src/
│       ├── app/           # Pages, layouts, API routes
│       ├── components/    # War Room widgets, layout
│       ├── lib/           # Supabase, Claude, model router
│       └── types/         # Shared TypeScript interfaces
├── expansion-radar/       # Opportunity signal detection
├── memory/                # pgvector memory system (9 layers)
├── messaging/             # Slack, SMS, WhatsApp gateways
├── scripts/               # start-swarm, bootstrap-brand
├── swarm/                 # 20 agent definitions, dispatch rules
│   ├── agents/            # Agent .md files (YAML frontmatter)
│   └── dispatch-rules.json
└── territory-engine/      # Territory scoring (5 dimensions)
```

---

## Model Tiers

| Tier | Model | Use Case |
|---|---|---|
| Strategic | claude-opus-4-5-20250918 | CEO/CRO decisions, market analysis |
| Operational | claude-sonnet-4-5-20250514 | Department agents, pipeline management |
| Worker | claude-haiku-4-5-20251001 | Content generation, reports, emails |
