import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/server";
import prisma from "@/services/prisma";
import Navbar from "@/components/Navbar";
import CategoryManager from "@/features/settings/CategoryManager";
import { Tag } from "lucide-react";

export default async function CategoriesSettingsPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const categories = await prisma.category.findMany({
    where: { OR: [{ userId: null }, { userId: user.id }] },
    orderBy: [{ isSystem: "desc" }, { name: "asc" }],
  });

  return (
    <div className="min-h-screen bg-base">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <Tag className="w-4 h-4 text-accent" />
            <h1 className="font-display text-xl font-bold text-text-primary">
              Spend Categories
            </h1>
          </div>
          <p className="text-sm text-text-muted">
            Manage categories used to classify your transactions. System categories are built-in and cannot be deleted.
          </p>
        </div>
        <CategoryManager
          initialCategories={categories.map((c) => ({
            id: c.id,
            name: c.name,
            color: c.color,
            isSystem: c.isSystem,
            userId: c.userId,
          }))}
        />
      </main>
    </div>
  );
}
