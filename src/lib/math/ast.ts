export type MathNode =
  | MathRowNode
  | MathSymbolNode
  | MathFractionNode
  | MathSqrtNode
  | MathScriptNode
  | MathNegNode
  | MathMatrixNode
  | MathCasesNode
  | MathPlaceholderNode;

export type MathRowNode = {
  readonly type: "row";
  readonly children: readonly MathNode[];
};

export type MathSymbolNode = {
  readonly type: "symbol";
  readonly value: string;
};

export type MathFractionNode = {
  readonly type: "frac";
  readonly numerator: MathNode;
  readonly denominator: MathNode;
};

export type MathSqrtNode = {
  readonly type: "sqrt";
  readonly body: MathNode;
  readonly index?: MathNode;
};

export type MathScriptNode = {
  readonly type: "script";
  readonly base: MathNode;
  readonly sub?: MathNode;
  readonly sup?: MathNode;
};

export type MathNegNode = {
  readonly type: "neg";
  readonly body: MathNode;
};

export type MathMatrixNode = {
  readonly type: "matrix";
  readonly rows: readonly (readonly MathNode[])[];
};

export type MathCasesNode = {
  readonly type: "cases";
  readonly rows: readonly {
    readonly body: MathNode;
    readonly condition: MathNode;
  }[];
};

export type MathPlaceholderNode = {
  readonly type: "placeholder";
  readonly label?: string;
};

export const emptyMath: MathPlaceholderNode = { type: "placeholder" };

export function symbol(value: string): MathSymbolNode {
  return { type: "symbol", value };
}

export function row(children: readonly MathNode[]): MathRowNode {
  return { type: "row", children };
}

export function textMath(input: string): MathNode {
  const trimmed = input.trim();
  if (!trimmed) return emptyMath;

  return row(
    trimmed
      .split(/(\s+)/)
      .filter((part) => part.length > 0)
      .map((part) => symbol(part)),
  );
}

export function normalizeMathNode(value: unknown): MathNode | undefined {
  if (!value || typeof value !== "object") return undefined;
  const candidate = value as Record<string, unknown>;

  switch (candidate.type) {
    case "row": {
      const children = Array.isArray(candidate.children)
        ? candidate.children.map(normalizeMathNode).filter((child): child is MathNode => Boolean(child))
        : [];
      return row(children);
    }
    case "symbol":
      return typeof candidate.value === "string" ? symbol(candidate.value) : undefined;
    case "frac": {
      const numerator = normalizeMathNode(candidate.numerator) ?? emptyMath;
      const denominator = normalizeMathNode(candidate.denominator) ?? emptyMath;
      return { type: "frac", numerator, denominator };
    }
    case "sqrt": {
      const body = normalizeMathNode(candidate.body) ?? emptyMath;
      const index = normalizeMathNode(candidate.index);
      return index ? { type: "sqrt", body, index } : { type: "sqrt", body };
    }
    case "script": {
      const base = normalizeMathNode(candidate.base) ?? emptyMath;
      const sub = normalizeMathNode(candidate.sub);
      const sup = normalizeMathNode(candidate.sup);
      return { type: "script", base, ...(sub ? { sub } : {}), ...(sup ? { sup } : {}) };
    }
    case "neg":
      return { type: "neg", body: normalizeMathNode(candidate.body) ?? emptyMath };
    case "matrix": {
      const rows = Array.isArray(candidate.rows)
        ? candidate.rows.map((matrixRow) =>
            Array.isArray(matrixRow)
              ? matrixRow.map(normalizeMathNode).filter((child): child is MathNode => Boolean(child))
              : [],
          )
        : [];
      return { type: "matrix", rows };
    }
    case "cases": {
      const rows = Array.isArray(candidate.rows)
        ? candidate.rows.map((caseRow) => {
            const rowObject = caseRow as Record<string, unknown>;
            return {
              body: normalizeMathNode(rowObject.body) ?? emptyMath,
              condition: normalizeMathNode(rowObject.condition) ?? emptyMath,
            };
          })
        : [];
      return { type: "cases", rows };
    }
    case "placeholder":
      return { type: "placeholder", label: typeof candidate.label === "string" ? candidate.label : undefined };
    default:
      return undefined;
  }
}
