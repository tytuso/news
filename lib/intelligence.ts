export type SignalCategory =
  | "Models"
  | "Products"
  | "Research"
  | "Business"
  | "Developers"
  | "Safety"
  | "Other";

export type SignalImpact = "Major" | "Important" | "Watch";

const groups: Array<{ category: SignalCategory; words: string[] }> = [
  { category: "Models", words: ["model", "gpt", "gemini", "claude", "llama", "parameter", "multimodal", "reasoning"] },
  { category: "Products", words: ["launch", "introduc", "product", "feature", "agent", "app", "voice", "video", "image"] },
  { category: "Research", words: ["research", "paper", "benchmark", "science", "study", "evaluation", "biology", "protein"] },
  { category: "Business", words: ["funding", "invest", "acquisition", "partnership", "enterprise", "customer", "pricing", "revenue"] },
  { category: "Developers", words: ["api", "sdk", "github", "developer", "code", "copilot", "repository", "tool"] },
  { category: "Safety", words: ["safety", "security", "policy", "risk", "alignment", "regulation", "provenance"] }
];

const majorWords = [
  "introducing",
  "launch",
  "released",
  "new model",
  "acquisition",
  "funding",
  "pricing",
  "api",
  "open source",
  "general availability"
];

const importantWords = [
  "partnership",
  "enterprise",
  "research",
  "benchmark",
  "security",
  "developer",
  "copilot",
  "agent"
];

const africaWords = [
  "africa",
  "african",
  "uganda",
  "kenya",
  "nigeria",
  "ghana",
  "rwanda",
  "south africa",
  "ethiopia",
  "tanzania",
  "senegal",
  "sierra leone",
  "egypt",
  "morocco"
];

function textOf(title: string, description: string) {
  return `${title} ${description}`.toLowerCase();
}

export function classifySignal(title: string, description: string): SignalCategory {
  const text = textOf(title, description);
  let best: { category: SignalCategory; score: number } = { category: "Other", score: 0 };

  for (const group of groups) {
    const score = group.words.reduce((total, word) => total + (text.includes(word) ? 1 : 0), 0);
    if (score > best.score) best = { category: group.category, score };
  }

  return best.category;
}

export function scoreImpact(title: string, description: string): SignalImpact {
  const text = textOf(title, description);
  if (majorWords.some((word) => text.includes(word))) return "Major";
  if (importantWords.some((word) => text.includes(word))) return "Important";
  return "Watch";
}

export function hasAfricaAngle(title: string, description: string) {
  const text = textOf(title, description);
  return africaWords.some((word) => text.includes(word));
}

export function explainWhyItMatters(category: SignalCategory, impact: SignalImpact, title: string) {
  const lower = title.toLowerCase();

  if (lower.includes("pricing") || lower.includes("cost")) {
    return "Pricing changes can immediately alter the economics of AI products and which models are viable at scale.";
  }

  if (category === "Models") {
    return impact === "Major"
      ? "A meaningful model change can shift capability, cost and the products teams can build."
      : "Worth tracking because model improvements often become product capabilities within weeks.";
  }

  if (category === "Developers") {
    return "Developer platform changes can affect integrations, product roadmaps and the cost of shipping AI features.";
  }

  if (category === "Business") {
    return "This is a market signal: partnerships, capital and enterprise adoption show where AI spending is moving.";
  }

  if (category === "Research") {
    return "Research signals what may become commercially useful next, before it reaches mainstream products.";
  }

  if (category === "Safety") {
    return "Safety and policy changes can affect how AI products are built, deployed and governed across markets.";
  }

  return "This update may change how people build, buy or use AI, so it is worth keeping on the radar.";
}
