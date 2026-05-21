export const CATEGORY_IDS = [
  "housing",
  "food",
  "transport",
  "health",
  "leisure",
  "subscriptions",
  "shopping",
  "feesTaxes",
  "income",
  "savings",
  "transfers",
  "other"
] as const;

export type CategoryId = (typeof CATEGORY_IDS)[number];

export type CategoryDefinition = {
  id: CategoryId;
  label: string;
  color: string;
  keywords: string[];
};

export const CATEGORY_DEFINITIONS: CategoryDefinition[] = [
  {
    id: "housing",
    label: "Logement",
    color: "#D97706",
    keywords: ["loyer", "edf", "engie", "assurance habitation", "syndic"]
  },
  {
    id: "food",
    label: "Alimentation",
    color: "#16A34A",
    keywords: ["carrefour", "monoprix", "leclerc", "restaurant", "ubereats", "deliveroo"]
  },
  {
    id: "transport",
    label: "Transport",
    color: "#2563EB",
    keywords: ["sncf", "ratp", "essence", "shell", "uber", "parking"]
  },
  {
    id: "health",
    label: "Sante",
    color: "#DC2626",
    keywords: ["pharmacie", "doctolib", "mutuelle", "hopital"]
  },
  {
    id: "leisure",
    label: "Loisirs",
    color: "#7C3AED",
    keywords: ["cinema", "netflix", "spotify", "vacances", "airbnb"]
  },
  {
    id: "subscriptions",
    label: "Abonnements",
    color: "#0F766E",
    keywords: ["abonnement", "canal", "free mobile", "orange", "sfr"]
  },
  {
    id: "shopping",
    label: "Shopping",
    color: "#EA580C",
    keywords: ["amazon", "zara", "ikea", "fnac", "sephora"]
  },
  {
    id: "feesTaxes",
    label: "Impots et frais",
    color: "#475569",
    keywords: ["impot", "frais", "commission", "taxe"]
  },
  {
    id: "income",
    label: "Revenus",
    color: "#15803D",
    keywords: ["salaire", "payroll", "remboursement", "prime"]
  },
  {
    id: "savings",
    label: "Epargne",
    color: "#0EA5E9",
    keywords: ["livret", "pel", "assurance vie", "epargne"]
  },
  {
    id: "transfers",
    label: "Transferts",
    color: "#6B7280",
    keywords: ["virement", "transfer", "versement"]
  },
  {
    id: "other",
    label: "Autres",
    color: "#64748B",
    keywords: []
  }
];

export const CATEGORY_BY_ID = Object.fromEntries(
  CATEGORY_DEFINITIONS.map((category) => [category.id, category])
) as Record<CategoryId, CategoryDefinition>;
