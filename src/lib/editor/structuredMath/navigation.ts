import { mathClass, selector, span, type CursorEdge } from "./dom";
import type { StructuredMathViewOptions } from "./types";

export function handleRootPointer(event: MouseEvent, root: HTMLElement): void {
  const target = event.target instanceof HTMLElement ? event.target : undefined;
  const leaf =
    target?.closest<HTMLElement>(selector(mathClass.leaf)) ??
    closestLeafFromPoint(root, event.clientX, event.clientY);
  if (!leaf) return;

  event.preventDefault();
  event.stopPropagation();
  focusRoot(root);
  setCursor(root, leaf, edgeFromPoint(leaf, event.clientX));
}

export function handleRootKeyDown(
  event: KeyboardEvent,
  root: HTMLElement,
  options: StructuredMathViewOptions,
): void {
  if (
    !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Escape"].includes(
      event.key,
    )
  )
    return;

  if (event.key === "Escape") {
    clearCursor(root);
    options.editor.view.focus();
    return;
  }

  const current = activeLeaf(root) ?? firstLeaf(root, "start");
  if (!current) return;

  const target =
    event.key === "ArrowLeft"
      ? relativeLeaf(root, current, -1)
      : event.key === "ArrowRight"
        ? relativeLeaf(root, current, 1)
        : verticalLeaf(current, event.key === "ArrowUp" ? "up" : "down");

  if (!target) {
    clearCursor(root);
    options.editor.view.focus();
    return;
  }

  event.preventDefault();
  event.stopPropagation();
  setCursor(
    root,
    target,
    event.key === "ArrowLeft" || event.key === "ArrowUp" ? "end" : "start",
  );
}

export function clearCursor(root: HTMLElement): void {
  root
    .querySelectorAll(selector(mathClass.activeLeaf))
    .forEach((element) => element.classList.remove(mathClass.activeLeaf));
  root.querySelector<HTMLElement>(selector(mathClass.cursor))?.remove();
  delete root.dataset.cursorPath;
  delete root.dataset.cursorEdge;
}

function focusRoot(root: HTMLElement): void {
  root.focus({ preventScroll: true });
}

function activeLeaf(root: HTMLElement): HTMLElement | undefined {
  const path = root.dataset.cursorPath;
  if (!path) return undefined;
  return editableLeaves(root).find((leaf) => leaf.dataset.path === path);
}

function setCursor(
  root: HTMLElement,
  leaf: HTMLElement,
  edge: CursorEdge,
): void {
  root
    .querySelectorAll(selector(mathClass.activeLeaf))
    .forEach((element) => element.classList.remove(mathClass.activeLeaf));
  leaf.classList.add(mathClass.activeLeaf);
  root.dataset.cursorPath = leaf.dataset.path ?? "";
  root.dataset.cursorEdge = edge;
  positionCursor(root, leaf, edge);
}

function positionCursor(
  root: HTMLElement,
  leaf: HTMLElement,
  edge: CursorEdge,
): void {
  let cursor = root.querySelector<HTMLElement>(selector(mathClass.cursor));
  if (!cursor) {
    cursor = span(mathClass.cursor);
    root.appendChild(cursor);
  }

  const rootBox = root.getBoundingClientRect();
  const leafBox = leaf.getBoundingClientRect();
  const x =
    edge === "start"
      ? leafBox.left - rootBox.left
      : leafBox.right - rootBox.left;
  cursor.style.left = `${x}px`;
  cursor.style.top = `${leafBox.top - rootBox.top}px`;
  cursor.style.height = `${Math.max(leafBox.height, 12)}px`;
}

function relativeLeaf(
  root: HTMLElement,
  current: HTMLElement,
  direction: 1 | -1,
): HTMLElement | undefined {
  const leaves = editableLeaves(root);
  const index = leaves.indexOf(current);
  return index >= 0 ? leaves[index + direction] : undefined;
}

function verticalLeaf(
  current: HTMLElement,
  direction: "up" | "down",
): HTMLElement | undefined {
  const fraction = current.closest<HTMLElement>(selector(mathClass.frac));
  if (fraction) {
    const inNumerator = current.closest(selector(mathClass.fracNumerator));
    const inDenominator = current.closest(selector(mathClass.fracDenominator));

    if (direction === "up" && inDenominator) {
      return firstLeaf(
        fraction.querySelector<HTMLElement>(selector(mathClass.fracNumerator)),
        "end",
      );
    }

    if (direction === "down" && inNumerator) {
      return firstLeaf(
        fraction.querySelector<HTMLElement>(
          selector(mathClass.fracDenominator),
        ),
        "start",
      );
    }
  }

  const script = current.closest<HTMLElement>(selector(mathClass.script));
  if (script) {
    if (direction === "up") {
      return (
        firstLeaf(
          script.querySelector<HTMLElement>(selector(mathClass.scriptSup)),
          "end",
        ) ??
        firstLeaf(
          script.querySelector<HTMLElement>(selector(mathClass.scriptBase)),
          "end",
        )
      );
    }

    return (
      firstLeaf(
        script.querySelector<HTMLElement>(selector(mathClass.scriptSub)),
        "start",
      ) ??
      firstLeaf(
        script.querySelector<HTMLElement>(selector(mathClass.scriptBase)),
        "start",
      )
    );
  }

  const sqrt = current.closest<HTMLElement>(selector(mathClass.sqrt));
  if (sqrt) {
    if (direction === "up" && current.closest(selector(mathClass.sqrtBody))) {
      return firstLeaf(
        sqrt.querySelector<HTMLElement>(selector(mathClass.sqrtIndex)),
        "end",
      );
    }

    if (
      direction === "down" &&
      current.closest(selector(mathClass.sqrtIndex))
    ) {
      return firstLeaf(
        sqrt.querySelector<HTMLElement>(selector(mathClass.sqrtBody)),
        "start",
      );
    }
  }

  const root = current.closest<HTMLElement>(selector(mathClass.root));
  if (!root) return undefined;
  return closestLeafByGeometry(editableLeaves(root), current, direction);
}

function closestLeafFromPoint(
  root: HTMLElement,
  x: number,
  y: number,
): HTMLElement | undefined {
  return editableLeaves(root)
    .map((leaf) => ({
      leaf,
      score: pointDistance(leaf.getBoundingClientRect(), x, y),
    }))
    .sort((a, b) => a.score - b.score)[0]?.leaf;
}

function closestLeafByGeometry(
  leaves: readonly HTMLElement[],
  current: HTMLElement,
  direction: "up" | "down",
): HTMLElement | undefined {
  const currentBox = current.getBoundingClientRect();
  const currentX = currentBox.left + currentBox.width / 2;
  const candidates = leaves.filter((leaf) => {
    if (leaf === current) return false;
    const box = leaf.getBoundingClientRect();
    return direction === "up"
      ? box.bottom <= currentBox.top
      : box.top >= currentBox.bottom;
  });

  return candidates
    .map((leaf) => {
      const box = leaf.getBoundingClientRect();
      const leafX = box.left + box.width / 2;
      const leafY = direction === "up" ? box.bottom : box.top;
      const currentY = direction === "up" ? currentBox.top : currentBox.bottom;
      return {
        leaf,
        score: Math.abs(leafX - currentX) + Math.abs(leafY - currentY) * 1.6,
      };
    })
    .sort((a, b) => a.score - b.score)[0]?.leaf;
}

function editableLeaves(root: HTMLElement): HTMLElement[] {
  return Array.from(
    root.querySelectorAll<HTMLElement>(selector(mathClass.leaf)),
  );
}

function firstLeaf(
  root: HTMLElement | null,
  edge: CursorEdge,
): HTMLElement | undefined {
  if (!root) return undefined;
  const leaves = editableLeaves(root);
  return edge === "start" ? leaves[0] : leaves.at(-1);
}

function edgeFromPoint(leaf: HTMLElement, x: number): CursorEdge {
  const box = leaf.getBoundingClientRect();
  return x < box.left + box.width / 2 ? "start" : "end";
}

function pointDistance(box: DOMRect, x: number, y: number): number {
  const dx = x < box.left ? box.left - x : x > box.right ? x - box.right : 0;
  const dy = y < box.top ? box.top - y : y > box.bottom ? y - box.bottom : 0;
  return dx + dy;
}
