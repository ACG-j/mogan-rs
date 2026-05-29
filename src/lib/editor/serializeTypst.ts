import type { JSONContent } from "@tiptap/core";
import { escapeTypstText, latexToTypstMath } from "../math/latex";
import { mathNodeFromAttrs, mathToTypst } from "../math/serialize";

export function documentToTypst(doc: JSONContent): string {
  return serializeNodes(doc.content ?? []).trimEnd();
}

function serializeNodes(nodes: JSONContent[]): string {
  return nodes.map(serializeNode).filter(Boolean).join("\n\n");
}

function serializeNode(node: JSONContent): string {
  switch (node.type) {
    case "doc":
      return serializeNodes(node.content ?? []);
    case "paragraph":
      return serializeInline(node.content ?? []);
    case "heading":
      return `${"=".repeat(node.attrs?.level ?? 1)} ${serializeInline(node.content ?? [])}`;
    case "bulletList":
      return serializeList(node, "-");
    case "orderedList":
      return serializeList(node, "+");
    case "listItem":
      return serializeNodes(node.content ?? []);
    case "inlineMath":
      return serializeMath(node);
    case "blockMath":
      return serializeMath(node);
    case "text":
      return escapeTypstText(node.text ?? "");
    default:
      return serializeInline(node.content ?? []);
  }
}

function serializeMath(node: JSONContent): string {
  const mathAst = mathNodeFromAttrs(node.attrs);
  const body = mathAst ? mathToTypst(mathAst) : latexToTypstMath(String(node.attrs?.latex ?? ""));
  return `$ ${body} $`;
}

function serializeInline(nodes: JSONContent[]): string {
  return nodes.map(serializeNode).join("");
}

function serializeList(node: JSONContent, marker: string): string {
  return (node.content ?? [])
    .map((item) => `${marker} ${serializeNode(item).replaceAll("\n", "\n  ")}`)
    .join("\n");
}
