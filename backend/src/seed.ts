// Content and admin credentials are now managed in Strapi (see strapi/) —
// nothing left in the Prisma-managed database to seed.
async function main() {
  console.log('Nothing to seed — content is managed in Strapi.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
