/**
 * Provisional 2D park layout.
 * Coordinates are in the SVG viewBox space (0..PARK_W, 0..PARK_H).
 * Real caravan positions are not stored in the database, so edit this file to place
 * each Branch_Code. Any outlet NOT listed here is auto-placed on a grid so it still appears.
 */
export const PARK_W = 900;
export const PARK_H = 460;

export const OUTLET_POSITIONS: Record<string, { x: number; y: number }> = {
  // '201': { x: 180, y: 120 },
  // '202': { x: 420, y: 90 },
};

export function resolvePositions(codes: string[]): Record<string, { x: number; y: number }> {
  const result: Record<string, { x: number; y: number }> = {};
  const missing = codes.filter((c) => !OUTLET_POSITIONS[c]);
  const cols = Math.max(1, Math.ceil(Math.sqrt(missing.length * 2)));
  const rows = Math.max(1, Math.ceil(missing.length / cols));
  const padX = 110;
  const padY = 90;
  const stepX = cols > 1 ? (PARK_W - padX * 2) / (cols - 1) : 0;
  const stepY = rows > 1 ? (PARK_H - padY * 2) / (rows - 1) : 0;

  codes.forEach((c) => {
    if (OUTLET_POSITIONS[c]) result[c] = OUTLET_POSITIONS[c];
  });
  missing.forEach((c, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    result[c] = {
      x: cols > 1 ? padX + col * stepX : PARK_W / 2,
      y: rows > 1 ? padY + row * stepY : PARK_H / 2,
    };
  });
  return result;
}

