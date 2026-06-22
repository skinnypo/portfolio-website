# Content Management

All portfolio content — bio, projects, experience, and skills — is managed through the Admin panel at `/admin`.

## Accessing the admin panel

Navigate to `https://yourdomain.com/admin` (or `http://localhost/admin` locally).

Log in with the `ADMIN_PASSWORD` value from your `.env` file.

The session token is stored in `localStorage` and expires after 24 hours.

## Publishing changes

**Important**: the frontend is a static build. Changes saved in the admin panel are stored in the database immediately, but they won't appear on the live site until the frontend is rebuilt.

### Local development

Restart the Vite dev server — it fetches content on startup:
```bash
cd frontend && node scripts/fetch-content.mjs
# then restart: make dev-frontend
```

### Production (Docker)

```bash
docker compose up frontend-builder --build
```

This re-fetches content from the database and produces a new static build. nginx picks it up automatically from the shared volume.

## Bio

The bio section appears on the home page and drives the AI chat persona.

| Field | Where it appears |
|---|---|
| Name | Page title, hero section, AI chat greeting |
| Title | Hero section, page subtitle |
| Description | Hero section tagline |
| About Description | About section, AI chat persona |
| Location | About section, AI chat persona |
| Email | Contact section |
| GitHub / LinkedIn / Twitter | Social icons |
| Photo | Chess game opponent avatar |

The AI system prompt is built from name, title, location, about description, and the first 3 project titles. Update bio content to change what the AI says about itself.

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

Use the image upload button in the project editor. Images are stored in the `uploads` Docker volume and served by nginx at `/uploads/filename`. Max file size: 2 MB.

## Experience

Career history. Appears on the home page in the Career section.

| Field | Notes |
|---|---|
| Position | Job title |
| Company | Employer name |
| Period | e.g. "Jan 2022 – Present" |
| Location | e.g. "Jakarta, Indonesia" |
| Description | Role summary |
| Responsibilities | One per line (stored as array) |
| Technologies | One per line (stored as array) |
| Order | Lower number = appears first (most recent first recommended) |

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
Admin panel → PUT /api/admin/bio → PostgreSQL
                                       ↓
                          scripts/fetch-content.mjs
                          (runs at next Docker build)
                                       ↓
                          src/data/content.json
                                       ↓
                          Vite bundles into JS
                                       ↓
                          nginx serves static site
```

The `content.json` schema:

```typescript
interface SiteContent {
  bio: {
    name: string
    title: string
    description: string
    aboutDescription: string
    location: string
    email: string
    github: string
    linkedin: string
    twitter?: string | null
    facebook?: string | null
    instagram?: string | null
    photo?: string | null
  } | null
  projects: Array<{
    id: number
    title: string
    category: string
    technologies: string
    image?: string | null
    description: string
    order: number
  }>
  experience: Array<{
    id: number
    position: string
    company: string
    period: string
    location: string
    description: string
    responsibilities: string[]
    technologies: string[]
    order: number
  }>
  skillsByCategory: Record<string, string[]>
}
```

## AI chat persona

The AI chat on the `/play` page impersonates the portfolio owner. The persona is built at page load from the baked `content.json`. To change what the AI says:

1. Update the bio fields (especially About Description and Name) in the admin panel
2. Rebuild the frontend (`docker compose up frontend-builder --build`)

The system prompt instructs the AI to:
- Respond in first person as the portfolio owner
- Never admit to being an AI
- Reference actual projects and experience from the content
- Keep responses conversational and friendly
