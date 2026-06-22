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

## Admin endpoints

All admin endpoints require a `Bearer` JWT token in the `Authorization` header.

```
Authorization: Bearer <token>
```

Tokens are obtained from `POST /admin/login` and expire after 24 hours.

---

### `POST /admin/login`

Authenticate and obtain a JWT token.

**Request body**
```json
{ "password": "string" }
```

**Response 200**
```json
{ "token": "eyJ..." }
```

**Response 401** — wrong password or no admin credential seeded
```json
{ "error": "Unauthorized" }
```

---

### `GET /admin/bio`

Get the portfolio owner's bio.

**Response 200**
```json
{
  "id": 1,
  "name": "string",
  "title": "string",
  "description": "string",
  "aboutDescription": "string",
  "location": "string",
  "email": "string",
  "github": "string (URL)",
  "linkedin": "string (URL)",
  "twitter": "string (URL) | null",
  "facebook": "string (URL) | null",
  "instagram": "string (URL) | null",
  "photo": "string (path) | null",
  "updatedAt": "ISO 8601"
}
```

---

### `PUT /admin/bio`

Update the bio. All fields required except optional social links and photo.

**Request body** — same shape as GET response (minus `id` and `updatedAt`)

**Response 200** — updated bio object

---

### `GET /admin/projects`

List all projects ordered by `order` field.

**Response 200** — array of project objects
```json
[
  {
    "id": 1,
    "title": "string",
    "category": "string",
    "technologies": "string",
    "image": "string (URL) | null",
    "description": "string",
    "order": 0,
    "updatedAt": "ISO 8601"
  }
]
```

---

### `POST /admin/projects`

Create a project.

**Request body**
```json
{
  "title": "string",
  "category": "string",
  "technologies": "string",
  "image": "string (URL, optional)",
  "description": "string",
  "order": 0
}
```

**Response 201** — created project object

---

### `PUT /admin/projects/:id`

Update a project.

**Response 200** — updated project object
**Response 404** — project not found

---

### `DELETE /admin/projects/:id`

Delete a project.

**Response 204** — no content
**Response 404** — project not found

---

### `GET /admin/experience`

List all experience entries ordered by `order`.

**Response 200**
```json
[
  {
    "id": 1,
    "position": "string",
    "company": "string",
    "period": "string",
    "location": "string",
    "description": "string",
    "responsibilities": ["string"],
    "technologies": ["string"],
    "order": 0
  }
]
```

---

### `POST /admin/experience`

Create an experience entry.

---

### `PUT /admin/experience/:id`

Update an experience entry.

---

### `DELETE /admin/experience/:id`

Delete an experience entry.

---

### `GET /admin/skills`

List all skills grouped by category.

---

### `POST /admin/skills`

Create a skill.

**Request body**
```json
{
  "category": "string",
  "name": "string",
  "order": 0
}
```

---

### `PUT /admin/skills/:id` / `DELETE /admin/skills/:id`

Update or delete a skill.

---

### `POST /admin/upload`

Upload an image file (multipart/form-data). Returns the public path to the uploaded file.

**Request** — `multipart/form-data` with field `file` (image, max 2 MB)

**Response 200**
```json
{ "url": "/uploads/filename.jpg" }
```

---

## Error reference

| Status | Meaning |
|---|---|
| 400 | Validation failed (Zod) or bad request |
| 401 | Missing or invalid JWT token |
| 404 | Resource not found |
| 500 | Server error or missing environment variable |
