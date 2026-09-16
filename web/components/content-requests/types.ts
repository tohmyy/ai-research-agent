export type ArticleOption = {
  id: string;
  variantLabel: string | null;
  title: string | null;
  bodyMarkdown: string | null;
  status: string;
  angle: string | null;
  sources: { title: string | null; url: string }[];
};
