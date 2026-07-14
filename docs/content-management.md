# Content Management

All portfolio content — bio, projects, experience, and skills — is managed through the Strapi CMS admin at `/cms/admin`.

## Accessing the admin panel

Navigate to `https://yourdomain.com/cms/admin` (or `http://localhost/cms/admin` locally).

Strapi manages its own admin accounts and authentication — there is no shared `ADMIN_PASSWORD`. On first run, visiting `/cms/admin` walks you through creating an admin account; on subsequent visits, log in with that account's email and password. Additional admin accounts can be invited from within the panel (Settings → Administration Panel → Users).

## Publishing changes

**Important**: the frontend is a static build. Changes saved in Strapi are stored immediately, but they won't appear on the live site until the frontend is rebuilt.

### Local development

Re-run the fetch script, then restart the Vite dev server:
```bash
cd frontend
STRAPI_URL=http://localhost:1337 STRAPI_API_TOKEN=<your-token> node scripts/fetch-content.mjs
cd .. && make dev-frontend
```

The script reads `STRAPI_URL`/`STRAPI_API_TOKEN` straight from the process environment, not `.env` — see [development.md](development.md) for the full local setup.

### Production (Docker)

```bash
make rebuild-content
```

This re-fetches content from Strapi's REST API and produces a new static build. nginx picks it up automatically since it serves the shared build output directly.

## Bio

The bio section is a Strapi **single type** (one entry, not a list). It appears throughout the site and drives the AI chat persona.

| Field | Where it appears |
|---|---|
| Full Name | Navbar label + image alt text, loading screen |
| Nick Name | Landing hero greeting, AI chat persona name and greeting |
| Title | Landing hero subtitle, loading screen subtitle, AI chat persona profession |
| Headline | Collected but not currently rendered anywhere on the site |
| Description | About section body text, AI chat persona "About" line |
| Location | Contact section, AI chat persona (only mentioned if set) |
| Email | Contact section (mailto link) |
| GitHub / LinkedIn | Navbar and Contact section links |
| Twitter / Facebook / Instagram (optional) | Contact section social links — link is omitted entirely if left blank |
| Photo | Navbar avatar, chess game opponent avatar on `/play` |

The AI system prompt (`frontend/src/pages/Play.tsx`) is built from **Nick Name**, **Title**, **Location**, **Description**, and the first 3 project titles. Update bio content to change what the AI says about itself.

## Projects

Projects appear on the `/myworks` page and the first 3 appear in the AI chat persona.

| Field | Notes |
|---|---|
| Title | Project name |
| Category | e.g. "Data Engineering", "Web App" |
| Technologies | Comma-separated string |
| Image | Upload via the image picker or paste a URL |
| Description | Shown on project card |
| Order | Lower number = appears first |

### Uploading images

Use Strapi's built-in Media Library (the image field in the project editor). Uploaded files are stored by Strapi and served through nginx at `/uploads/filename` (proxied to Strapi, not a shared Docker volume mount). Upload size is capped by nginx's `client_max_body_size 50m` on the `/cms/*` proxy, in addition to any limit configured in Strapi itself.

## Experience

Career history. Appears on the home page in the Career section.

| Field | Notes |
|---|---|
| Position | Job title |
| Company | Employer name |
| Period | e.g. "Jan 2022 – Present" |
| Location | e.g. "Jakarta, Indonesia" |
| Description | Role summary |
| Responsibilities | JSON array of strings, e.g. `["Led the migration", "Mentored two engineers"]` |
| Technologies | JSON array of strings, e.g. `["TypeScript", "PostgreSQL"]` |
| Order | Lower number = appears first (most recent first recommended) |

Responsibilities and Technologies are Strapi `json` fields — the admin UI presents a raw JSON editor for them, not a line-per-item text box.

## Skills

Skills appear in the Tech Stack section, grouped by category.

| Field | Notes |
|---|---|
| Category | e.g. "Languages", "Frameworks", "Tools" |
| Name | Skill name |
| Order | Display order within category |

Skills from all rows with the same `category` value are grouped automatically.

## How content flows into the frontend

```
Strapi admin (/cms/admin) → Strapi REST API → Strapi's own PostgreSQL database
                                       ↓
                          scripts/fetch-content.mjs
                          (runs at next Docker build, via Bearer STRAPI_API_TOKEN)
                                       ↓
                          src/data/content.json
                                       ↓
                          Vite bundles into JS
                                       ↓
                          nginx serves static site
```

The `content.json` schema, from `frontend/src/data/types.ts` (this is what `fetch-content.mjs` writes — media fields are flattened from Strapi's response down to a plain URL string):

```typescript
interface Bio {
  id: number
  fullName: string
  nickName: string
  title: string
  headline: string
  description: string
  location: string
  email: string
  github: string
  linkedin: string
  twitter: string | null
  facebook: string | null
  instagram: string | null
  photo: string | null
  updatedAt: string
}

interface Project {
  id: number
  title: string
  category: string
  technologies: string
  image: string | null
  description: string
  order: number
  updatedAt: string
}

interface Experience {
  id: number
  position: string
  company: string
  period: string
  location: string
  description: string
  responsibilities: string[]
  technologies: string[]
  order: number
}

type SkillsByCategory = Record<string, string[]>

interface SiteContent {
  bio: Bio | null
  projects: Project[]
  experience: Experience[]
  skillsByCategory: SkillsByCategory
}
```

## AI chat persona

The AI chat on the `/play` page impersonates the portfolio owner. The persona is built at page load from the baked `content.json`. To change what the AI says:

1. Update the bio fields (especially Description and Nick Name) in the Strapi admin
2. Rebuild the frontend (`make rebuild-content`)

The system prompt instructs the AI to:
- Respond in first person as the portfolio owner
- Never admit to being an AI
- Reference actual projects and experience from the content
- Keep responses conversational and friendly
