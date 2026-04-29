import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const INTERESTS = [
  { name: 'Technology', slug: 'technology' },
  { name: 'Science', slug: 'science' },
  { name: 'Politics', slug: 'politics' },
  { name: 'Arts & Culture', slug: 'arts-culture' },
  { name: 'Sports', slug: 'sports' },
  { name: 'Gaming', slug: 'gaming' },
  { name: 'Music', slug: 'music' },
  { name: 'Film & TV', slug: 'film-tv' },
  { name: 'Books & Literature', slug: 'books-literature' },
  { name: 'Food & Cooking', slug: 'food-cooking' },
  { name: 'Travel', slug: 'travel' },
  { name: 'Health & Fitness', slug: 'health-fitness' },
  { name: 'Finance & Investing', slug: 'finance-investing' },
  { name: 'Philosophy', slug: 'philosophy' },
  { name: 'History', slug: 'history' },
  { name: 'Environment & Nature', slug: 'environment-nature' },
  { name: 'Fashion & Style', slug: 'fashion-style' },
  { name: 'Photography', slug: 'photography' },
  { name: 'DIY & Crafts', slug: 'diy-crafts' },
  { name: 'Parenting & Family', slug: 'parenting-family' },
  { name: 'Education', slug: 'education' },
  { name: 'Business & Entrepreneurship', slug: 'business-entrepreneurship' },
  { name: 'Psychology', slug: 'psychology' },
  { name: 'Spirituality & Religion', slug: 'spirituality-religion' },
  { name: 'Current Events', slug: 'current-events' },
];

async function main() {
  console.log('Seeding interests…');

  for (const interest of INTERESTS) {
    await prisma.interest.upsert({
      where: { slug: interest.slug },
      update: { name: interest.name },
      create: interest,
    });
  }

  console.log(`Seeded ${INTERESTS.length} interests.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
