import { mathClass, selector } from "./dom";

export function layoutStructuredMath(root: HTMLElement | null): void {
  if (!root) return;

  root
    .querySelectorAll<HTMLElement>(selector(mathClass.frac))
    .forEach((fraction) => {
      const numerator = fraction.querySelector<HTMLElement>(
        selector(mathClass.fracNumerator),
      );
      const denominator = fraction.querySelector<HTMLElement>(
        selector(mathClass.fracDenominator),
      );
      const rule = fraction.querySelector<HTMLElement>(
        selector(mathClass.fracRule),
      );
      if (!numerator || !denominator || !rule) return;

      const fontSize = Number.parseFloat(getComputedStyle(fraction).fontSize);
      const sep = Math.max(1.5, fontSize * 0.075);
      const ruleWidth = Math.max(1, fontSize * 0.045);
      const width =
        Math.max(numerator.scrollWidth, denominator.scrollWidth) + sep * 2;
      const numeratorHeight = numerator.getBoundingClientRect().height;
      const denominatorHeight = denominator.getBoundingClientRect().height;
      const axisShift = denominatorHeight * 0.42 - numeratorHeight * 0.18;
      fraction.style.setProperty("--frac-width", `${width}px`);
      fraction.style.setProperty("--frac-sep", `${sep}px`);
      fraction.style.setProperty("--frac-rule-width", `${ruleWidth}px`);
      fraction.style.setProperty("--frac-axis-shift", `${axisShift}px`);
    });

  root
    .querySelectorAll<HTMLElement>(selector(mathClass.script))
    .forEach((script) => {
      const base = script.querySelector<HTMLElement>(
        selector(mathClass.scriptBase),
      );
      const slots = script.querySelector<HTMLElement>(
        selector(mathClass.scriptSlots),
      );
      if (!base || !slots) return;

      const baseBox = base.getBoundingClientRect();
      const baseHeight =
        baseBox.height || Number.parseFloat(getComputedStyle(script).fontSize);
      const baseWidth = baseBox.width;
      const fontSize = Number.parseFloat(getComputedStyle(script).fontSize);
      const supOnly = script.classList.contains("math-script--sup-only");
      const subOnly = script.classList.contains("math-script--sub-only");
      const italicCorrection = estimateRightCorrection(
        base.dataset.mathText ?? base.textContent ?? "",
        baseWidth,
        fontSize,
      );
      const offset = supOnly
        ? -baseHeight * 0.54
        : subOnly
          ? baseHeight * 0.28
          : -baseHeight * 0.1;
      slots.style.setProperty("--script-y", `${offset}px`);
      slots.style.setProperty("--script-x", `${italicCorrection}px`);
    });

  root
    .querySelectorAll<HTMLElement>(selector(mathClass.sqrt))
    .forEach((sqrt) => {
      const radical = sqrt.querySelector<HTMLElement>(
        selector(mathClass.sqrtRadical),
      );
      const body = sqrt.querySelector<HTMLElement>(
        selector(mathClass.sqrtBody),
      );
      if (!radical || !body) return;

      const bodyHeight = body.getBoundingClientRect().height;
      const fontSize = Number.parseFloat(getComputedStyle(sqrt).fontSize);
      const radicalScale = Math.max(1.08, bodyHeight / fontSize + 0.25);
      const overbarGap = Math.max(1, fontSize * 0.055);
      sqrt.style.setProperty("--sqrt-scale", String(radicalScale));
      sqrt.style.setProperty("--sqrt-gap", `${overbarGap}px`);
    });
}

function estimateRightCorrection(
  text: string,
  baseWidth: number,
  fontSize: number,
): number {
  if (!text) return 0;

  const last = text.trim().at(-1) ?? "";
  const slanted = /[fijltxyzαβγδπ∂]/i.test(last);
  if (!slanted) return 0;

  return -Math.min(fontSize * 0.08, baseWidth * 0.16);
}
