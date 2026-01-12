export const GRID_PX = 16;
export const CANVAS_PX = 8000;

export function getCanvasGrid() {
  const cols = Math.floor(CANVAS_PX / GRID_PX);
  const rows = Math.floor(CANVAS_PX / GRID_PX);
  const originX = Math.floor(cols / 2);
  const originY = Math.floor(rows / 2);
  return { cols, rows, originX, originY };
}
