import { PrismaClient } from '@prisma/client'
import * as argon2 from 'argon2'

const prisma = new PrismaClient()

async function main() {
  // First-run guard — skip if already seeded
  const existing = await prisma.adminCredential.findUnique({ where: { id: 1 } })
  if (existing) {
    console.log('Database already seeded, skipping.')
    return
  }

  const adminPassword = process.env.ADMIN_PASSWORD ?? 'admin'
  const passwordHash = await argon2.hash(adminPassword)
  await prisma.adminCredential.upsert({
    where: { id: 1 },
    update: { passwordHash },
    create: { id: 1, passwordHash },
  })

  await prisma.bio.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: 'Krisna',
      title: 'Data Engineer',
      description: 'Data Engineer building scalable data pipelines and modern web applications.',
      aboutDescription: "I'm a Data Engineer based in Indonesia with a passion for building robust data infrastructure and modern web applications. I love turning raw data into meaningful insights and crafting clean, performant user experiences.",
      location: 'Indonesia',
      email: 'aldhiyansyah@heyrcg.com',
      github: 'https://github.com/heyrcg2',
      linkedin: 'https://linkedin.com/in/heyrcg2',
      twitter: null,
      facebook: null,
      instagram: null,
    },
  })

  await prisma.project.createMany({
    data: [
      { title: 'Project One', category: 'Data Engineering', technologies: 'Python, Airflow, dbt, BigQuery', image: '/images/project1.png', description: 'A scalable data pipeline for real-time analytics.', order: 1 },
      { title: 'Project Two', category: 'Full Stack', technologies: 'React, Node.js, PostgreSQL', image: '/images/project2.png', description: 'A full-stack web application for data visualization.', order: 2 },
    ],
  })

  await prisma.experience.create({
    data: {
      position: 'Data Engineer',
      company: 'Company Name',
      period: '2024 - Present',
      location: 'Indonesia',
      description: 'Building and maintaining data pipelines and infrastructure.',
      responsibilities: ['Designing ETL pipelines with Airflow and dbt', 'Managing data warehouse on BigQuery', 'Collaborating with analysts and product teams'],
      technologies: ['Python', 'Airflow', 'dbt', 'BigQuery', 'SQL'],
      order: 1,
    },
  })

  await prisma.skill.createMany({
    data: [
      { category: 'Data Engineering', name: 'Python', order: 1 },
      { category: 'Data Engineering', name: 'Apache Airflow', order: 2 },
      { category: 'Data Engineering', name: 'dbt', order: 3 },
      { category: 'Data Engineering', name: 'BigQuery', order: 4 },
      { category: 'Data Engineering', name: 'SQL', order: 5 },
      { category: 'Frontend', name: 'React', order: 6 },
      { category: 'Frontend', name: 'TypeScript', order: 7 },
      { category: 'Frontend', name: 'Three.js', order: 8 },
      { category: 'DevOps', name: 'Docker', order: 9 },
      { category: 'DevOps', name: 'PostgreSQL', order: 10 },
    ],
  })

  console.log('Seed complete.')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
