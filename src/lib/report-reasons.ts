/** Why a visitor reports a shop or an item. */
export const REPORT_REASONS = [
  { id: "sexual", label: "Nudity or sexual content" },
  { id: "scam", label: "Fake shop, scam or fraud" },
  { id: "illegal", label: "Illegal or banned goods" },
  { id: "abuse", label: "Hate, violence or abuse" },
  { id: "copyright", label: "Uses my photos or brand without permission" },
  { id: "other", label: "Something else" },
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number]["id"];

export const reasonLabel = (id: string) => REPORT_REASONS.find((r) => r.id === id)?.label ?? id;
