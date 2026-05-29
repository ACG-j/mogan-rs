export type LegoRule = {
  readonly trigger: string;
  readonly output: string;
};

export const legoRules: readonly LegoRule[] = [
  { trigger: "<=", output: "\\le" },
  { trigger: ">=", output: "\\ge" },
  { trigger: "!=", output: "\\ne" },
  { trigger: "->", output: "\\to" },
  { trigger: "<-", output: "\\leftarrow" },
  { trigger: "@*", output: "\\otimes" },
  { trigger: "@+", output: "\\oplus" },
  { trigger: "~~", output: "\\approx" },
];

export function applyLegoRules(input: string): string {
  const rule = legoRules.find((candidate) => candidate.trigger === input.trim());
  return rule?.output ?? input;
}
