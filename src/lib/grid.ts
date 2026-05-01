/**
 * Compute a Tailwind grid template based on the number of tiles.
 * Returns columns × rows so the meeting view never overlaps and never
 * crops faces. Tuned for 1–25 participants.
 */
export function smartGrid(count: number, hasSpotlight = false, isMobile = false): { cols: number; rows: number } {
  if (isMobile) {
    if (count <= 1) return { cols: 1, rows: 1 };
    if (count === 2) return { cols: 1, rows: 2 };
    if (count <= 4) return { cols: 2, rows: 2 };
    return { cols: 2, rows: Math.ceil(count / 2) };
  }

  if (hasSpotlight) {
    // Spotlight slot takes the main area; the rest live in a side strip.
    if (count <= 1) return { cols: 1, rows: 1 };
    if (count <= 4) return { cols: 1, rows: count - 1 };
    return { cols: 2, rows: Math.ceil((count - 1) / 2) };
  }
  if (count <= 1) return { cols: 1, rows: 1 };
  if (count === 2) return { cols: 2, rows: 1 };
  if (count <= 4) return { cols: 2, rows: 2 };
  if (count <= 6) return { cols: 3, rows: 2 };
  if (count <= 9) return { cols: 3, rows: 3 };
  if (count <= 12) return { cols: 4, rows: 3 };
  if (count <= 16) return { cols: 4, rows: 4 };
  if (count <= 20) return { cols: 5, rows: 4 };
  return { cols: 5, rows: 5 };
}

/** Convert column count to a Tailwind grid-template-columns inline style. */
export function gridStyle(count: number, hasSpotlight = false, isMobile = false): React.CSSProperties {
  const { cols, rows } = smartGrid(count, hasSpotlight, isMobile);
  return {
    gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
    gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
  };
}