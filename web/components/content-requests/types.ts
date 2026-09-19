export type EvaluationCriterionScore = {
  criterion: string;
  score: number;
  note: string;
};

export type Evaluation = {
  overallStatus: string | null;
  criterionScores: EvaluationCriterionScore[];
  unsupportedClaims: string[];
  recommendedChanges: string | null;
  createdAt: Date;
};

export type DraftVersion = {
  id: string;
  version: number;
  isRevision: boolean;
  createdAt: Date;
  evaluation: Evaluation | null;
};

export type ArticleOption = {
  id: string;
  variantLabel: string | null;
  title: string | null;
  bodyMarkdown: string | null;
  status: string;
  angle: string | null;
  sources: { title: string | null; url: string }[];
  evaluation: Evaluation | null;
  versions: DraftVersion[];
};

export type ChannelContentItem = {
  id: string;
  channel: "linkedin" | "x" | "newsletter";
  subject: string | null;
  body: string | null;
  status: string;
  evaluation: Evaluation | null;
  versions: DraftVersion[];
};
