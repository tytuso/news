export type SignalSource = {
  key: string;
  name: string;
  feedUrl: string;
  homepage: string;
  region: "global" | "africa";
  type: "official" | "reporting" | "research";
  aiOnly?: boolean;
};

export const SIGNAL_SOURCES: SignalSource[] = [
  { key: "openai", name: "OpenAI", feedUrl: "https://openai.com/news/rss.xml", homepage: "https://openai.com/news/", region: "global", type: "official" },
  { key: "deepmind", name: "Google DeepMind", feedUrl: "https://deepmind.google/blog/rss.xml", homepage: "https://deepmind.google/blog/", region: "global", type: "official" },
  { key: "googleai", name: "Google AI", feedUrl: "https://blog.google/technology/ai/rss/", homepage: "https://blog.google/technology/ai/", region: "global", type: "official" },
  { key: "googleresearch", name: "Google Research", feedUrl: "https://research.google/blog/rss/", homepage: "https://research.google/blog/", region: "global", type: "research" },
  { key: "huggingface", name: "Hugging Face", feedUrl: "https://huggingface.co/blog/feed.xml", homepage: "https://huggingface.co/blog", region: "global", type: "official" },
  { key: "github", name: "GitHub", feedUrl: "https://github.blog/changelog/feed/", homepage: "https://github.blog/changelog/", region: "global", type: "official", aiOnly: true },
  { key: "microsoftai", name: "Microsoft AI", feedUrl: "https://blogs.microsoft.com/ai/feed/", homepage: "https://blogs.microsoft.com/ai/", region: "global", type: "official" },
  { key: "microsoftresearch", name: "Microsoft Research", feedUrl: "https://www.microsoft.com/en-us/research/feed/", homepage: "https://www.microsoft.com/en-us/research/blog/", region: "global", type: "research", aiOnly: true },
  { key: "nvidia", name: "NVIDIA", feedUrl: "https://developer.nvidia.com/blog/feed/", homepage: "https://developer.nvidia.com/blog/", region: "global", type: "official", aiOnly: true },
  { key: "awsml", name: "AWS Machine Learning", feedUrl: "https://aws.amazon.com/blogs/machine-learning/feed/", homepage: "https://aws.amazon.com/blogs/machine-learning/", region: "global", type: "official" },
  { key: "appleml", name: "Apple Machine Learning", feedUrl: "https://machinelearning.apple.com/rss.xml", homepage: "https://machinelearning.apple.com/", region: "global", type: "research" },
  { key: "langchain", name: "LangChain", feedUrl: "https://blog.langchain.dev/rss/", homepage: "https://blog.langchain.dev/", region: "global", type: "official" },
  { key: "cohere", name: "Cohere", feedUrl: "https://txt.cohere.com/rss/", homepage: "https://cohere.com/blog", region: "global", type: "official" },
  { key: "arxiv", name: "arXiv AI", feedUrl: "https://export.arxiv.org/rss/cs.AI", homepage: "https://arxiv.org/list/cs.AI/recent", region: "global", type: "research" },
  { key: "techcrunch", name: "TechCrunch AI", feedUrl: "https://techcrunch.com/category/artificial-intelligence/feed/", homepage: "https://techcrunch.com/category/artificial-intelligence/", region: "global", type: "reporting" },
  { key: "verge", name: "The Verge AI", feedUrl: "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml", homepage: "https://www.theverge.com/ai-artificial-intelligence", region: "global", type: "reporting" },
  { key: "techreview", name: "MIT Technology Review", feedUrl: "https://www.technologyreview.com/topic/artificial-intelligence/feed", homepage: "https://www.technologyreview.com/topic/artificial-intelligence/", region: "global", type: "reporting" },
  { key: "decoder", name: "The Decoder", feedUrl: "https://the-decoder.com/feed/", homepage: "https://the-decoder.com/", region: "global", type: "reporting" },
  { key: "techcabal", name: "TechCabal", feedUrl: "https://techcabal.com/feed/", homepage: "https://techcabal.com/", region: "africa", type: "reporting", aiOnly: true },
  { key: "techpoint", name: "Techpoint Africa", feedUrl: "https://techpoint.africa/feed/", homepage: "https://techpoint.africa/", region: "africa", type: "reporting", aiOnly: true },
  { key: "disruptafrica", name: "Disrupt Africa", feedUrl: "https://disruptafrica.com/feed/", homepage: "https://disruptafrica.com/", region: "africa", type: "reporting", aiOnly: true }
];
