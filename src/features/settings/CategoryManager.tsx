"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, Lock } from "lucide-react";
import { toast } from "sonner";
import { createCategoryAction, deleteCategoryAction } from "@/app/actions/categories";

type Category = {
  id: string;
  name: string;
  color: string;
  isSystem: boolean;
  userId: string | null;
};

type Props = { initialCategories: Category[] };

export default function CategoryManager({ initialCategories }: Props) {
  const [categories, setCategories] = useState(initialCategories);
  const [name, setName] = useState("");
  const [color, setColor] = useState("#6366f1");
  const [isPending, startTransition] = useTransition();

  const systemCats = categories.filter((c) => c.isSystem);
  const customCats = categories.filter((c) => !c.isSystem);

  const handleCreate = () => {
    if (!name.trim()) { toast.error("Category name is required"); return; }
    startTransition(async () => {
      const result = await createCategoryAction(name.trim(), color);
      if ("error" in result) {
        toast.error(result.error);
      } else if (result.category) {
        setCategories((prev) => [...prev, result.category as Category]);
        setName("");
        setColor("#6366f1");
        toast.success("Category created");
      }
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const result = await deleteCategoryAction(id);
      if ("error" in result) {
        toast.error(result.error);
      } else {
        setCategories((prev) => prev.filter((c) => c.id !== id));
        toast.success("Category deleted");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* System categories */}
      <div>
        <h2 className="text-xs font-semibold font-mono text-text-muted uppercase tracking-widest mb-3">
          System Categories
        </h2>
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          <ul className="divide-y divide-border">
            {systemCats.map((cat) => (
              <li key={cat.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="text-sm font-medium text-text-primary">{cat.name}</span>
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] font-mono text-text-muted">
                  <Lock className="w-3 h-3" />
                  system
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Custom categories */}
      <div>
        <h2 className="text-xs font-semibold font-mono text-text-muted uppercase tracking-widest mb-3">
          Custom Categories
        </h2>

        {customCats.length === 0 ? (
          <p className="text-sm text-text-muted mb-3">No custom categories yet.</p>
        ) : (
          <div className="bg-surface border border-border rounded-xl overflow-hidden mb-4">
            <ul className="divide-y divide-border">
              {customCats.map((cat) => (
                <li key={cat.id} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="text-sm font-medium text-text-primary">{cat.name}</span>
                  </div>
                  <button
                    onClick={() => handleDelete(cat.id)}
                    disabled={isPending}
                    className="p-1.5 text-text-muted hover:text-danger hover:bg-danger-muted rounded-lg transition-colors disabled:opacity-50"
                    aria-label={`Delete ${cat.name}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Add form */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            placeholder="Category name"
            className="flex-1 px-3 py-2 text-sm bg-base border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition"
          />
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-9 h-9 rounded-lg border border-border cursor-pointer bg-base p-1"
            title="Pick a color"
          />
          <button
            onClick={handleCreate}
            disabled={isPending || !name.trim()}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
