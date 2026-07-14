# API Reference

Base URL (production): `https://yourdomain.com/api`
Base URL (development): `http://localhost:3000/api`

All request and response bodies are JSON. Error responses always have the shape `{ "error": "message" }`.

---

## Public endpoints

### `GET /health`

Health check used by Docker Compose.

**Response 200**
```json
{ "status": "ok" }
```

---

### `POST /contact`

Send a contact form message via Gmail.

**Request body**
```json
{
  "name": "string (1–100)",
  "email": "string (valid email, max 200)",
  "subject": "string (1–200)",
  "company": "string (max 100, optional)",
  "message": "string (1–5000)",
  "turnstileToken": "string (Cloudflare Turnstile token)"
}
```

**Response 200**
```json
{ "ok": true }
```

**Response 400** — validation failed or CAPTCHA rejected
```json
{ "error": "Invalid input" }
```

**Notes**
- If `TURNSTILE_SECRET_KEY` is not set, CAPTCHA is skipped (useful in dev).
- If `GMAIL_USER` / `GMAIL_APP_PASSWORD` are not set, returns 500.

---

### `POST /chat`

Proxy a chat message to Google Gemini 2.0 Flash. Returns the raw Gemini OpenAI-compat response.

**Request body**
```json
{
  "messages": [
    { "role": "system",    "content": "string (max 4000)" },
    { "role": "user",      "content": "string (max 4000)" },
    { "role": "assistant", "content": "string (max 4000)" }
  ]
}
```

Constraints: `messages` array must have 1–50 items. Each item must have `role` ∈ `[user, assistant, system]` and non-empty `content`.

**Response 200** — Gemini OpenAI-compatible response
```json
{
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "AI response text"
      }
    }
  ]
}
```

**Response 400** — Zod validation failed
```json
{ "error": "Invalid input" }
```

**Response 500** — `GEMINI_API_KEY` not configured
```json
{ "error": "Server configuration error: Missing GEMINI_API_KEY" }
```

---

## Strapi content API

Content (bio, projects, experience, skills) is not served by this Express backend at all — it lives in Strapi, which exposes its own REST API and admin UI, reverse-proxied by nginx at `/cms/*` (stripped before forwarding, so Strapi sees plain `/api/...` and `/admin` paths). See [architecture.md](architecture.md) for the full request path.

Base URL (internal, Docker network): `http://strapi:1337`
Base URL (through nginx): `https://yourdomain.com/cms`

**These base URLs are not interchangeable with this doc's `/api` base above** — Strapi's endpoints live under its own `/api/*`, which only resolves correctly when combined with one of the two base URLs directly above (e.g. `https://yourdomain.com/cms/api/bio`), never with `https://yourdomain.com/api` (that's the Express backend, and it has no `/bio`/`/projects`/etc. routes).

Content types, mirroring `strapi/src/api/*/content-types/*/schema.json`:

| Content type | Kind | Full path (through nginx) |
|---|---|---|
| `bio` | single type | `GET /cms/api/bio` |
| `project` | collection type | `GET /cms/api/projects` |
| `experience` | collection type | `GET /cms/api/experiences` |
| `skill` | collection type | `GET /cms/api/skills` |

Reads used by the build script require a `Bearer` API token (`STRAPI_API_TOKEN`, created in the Strapi admin under Settings → API Tokens as a **Read-only** token):

```
Authorization: Bearer <STRAPI_API_TOKEN>
```

`frontend/scripts/fetch-content.mjs` calls these endpoints once at Docker build time (`GET /api/bio?populate=*`, `GET /api/projects?populate=*&sort=order:asc&...`, etc.), reshapes the response into `frontend/src/data/content.json`, and that static file — not this API — is what the running site reads. Writes (creating/editing content) happen only through the Strapi admin UI at `/cms/admin`, which has its own authentication unrelated to this backend.

---

## Error reference

| Status | Meaning |
|---|---|
| 400 | Validation failed (Zod) or bad request |
| 404 | Resource not found |
| 500 | Server error or missing environment variable |

For Strapi's own error responses (e.g. `401` for an invalid `STRAPI_API_TOKEN`), see Strapi's REST API docs — they follow Strapi's own error shape, not this backend's `{ "error": string }` convention.
