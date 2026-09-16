export type ResearchSource = {
  id: string;
  url: string;
  title: string | null;
  author: string | null;
  publishedAt: Date | null;
  cleanedContent: string | null;
  relevanceScore: number | null;
  included: boolean;
};
