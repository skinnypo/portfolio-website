// Social-preview bots (Twitter/LinkedIn/Facebook/Slack/WhatsApp) fetch raw
// HTML only — they don't execute JS, so the client-side meta-tag rewriting
// in App.tsx's PageTitle never reaches them. This script runs after `vite
// build` and writes a real static index.html per route/article, each with
// correct <head> meta baked in. The body is still the same SPA shell, so
// real users get identical behavior once JS hydrates — nginx's existing
// `try_files $uri $uri/ /index.html` already serves a directory's own
// index.html before falling back to the SPA shell, so no nginx changes
// are needed for this to take effect.
import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distDir = path.join(__dirname, '../dist')
const siteUrl = process.env.VITE_SITE_URL ?? ''

const content = JSON.parse(readFileSync(path.join(__dirname, '../src/data/content.json'), 'utf-8'))
const shell = readFileSync(path.join(distDir, 'index.html'), 'utf-8')

const isWork = (topic) => (topic ?? '').trim().toLowerCase() === 'work'

function escapeHtml(str) {
  return String(str ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
function escapeAttr(str) {
  return escapeHtml(str).replace(/"/g, '&quot;')
}

function renderPage({ routePath, title, description, ogImage, jsonLd }) {
  let html = shell
  const fullTitle = `${title} | I Putu Krisna`
  const url = `${siteUrl}${routePath}`

  html = html.replace(/<title>.*?<\/title>/s, `<title>${escapeHtml(fullTitle)}</title>`)
  html = html.replace(/(<meta name="description" content=")[^"]*(")/, `$1${escapeAttr(description)}$2`)
  html = html.replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${escapeAttr(fullTitle)}$2`)
  html = html.replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${escapeAttr(description)}$2`)
  html = html.replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${escapeAttr(url)}$2`)
  html = html.replace(/(<meta name="twitter:title" content=")[^"]*(")/, `$1${escapeAttr(fullTitle)}$2`)
  html = html.replace(/(<meta name="twitter:description" content=")[^"]*(")/, `$1${escapeAttr(description)}$2`)
  html = html.replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${escapeAttr(url)}$2`)
  if (ogImage) {
    html = html.replace(/(<meta property="og:image" content=")[^"]*(")/, `$1${escapeAttr(ogImage)}$2`)
    html = html.replace(/(<meta name="twitter:image" content=")[^"]*(")/, `$1${escapeAttr(ogImage)}$2`)
  }
  if (jsonLd) {
    html = html.replace('</head>', `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>\n</head>`)
  }

  const outDir = path.join(distDir, routePath.replace(/^\//, ''))
  mkdirSync(outDir, { recursive: true })
  writeFileSync(path.join(outDir, 'index.html'), html)
}

// Static pages — keep titles/descriptions in sync with App.tsx's
// PAGE_TITLES / PAGE_DESCRIPTIONS.
const STATIC_PAGES = [
  { routePath: '/myworks', title: 'Projects', description: "Every project I've engineered, from spec to ship." },
  { routePath: '/stories', title: 'Stories', description: "Life, sports, and the roads that aren't on any project timeline." },
  { routePath: '/play', title: 'Play Chess', description: 'Play chess against a custom engine, built by I Putu Krisna.' },
]
STATIC_PAGES.forEach(renderPage)

const articles = content.articles ?? []
articles.forEach((a) => {
  renderPage({
    routePath: `/articles/${a.slug}`,
    title: a.title,
    description: a.description,
    ogImage: a.coverImage,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': isWork(a.topic) ? 'CreativeWork' : 'BlogPosting',
      headline: a.title,
      description: a.description,
      image: a.coverImage ?? undefined,
      author: { '@type': 'Person', name: 'I Putu Krisna' },
      url: `${siteUrl}/articles/${a.slug}`,
    },
  })
})

console.log(`Prerendered meta for ${STATIC_PAGES.length + articles.length} routes.`)
