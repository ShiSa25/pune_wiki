export const categoryIds = ["food", "coffee", "outings", "culture", "escapes"] as const;

export type CategoryId = (typeof categoryIds)[number];

export interface Category {
  id: CategoryId;
  label: string;
  dek: string;
}

export const categories: readonly Category[] = [
  {
    id: "food",
    label: "Iconic food",
    dek: "Named counters with an address, not a ranked menu.",
  },
  {
    id: "coffee",
    label: "Coffee",
    dek: "One cafe, pinned to a single published branch.",
  },
  {
    id: "outings",
    label: "Dates and easy outings",
    dek: "Gardens and a hill that do not need a route planner.",
  },
  {
    id: "culture",
    label: "Culture",
    dek: "Wadas, temples, and a museum. Background, not a ticket desk.",
  },
  {
    id: "escapes",
    label: "Nearby escapes",
    dek: "Outside an ordinary city afternoon. Read the limits first.",
  },
];

const labels = new Map(categories.map((category) => [category.id, category.label]));

export function categoryLabel(id: string): string {
  return labels.get(id as CategoryId) ?? id;
}

export function isCategoryId(value: string): value is CategoryId {
  return labels.has(value as CategoryId);
}
