export interface Bio {
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
  lifePhotos: string[]
  updatedAt: string
}

export interface Article {
  id: number
  title: string
  slug: string
  topic: string
  subtopic: string | null
  description: string
  technologies: string | null
  coverImage: string | null
  body: string
  order: number
  updatedAt: string
}

export interface Experience {
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

export type SkillsByCategory = Record<string, string[]>

export interface SiteContent {
  bio: Bio | null
  articles: Article[]
  experience: Experience[]
  skillsByCategory: SkillsByCategory
}
