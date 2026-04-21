"use client";

import { useState, useTransition, useMemo } from "react";
import { Plus, Trash2, Pencil, Check, X, Search, Bot, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import {
  createSystemCategoryAction,
  updateSystemCategoryAction,
  deleteSystemCategoryAction,
  updateGlobalMappingAction,
  deleteGlobalMappingAction,
} from "@/app/actions/admin";

type CategoryRow = {
  id: string;
  name: string;
  color: string;
  isSystem: boolean;
  createdAt: string;
};

type MappingRow = {
  id: string;
  description: string;
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  source: string;
  createdAt: string;
};

type Props = {
  initialCategories: CategoryRow[];
  initialMappings: MappingRow[];
};

function SourceBadge({ source }: { source: string }) {
  if (source === "admin") {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-accent-muted text-accent border border-accent/20">
        <ShieldCheck className="w-2.5 h-2.5" /> admin
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-elevated text-text-muted border border-border">
      <Bot className="w-2.5 h-2.5" /> ai
    </span>
  );
}

function CategoryDot({ color }: { color: string }) {
  return <span className="w-2.5 h-2.5 rounded-full shrink-0 inline-block" style={{ backgroundColor: color }} />;
}

// ── System Categories section ────────────────────────────────────────────────

function SystemCategoriesSection({ categories: initial }: { categories: CategoryRow[] }) {
  const [categories, setCategories] = useState(initial);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("#6B7280");
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#6366f1");
  const [isPending, startTransition] = useTransition();

  const startEdit = (cat: CategoryRow) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditColor(cat.color);
  };

  const cancelEdit = () => setEditingId(null);

  const handleUpdate = (id: string) => {
    if (!editName.trim()) return;
    startTransition(async () => {
      const result = await updateSystemCategoryAction(id, editName, editColor);
      if ("error" in result) {
        toast.error("Update failed");
      } else {
        setCategories((prev) =>
          prev.map((c) =>
            c.id === id ? { ...c, name: editName.trim(), color: editColor } : c
          )
        );
        setEditingId(null);
        toast.success("Category updated");
      }
    });
  };

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? All linked transactions will become uncategorized.`)) return;
    startTransition(async () => {
      await deleteSystemCategoryAction(id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
      toast.success("Category deleted");
    });
  };

  const handleCreate = () => {
    if (!newName.trim()) { toast.error("Name is required"); return; }
    startTransition(async () => {
      const result = await createSystemCategoryAction(newName.trim(), newColor);
      if (result && "error" in result) {
        toast.error(result.error);
      } else if (result && "category" in result && result.category) {
        const cat = result.category as unknown as CategoryRow;
        setCategories((prev) => [...prev, { ...cat, createdAt: new Date().toISOString() }]);
        setNewName("");
        setNewColor("#6366f1");
        toast.success("System category created");
      }
    });
  };

  return (
    <section>
      <h2 className="text-xs font-semibold font-mono text-text-muted uppercase tracking-widest mb-3">
        System Categories
      </h2>
      <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-surface mb-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-base border-b border-border">
              {["Color", "Name", "Actions"].map((h) => (
                <th
                  key={h}
                  className={`px-4 py-2.5 text-[11px] font-semibold font-mono text-text-muted uppercase tracking-widest ${h === "Actions" ? "text-right" : "text-left"}`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {categories.map((cat) =>
              editingId === cat.id ? (
                <tr key={cat.id} className="bg-accent-muted/30">
                  <td className="px-4 py-2.5">
                    <input
                      type="color"
                      value={editColor}
                      onChange={(e) => setEditColor(e.target.value)}
                      className="w-7 h-7 rounded border border-border cursor-pointer bg-base p-0.5"
                    />
                  </td>
                  <td className="px-4 py-2.5">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleUpdate(cat.id)}
                      className="px-2 py-1 text-sm bg-base border border-accent rounded-lg text-text-primary focus:outline-none focus:ring-1 focus:ring-accent w-full max-w-xs"
                      autoFocus
                    />
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleUpdate(cat.id)}
                        disabled={isPending}
                        className="p-1.5 text-success hover:bg-success-muted rounded-lg transition-colors disabled:opacity-50"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="p-1.5 text-text-muted hover:bg-elevated rounded-lg transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                <tr key={cat.id} className="hover:bg-elevated transition-colors">
                  <td className="px-4 py-3">
                    <CategoryDot color={cat.color} />
                  </td>
                  <td className="px-4 py-3 font-medium text-text-primary">{cat.name}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => startEdit(cat)}
                        disabled={isPending}
                        className="p-1.5 text-text-muted hover:text-accent hover:bg-accent-muted rounded-lg transition-colors disabled:opacity-50"
                        title="Edit"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(cat.id, cat.name)}
                        disabled={isPending}
                        className="p-1.5 text-text-muted hover:text-danger hover:bg-danger-muted rounded-lg transition-colors disabled:opacity-50"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>

      {/* Add new system category */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          placeholder="New system category name"
          className="flex-1 px-3 py-2 text-sm bg-surface border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent transition"
        />
        <input
          type="color"
          value={newColor}
          onChange={(e) => setNewColor(e.target.value)}
          className="w-9 h-9 rounded-lg border border-border cursor-pointer bg-surface p-1"
          title="Pick a color"
        />
        <button
          onClick={handleCreate}
          disabled={isPending || !newName.trim()}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" />
          Add
        </button>
      </div>
    </section>
  );
}

// ── Global AI Mappings section ────────────────────────────────────────────────

function GlobalMappingsSection({
  mappings: initial,
  categories,
}: {
  mappings: MappingRow[];
  categories: CategoryRow[];
}) {
  const [mappings, setMappings] = useState(initial);
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    if (!search.trim()) return mappings;
    const t = search.toLowerCase();
    return mappings.filter(
      (m) =>
        m.description.toLowerCase().includes(t) ||
        m.categoryName.toLowerCase().includes(t)
    );
  }, [mappings, search]);

  const handleRemap = (mappingId: string, newCategoryId: string) => {
    const cat = categories.find((c) => c.id === newCategoryId);
    if (!cat) return;
    startTransition(async () => {
      const result = await updateGlobalMappingAction(mappingId, newCategoryId);
      if ("success" in result) {
        setMappings((prev) =>
          prev.map((m) =>
            m.id === mappingId
              ? { ...m, categoryId: newCategoryId, categoryName: cat.name, categoryColor: cat.color, source: "admin" }
              : m
          )
        );
        toast.success("Mapping corrected");
      }
    });
  };

  const handleDelete = (mappingId: string) => {
    startTransition(async () => {
      await deleteGlobalMappingAction(mappingId);
      setMappings((prev) => prev.filter((m) => m.id !== mappingId));
      toast.success("Mapping removed — next occurrence will be re-categorized by AI");
    });
  };

  return (
    <section>
      <div className="flex items-center justify-between gap-3 mb-3">
        <h2 className="text-xs font-semibold font-mono text-text-muted uppercase tracking-widest">
          Global AI Mappings
          <span className="ml-2 font-normal normal-case tracking-normal text-text-muted">
            ({mappings.length})
          </span>
        </h2>
        <div className="relative w-56">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter…"
            className="w-full pl-8 pr-3 py-1.5 text-xs font-mono bg-surface border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent transition"
          />
        </div>
      </div>

      <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-surface">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-text-muted">
            <p className="text-sm">No mappings found</p>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[520px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="bg-base border-b border-border">
                  {["Description", "Category", "Source", ""].map((h, i) => (
                    <th
                      key={i}
                      className={`px-4 py-2.5 text-[11px] font-semibold font-mono text-text-muted uppercase tracking-widest ${i === 3 ? "text-right w-10" : "text-left"}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((m) => (
                  <tr key={m.id} className="hover:bg-elevated transition-colors">
                    <td className="px-4 py-2.5 font-mono text-xs text-text-primary max-w-xs truncate">
                      {m.description}
                    </td>
                    <td className="px-4 py-2.5">
                      <select
                        value={m.categoryId}
                        onChange={(e) => handleRemap(m.id, e.target.value)}
                        disabled={isPending}
                        className="text-xs font-medium bg-transparent border border-border rounded-lg px-2 py-1 text-text-secondary focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer disabled:opacity-50"
                        style={{ color: m.categoryColor }}
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-2.5">
                      <SourceBadge source={m.source} />
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <button
                        onClick={() => handleDelete(m.id)}
                        disabled={isPending}
                        className="p-1.5 text-text-muted hover:text-danger hover:bg-danger-muted rounded-lg transition-colors disabled:opacity-50"
                        title="Remove mapping"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <p className="text-xs text-text-muted mt-2">
        Deleting a mapping lets the AI re-categorize that description the next time it appears.
      </p>
    </section>
  );
}

// ── Root component ────────────────────────────────────────────────────────────

export default function AdminCategoriesClient({ initialCategories, initialMappings }: Props) {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-2xl font-bold text-text-primary">Categories</h1>
        <p className="text-sm text-text-muted mt-1">
          Manage system categories and correct AI-determined description mappings.
        </p>
      </div>

      <SystemCategoriesSection categories={initialCategories} />
      <GlobalMappingsSection mappings={initialMappings} categories={initialCategories} />
    </div>
  );
}
