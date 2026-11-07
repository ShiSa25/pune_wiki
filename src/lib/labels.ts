export interface LabelBox {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  selected: boolean;
}

function overlaps(a: LabelBox, b: LabelBox, pad: number): boolean {
  return a.x < b.x + b.w + pad && a.x + a.w + pad > b.x && a.y < b.y + b.h + pad && a.y + a.h + pad > b.y;
}

/** Selected label always stays. Others are dropped when their pill would cover one already kept. */
export function visibleLabelIds(boxes: readonly LabelBox[], pad = 6): string[] {
  const ordered = [...boxes].sort(
    (a, b) => Number(b.selected) - Number(a.selected) || a.y - b.y || a.x - b.x,
  );
  const placed: LabelBox[] = [];
  const shown: string[] = [];
  for (const box of ordered) {
    const hit = placed.some((kept) => overlaps(kept, box, pad));
    if (box.selected || !hit) {
      placed.push(box);
      shown.push(box.id);
    }
  }
  return shown;
}
