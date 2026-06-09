import type { JSONContent } from "@tiptap/core";
import { row, symbol } from "../math/ast";
import { mathAttrsFromAst } from "../math/serialize";

export function makeInitialContent(): JSONContent {
  return {
    type: "doc",
    content: [
      {
        type: "heading",
        attrs: { level: 1 },
        content: [{ type: "text", text: "全微分" }],
      },
      {
        type: "paragraph",
        content: [
          { type: "text", text: "设 " },
          {
            type: "inlineMath",
            attrs: mathAttrsFromAst(
              row([
                symbol("z=f(x,y)="),
                { type: "script", base: symbol("x"), sup: symbol("y") },
              ]),
            ),
          },
          { type: "text", text: "，则" },
        ],
      },
      {
        type: "blockMath",
        attrs: mathAttrsFromAst(
          row([
            symbol("dz="),
            {
              type: "frac",
              numerator: row([symbol("\\partial"), symbol("z")]),
              denominator: row([symbol("\\partial"), symbol("x")]),
            },
            symbol("\\cdot"),
            symbol("dx+"),
            {
              type: "frac",
              numerator: row([symbol("\\partial"), symbol("z")]),
              denominator: row([symbol("\\partial"), symbol("y")]),
            },
            symbol("\\cdot"),
            symbol("dy=y"),
            { type: "script", base: symbol("x"), sup: row([symbol("y-1")]) },
            symbol("dx+"),
            { type: "script", base: symbol("x"), sup: symbol("y") },
            symbol("\\ln"),
            symbol("xdy"),
          ]),
        ),
      },
      {
        type: "blockMath",
        attrs: mathAttrsFromAst(
          row([
            symbol("dz"),
            { type: "script", base: symbol("\\vert"), sub: symbol("(e,2)") },
            symbol("=2e dx+"),
            { type: "script", base: symbol("e"), sup: symbol("2") },
            symbol("dy"),
          ]),
        ),
      },
    ],
  };
}
