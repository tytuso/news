export type SignalSource = {
  key: string;
  name: string;
  feedUrl: string;
  homepage: string;
  accent: string;
};

export const SIGNAL_SOURCES: SignalSource[] = [
  {
    key: "openai",
    name: "OpenAI",
    feedUrl: "https://openai.com/news/rss.xml",
    homepage: "https://openai.com/news/",
    accent: "OpenAI"
  },
  {
    key: "deepmind",
    name: "Google DeepMind",
    feedUrl: "https://deepmind.google/blog/rss.xml",
    homepage: "https://deepmind.google/blog/",
    accent: "Google"
  },
  {
    key: "huggingface",
    name: "Hugging Face",
    feedUrl: "https://huggingface.co/blog/feed.xml",
    homepage: "https://huggingface.co/blog",
    accent: "Open source"
  },
  {
    key: "github",
    name: "GitHub Changelog",
    feedUrl: "https://github.blog/changelog/feed/",
    homepage: "https://github.blog/changelog/",
    accent: "Developer"
  }
];
