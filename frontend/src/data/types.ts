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
  updatedAt: string
}

export interface Project {
  id: number
  title: string
  category: string
  technologies: string
  image: string | null
  description: string
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
  projects: Project[]
  experience: Experience[]
  skillsByCategory: SkillsByCategory
}
