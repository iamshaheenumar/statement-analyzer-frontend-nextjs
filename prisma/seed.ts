import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SYSTEM_CATEGORIES = [
  { name: "Food & Dining",      color: "#3B82F6" },
  { name: "Shopping",           color: "#8B5CF6" },
  { name: "Transportation",     color: "#10B981" },
  { name: "Entertainment",      color: "#F59E0B" },
  { name: "Bills & Utilities",  color: "#EF4444" },
  { name: "Healthcare",         color: "#EC4899" },
  { name: "Travel",             color: "#14B8A6" },
  { name: "Education",          color: "#F97316" },
  { name: "Transfer / Payment", color: "#94A3B8" },
  { name: "Others",             color: "#6B7280" },
];

async function main() {
  for (const cat of SYSTEM_CATEGORIES) {
    const existing = await prisma.category.findFirst({
      where: { userId: null, name: cat.name },
    });
    if (!existing) {
      await prisma.category.create({
        data: { ...cat, userId: null, isSystem: true },
      });
      console.log(`Created: ${cat.name}`);
    } else {
      console.log(`Already exists: ${cat.name}`);
    }
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
