import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin/auth";
import prisma from "@/services/prisma";
import AdminCategoriesClient from "./AdminCategoriesClient";

async function getData() {
  try {
    const [systemCategories, globalMappings] = await Promise.all([
      prisma.category.findMany({
        where: { userId: null },
        orderBy: { createdAt: "asc" },
      }),
      prisma.descriptionCategoryMap.findMany({
        where: { userId: null },
        include: { category: true },
        orderBy: { createdAt: "desc" },
        take: 500,
      }),
    ]);
    return { systemCategories, globalMappings };
  } catch {
    return { systemCategories: [], globalMappings: [] };
  }
}

export default async function AdminCategoriesPage() {
  const ok = await isAdminAuthenticated();
  if (!ok) redirect("/admin/login");

  const { systemCategories, globalMappings } = await getData();

  return (
    <AdminCategoriesClient
      initialCategories={systemCategories.map((c) => ({
        id: c.id,
        name: c.name,
        color: c.color,
        isSystem: c.isSystem,
        createdAt: c.createdAt.toISOString(),
      }))}
      initialMappings={globalMappings.map((m) => ({
        id: m.id,
        description: m.description,
        categoryId: m.categoryId,
        categoryName: m.category.name,
        categoryColor: m.category.color,
        source: m.source,
        createdAt: m.createdAt.toISOString(),
      }))}
    />
  );
}
