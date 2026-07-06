import { writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Internal Docker network hostname by default — frontend-builder and strapi
// share a compose network, so this never needs to be publicly reachable.
const STRAPI_URL = process.env.STRAPI_URL ?? 'http://strapi:1337'
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN

if (!STRAPI_API_TOKEN) {
  throw new Error(
    'STRAPI_API_TOKEN not set — cannot fetch content from Strapi. Create a ' +
    'read-only API token at /cms/admin (Settings > API Tokens) and set it in .env.'
  )
}

async function fetchJson(pathname) {
  const res = await fetch(`${STRAPI_URL}${pathname}`, {
    headers: { Authorization: `Bearer ${STRAPI_API_TOKEN}` },
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Strapi request failed: GET ${pathname} -> ${res.status} ${res.statusText} ${body}`)
  }
  return res.json()
}

function mediaUrl(media) {
  return media?.url ?? null
}

const [bioRes, projectsRes, experienceRes, skillsRes] = await Promise.all([
  fetchJson('/api/bio?populate=*'),
  fetchJson('/api/projects?populate=*&sort=order:asc&pagination[pageSize]=100'),
  fetchJson('/api/experiences?populate=*&sort=order:asc&pagination[pageSize]=100'),
  fetchJson('/api/skills?sort=order:asc&pagination[pageSize]=100'),
])

const bioData = bioRes.data
const bio = bioData
  ? {
      id: bioData.id,
      name: bioData.name,
      title: bioData.title,
      description: bioData.description,
      aboutDescription: bioData.aboutDescription,
      location: bioData.location,
      email: bioData.email,
      github: bioData.github,
      linkedin: bioData.linkedin,
      twitter: bioData.twitter ?? null,
      facebook: bioData.facebook ?? null,
      instagram: bioData.instagram ?? null,
      photo: mediaUrl(bioData.photo),
      updatedAt: bioData.updatedAt,
    }
  : null

const projects = projectsRes.data.map((p) => ({
  id: p.id,
  title: p.title,
  category: p.category,
  technologies: p.technologies,
  image: mediaUrl(p.image),
  description: p.description,
  order: p.order,
  updatedAt: p.updatedAt,
}))

const experience = experienceRes.data.map((e) => ({
  id: e.id,
  position: e.position,
  company: e.company,
  period: e.period,
  location: e.location,
  description: e.description,
  responsibilities: e.responsibilities ?? [],
  technologies: e.technologies ?? [],
  order: e.order,
}))

const skillsByCategory = skillsRes.data.reduce((acc, s) => {
  ;(acc[s.category] ??= []).push(s.name)
  return acc
}, {})

writeFileSync(
  path.join(__dirname, '../src/data/content.json'),
  JSON.stringify({ bio, projects, experience, skillsByCategory }, null, 2)
)

if (bio?.name) {
  const initials = bio.name.split(' ').filter(Boolean).map(w => w[0].toUpperCase()).join('')
  writeFileSync(
    path.join(__dirname, '../public/favicon.svg'),
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="6" fill="#111111"/>
  <text x="16" y="22" font-family="system-ui, sans-serif" font-size="${initials.length > 1 ? 13 : 18}" font-weight="700" fill="#e74c3c" text-anchor="middle">${initials}</text>
</svg>\n`
  )
}

console.log('Content fetched successfully.')
