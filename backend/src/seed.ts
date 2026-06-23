import { PrismaClient } from '@prisma/client'
import * as argon2 from 'argon2'

const prisma = new PrismaClient()

async function main() {
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
      name: 'I Putu Krisna',
      title: 'Data Engineer',
      description: 'Data Engineer with 3+ years architecting scalable Delta Lakehouse platforms across multi-cloud environments.',
      aboutDescription: 'I am a data engineer specializing in Databricks and Delta Lakehouse platforms across multi-cloud environments. I design solutions that balance performance, cost, and maintainability — building standardized SDKs, reusable frameworks, and YAML-driven pipelines that enforce governance and improve cross-team consistency. With a product-driven mindset, I translate raw data architecture into measurable business outcomes.',
      location: 'Jakarta, Indonesia',
      email: 'krisna.ipts@gmail.com',
      github: 'https://github.com/skinnypo',
      linkedin: 'https://linkedin.com/in/iptkrisna',
      twitter: null,
      facebook: null,
      instagram: null,
    },
  })

  const projects = [
    {
      title: 'Medallion Architecture Data Platform',
      category: 'Data Engineering',
      technologies: 'Databricks, Unity Catalog, Delta Lake, PySpark, Python',
      image: '/images/project1.png',
      description: 'Built end-to-end data infrastructure from scratch using medallion architecture governed on Databricks Unity Catalog, including cost optimization through ingestion restructuring and Spark cluster tuning.',
      order: 1,
    },
    {
      title: 'Centralized Data Platform SDK',
      category: 'Data Engineering',
      technologies: 'Python, Databricks, Clean Architecture, Domain Driven Design',
      image: '/images/project2.png',
      description: 'Developed a centralized SDK to standardize reusable modules across the data platform with clean-layered architecture and domain driven design, enabling faster development and cross-team consistency.',
      order: 2,
    },
    {
      title: 'YAML-driven Data Pipeline Framework',
      category: 'Data Engineering',
      technologies: 'Python, Databricks, Spark, CDC, Kinesis, PubSub, YAML',
      image: '/images/project3.png',
      description: 'Implemented YAML-driven pipeline modules supporting diverse data sources, near-realtime CDC, incremental batch processing, data contracts, multiple write strategies, and performance optimizations.',
      order: 3,
    },
    {
      title: 'Data Quality Operations Framework',
      category: 'Data Engineering',
      technologies: 'Python, Databricks, BigQuery, YAML, Slack API',
      image: '/images/project4.png',
      description: 'Created a robust YAML-driven data quality framework with multi-dimensional validation checks supporting Databricks and BigQuery sources, enriched with Slack and email alerting.',
      order: 4,
    },
  ]

  for (const project of projects) {
    await prisma.project.create({ data: project })
  }

  const experiences = [
    {
      position: 'Data Engineer',
      company: 'HeyRCG',
      period: '03/2026 - Present',
      location: 'Bali, Indonesia',
      description: 'Architecting data solutions at a growing company.',
      responsibilities: [
        'Designing scalable data infrastructure and pipelines',
        'Applying Databricks and Delta Lakehouse patterns from previous experience',
      ],
      technologies: ['Databricks', 'Python', 'PySpark', 'Delta Lake', 'SQL'],
      order: 1,
    },
    {
      position: 'Data Engineer',
      company: 'FIT HUB',
      period: '10/2022 - 03/2026',
      location: 'Jakarta, Indonesia',
      description: "Built the company's end-to-end data infrastructure from scratch. Recognized as Engineering MVP of 2023.",
      responsibilities: [
        'Built end-to-end data infrastructure from scratch using medallion architecture on Databricks Unity Catalog',
        'Reduced data infrastructure costs by restructuring ingestion strategies and tuning Spark cluster performance',
        'Developed a centralized SDK to standardize reusable modules with clean-layered architecture and DDD',
        'Implemented YAML-driven pipeline modules supporting CDC, incremental batch, data contracts, and multiple write strategies',
        'Built YAML-driven ML data-ops modules for encoding, imputation, scaling, and feature transformations',
        'Developed YAML-driven workflow orchestration modules for managing Databricks Jobs API operations',
        'Created a robust data quality framework with YAML-driven multi-dimensional validation and Slack/email alerting',
        'Collaborated with data consumers, analysts, and product teams to align business metric definitions',
      ],
      technologies: ['Databricks', 'Unity Catalog', 'Delta Lake', 'PySpark', 'Python', 'SQL', 'BigQuery', 'CDC', 'Kinesis', 'PubSub'],
      order: 2,
    },
    {
      position: 'Database Engineer',
      company: 'AIA Singapore',
      period: '08/2022 - 10/2022',
      location: 'Singapore',
      description: 'Engineer/Analyst role focused on CRM source system migration and data pipeline maintenance.',
      responsibilities: [
        'Developed source system migration in the CRM project from COMPASS/IL to LEAP data source',
        'Mapped new data source definitions against previous data sources end-to-end',
        'Maintained existing data automation pipelines using Attunity and resolved errors',
        'Collaborated with data teams across India, Singapore, Malaysia, and China',
      ],
      technologies: ['SQL', 'Attunity', 'CRM'],
      order: 3,
    },
    {
      position: 'Data Engineer Intern',
      company: 'AIA Singapore',
      period: '08/2021 - 08/2022',
      location: 'Singapore',
      description: 'Contributed to the Unified Analytics Data Mart (UAD) project from scratch.',
      responsibilities: [
        'Contributed to the Unified Analytics Data Mart (UAD) project from scratch',
        'Created data models with mapping definitions provided by analysts',
        'Used multiple ingestion methods: API, ABFS/DBFS mounting, SFTP, and Azure Data Factory',
        'Implemented CI/CD pipelines using Azure DevOps',
      ],
      technologies: ['Azure Data Factory', 'Azure DevOps', 'SQL', 'Python', 'ABFS'],
      order: 4,
    },
    {
      position: 'Software Engineer',
      company: 'Various',
      period: '03/2019 - 10/2021',
      location: 'Jakarta, Indonesia',
      description: 'Early career spanning backend, full-stack, education, and iOS development roles.',
      responsibilities: [
        'Backend Developer at PT Leastric Teknologi Indonesia — restructured cloud-based IoT data infrastructure',
        'Full-Stack Developer at Benih Belajar — initiated and built the web application for their first MVP',
        'Assistant Lecturer at Universitas Prasetiya Mulya — mentored students in web development',
        'iOS Developer Intern at Apple Developer Academy Indonesia — product-driven mindset through challenge-based learning',
      ],
      technologies: ['Node.js', 'JavaScript', 'iOS', 'Swift', 'React'],
      order: 5,
    },
  ]

  for (const exp of experiences) {
    await prisma.experience.create({ data: exp })
  }

  const skills = [
    { category: 'Data Engineering', name: 'Databricks (Unity Catalog, Workflows, Spark)', order: 1 },
    { category: 'Data Engineering', name: 'Apache Spark / PySpark', order: 2 },
    { category: 'Data Engineering', name: 'Delta Lake & Iceberg', order: 3 },
    { category: 'Data Engineering', name: 'BigQuery', order: 4 },
    { category: 'Data Engineering', name: 'CDC Streaming (Kinesis, Firehose, PubSub)', order: 5 },
    { category: 'Data Engineering', name: 'Python', order: 6 },
    { category: 'Data Engineering', name: 'SQL / T-SQL', order: 7 },
    { category: 'Data Engineering', name: 'PostgreSQL & MySQL', order: 8 },
    { category: 'Data Engineering', name: 'DynamoDB & Firestore', order: 9 },
    { category: 'Data Engineering', name: 'DuckDB', order: 10 },
    { category: 'AI & System Intelligence', name: 'ML Data-Ops & Feature Engineering', order: 11 },
    { category: 'AI & System Intelligence', name: 'Generative AI', order: 12 },
    { category: 'AI & System Intelligence', name: 'Data Quality & Observability', order: 13 },
    { category: 'AI & System Intelligence', name: 'N8N Workflow Automation', order: 14 },
    { category: 'AI & System Intelligence', name: 'Clean Architecture & Domain Driven Design', order: 15 },
    { category: 'DevOps & Tools', name: 'GCP', order: 16 },
    { category: 'DevOps & Tools', name: 'AWS', order: 17 },
    { category: 'DevOps & Tools', name: 'Azure', order: 18 },
    { category: 'DevOps & Tools', name: 'Docker', order: 19 },
    { category: 'DevOps & Tools', name: 'GitHub', order: 20 },
    { category: 'DevOps & Tools', name: 'Azure DevOps / CI/CD', order: 21 },
    { category: 'DevOps & Tools', name: 'JavaScript', order: 22 },
  ]

  for (const skill of skills) {
    await prisma.skill.create({ data: skill })
  }

  console.log('Seed complete.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
