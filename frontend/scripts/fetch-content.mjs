import postgres from 'postgres'
import { writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

if (!process.env.DATABASE_URL) {
  console.warn('DATABASE_URL not set — skipping content fetch, keeping existing content.json')
  process.exit(0)
}

const sql = postgres(process.env.DATABASE_URL)

try {
  const [[bio], projects, experience, skills] = await Promise.all([
    sql`SELECT * FROM "Bio" WHERE id = 1`,
    sql`SELECT * FROM "Project" ORDER BY "order" ASC`,
    sql`SELECT * FROM "Experience" ORDER BY "order" ASC`,
    sql`SELECT * FROM "Skill" ORDER BY "order" ASC`,
  ])

  const skillsByCategory = skills.reduce((acc, s) => {
    ;(acc[s.category] ??= []).push(s.name)
    return acc
  }, {})

  writeFileSync(
    path.join(__dirname, '../src/data/content.json'),
    JSON.stringify({ bio: bio ?? null, projects, experience, skillsByCategory }, null, 2)
  )

  if (bio?.name) {
    const initials = bio.name.split(' ').map(w => w[0].toUpperCase()).join('')
    writeFileSync(
      path.join(__dirname, '../public/favicon.svg'),
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="6" fill="#111111"/>
  <text x="16" y="22" font-family="system-ui, sans-serif" font-size="${initials.length > 1 ? 13 : 18}" font-weight="700" fill="#e74c3c" text-anchor="middle">${initials}</text>
</svg>\n`
    )
  }

  console.log('Content fetched successfully.')
} finally {
  await sql.end()
}
