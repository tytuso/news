export type SignalCategory = "Models" | "Products" | "Research" | "Business" | "Developers" | "Safety" | "Other";
export type SignalImpact = "Major" | "Important" | "Watch";

const groups: Array<{ category: SignalCategory; words: string[] }> = [
  { category: "Models", words: ["gpt", "gemini", "claude", "llama", "language model", "foundation model", "reasoning model", "multimodal", "model release", "open weights"] },
  { category: "Developers", words: ["api", "sdk", "github", "developer", "copilot", "coding", "repository", "framework", "integration", "open source"] },
  { category: "Research", words: ["research", "paper", "benchmark", "science", "study", "evaluation", "robotics", "algorithm", "training", "arxiv"] },
  { category: "Business", words: ["funding", "invest", "acquisition", "partnership", "enterprise", "startup", "pricing", "revenue", "valuation", "regulatory approval"] },
  { category: "Safety", words: ["safety", "security", "policy", "risk", "alignment", "regulation", "responsible ai", "privacy"] },
  { category: "Products", words: ["launch", "introduc", "product", "feature", "agent", "app", "voice", "video", "image", "assistant", "tool"] }
];

const aiPattern = /\b(ai|artificial intelligence|machine learning|deep learning|llm|llms|gpt|gemini|claude|chatgpt|copilot|chatbot|neural network|generative|foundation models?|large language models?|openai|anthropic|deepmind|hugging face|nvidia nemotron|automation agents?|computer vision|text.to.image)\b/i;

const africaPattern = /\b(africa|african|uganda|kenya|nigeria|ghana|rwanda|south africa|ethiopia|tanzania|senegal|sierra leone|egypt|morocco|botswana|zambia|zimbabwe|cameroon|ivory coast|cote d.ivoire|kampala|nairobi|lagos|kigali|accra|cairo)\b/i;

export function isAboutAI(title: string, description: string): boolean {
  return aiPattern.test(title + " " + description);
}

export function hasAfricaAngle(title: string, description: string): boolean {
  return africaPattern.test(title + " " + description);
}

export function classifySignal(title: string, description: string): SignalCategory {
  const text = (title + " " + description).toLowerCase();
  let top: SignalCategory = "Other";
  let best = 0;
  for (const group of groups) {
    const score = group.words.reduce((sum, word) => sum + (text.includes(word) ? (title.toLowerCase().includes(word) ? 2 : 1) : 0), 0);
    if (score > best) { best = score; top = group.category; }
  }
  return top;
}

export function scoreImpact(title: string, description: string): SignalImpact {
  const headline = title.toLowerCase();
  const detail = description.toLowerCase();
  const major = ["new model", "introducing gpt", "introducing claude", "introducing gemini", "launches model", "releases model", "open weights", "acquires", "acquisition", "raises $", "billion", "major update", "general availability", "breakthrough"];
  const important = ["launch", "release", "introduc", "partnership", "funding", "research", "benchmark", "security", "developer", "copilot", "agent", "api", "pricing"];
  if (major.some((term) => headline.includes(term))) return "Major";
  if (important.some((term) => headline.includes(term) || detail.includes(term))) return "Important";
  return "Watch";
}

export function explainWhyItMatters(category: SignalCategory, impact: SignalImpact, title: string): string {
  const lower = title.toLowerCase();
  if (lower.includes("pricing") || lower.includes("cost")) return "This could change the cost of building or using AI products.";
  if (category === "Models") return "New model capabilities can change what businesses and developers can build.";
  if (category === "Developers") return "Useful for developers choosing tools, integrations and AI infrastructure.";
  if (category === "Business") return "A signal of where AI investment, competition and adoption may be heading.";
  if (category === "Research") return "Early research can point to the next practical advances in AI.";
  if (category === "Safety") return "Could affect how AI tools are used, governed or secured.";
  if (category === "Products") return "A product change worth considering for everyday AI workflows.";
  return impact === "Major" ? "A noteworthy development to watch across the AI industry." : "A developing story in the AI ecosystem.";
}
