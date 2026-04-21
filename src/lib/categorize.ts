import Anthropic from "@anthropic-ai/sdk";
import prisma from "@/services/prisma";

/**
 * Maps raw transaction descriptions to category IDs.
 * 1. Checks DescriptionCategoryMap (user-specific overrides first, then global AI cache).
 * 2. Calls Claude haiku in one batch for unknown descriptions.
 * 3. Saves new AI mappings globally so they're reused across all users.
 * 4. Falls back to "Others" if AI is unavailable or fails.
 */
export async function categorizeDescriptions(
  rawDescriptions: string[],
  userId: string
): Promise<Map<string, string>> {
  const result = new Map<string, string>();

  const valid = rawDescriptions.filter(Boolean);
  if (valid.length === 0) return result;

  const normalized = valid.map((d) => d.trim().toLowerCase());
  const unique = [...new Set(normalized)];

  // Load system categories once
  const categories = await prisma.category.findMany({ where: { userId: null } });
  const othersId = categories.find((c) => c.name === "Others")?.id;
  const nameToId = new Map(categories.map((c) => [c.name.toLowerCase(), c.id]));

  // Bulk lookup: user-specific rows + global rows for all unique descriptions
  const existingMappings = await prisma.descriptionCategoryMap.findMany({
    where: {
      description: { in: unique },
      OR: [{ userId }, { userId: null }],
    },
  });

  // User-specific takes priority over global
  const mapped = new Map<string, string>();
  for (const m of existingMappings) {
    if (!mapped.has(m.description) || m.userId === userId) {
      mapped.set(m.description, m.categoryId);
    }
  }

  for (const d of unique) {
    const catId = mapped.get(d);
    if (catId) result.set(d, catId);
  }

  const unknowns = unique.filter((d) => !mapped.has(d));

  if (unknowns.length > 0 && process.env.ANTHROPIC_API_KEY) {
    try {
      const client = new Anthropic();
      const categoryNames = categories.map((c) => c.name);

      const response = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        system: `You categorize bank transaction descriptions into spending categories.
Available categories: ${categoryNames.join(", ")}.
Respond ONLY with a JSON object mapping each description key to its category name.
Use "Others" for anything that doesn't fit. Return raw JSON only, no markdown.`,
        messages: [
          {
            role: "user",
            content: `Categorize these transaction descriptions:\n${JSON.stringify(unknowns)}`,
          },
        ],
      });

      const text = response.content[0].type === "text" ? response.content[0].text : "";
      const jsonMatch = text.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const aiMap: Record<string, string> = JSON.parse(jsonMatch[0]);

        for (const desc of unknowns) {
          const catName = aiMap[desc];
          const catId = catName ? nameToId.get(catName.toLowerCase()) : undefined;
          const resolvedId = catId || othersId;
          if (!resolvedId) continue;

          result.set(desc, resolvedId);

          // Save to global cache (check first to avoid duplicates)
          const existingGlobal = await prisma.descriptionCategoryMap.findFirst({
            where: { userId: null, description: desc },
          });
          if (existingGlobal) {
            await prisma.descriptionCategoryMap.update({
              where: { id: existingGlobal.id },
              data: { categoryId: resolvedId },
            });
          } else {
            await prisma.descriptionCategoryMap.create({
              data: { userId: null, description: desc, categoryId: resolvedId, source: "ai" },
            });
          }
        }
      }
    } catch (e) {
      console.error("AI categorization failed:", e);
    }
  }

  // Fallback: any still-unmapped description → Others
  if (othersId) {
    for (const d of unique) {
      if (!result.has(d)) result.set(d, othersId);
    }
  }

  return result;
}
