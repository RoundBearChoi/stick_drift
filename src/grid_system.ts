import {
  Actor,
  Color,
  ExcaliburGraphicsContext,
  vec,
} from 'excalibur';

/**
 * World-aligned grid for level design / placement reference.
 * Draws thin gray lines every `cellSize` pixels (default 8).
 * Only renders lines that intersect the current camera viewport.
 * Not a Tickable — pure rendering.
 */
export class GridSystem extends Actor {
  private cellSize: number;
  private lineColor = Color.fromRGB(140, 140, 160, 0.28);
  private lineThickness = 1;

  constructor(cellSize = 8) {
    super({
      name: 'GridSystem',
      z: 1000, // always draw on top of gameplay actors
    });

    this.cellSize = cellSize;

    // Critical: without this, Excalibur culls the actor because it has no size/graphics
    this.graphics.forceOnScreen = true;

    // Prefer graphics.onPostDraw (recommended by Excalibur)
    this.graphics.onPostDraw = (ctx) => {
      this.drawGrid(ctx);
    };
  }

  private drawGrid(ctx: ExcaliburGraphicsContext): void {
    const camera = this.scene?.camera;
    if (!camera) return;

    const viewport = camera.viewport;
    const { left, right, top, bottom } = viewport;
    const size = this.cellSize;

    // Snap to whole-number multiples of cellSize
    const startX = Math.floor(left / size) * size;
    const endX = Math.ceil(right / size) * size;
    const startY = Math.floor(top / size) * size;
    const endY = Math.ceil(bottom / size) * size;

    ctx.save();

    // Vertical lines
    for (let x = startX; x <= endX; x += size) {
      ctx.drawLine(vec(x, startY), vec(x, endY), this.lineColor, this.lineThickness);
    }

    // Horizontal lines
    for (let y = startY; y <= endY; y += size) {
      ctx.drawLine(vec(startX, y), vec(endX, y), this.lineColor, this.lineThickness);
    }

    ctx.restore();
  }

  /** Change grid density (e.g. 8 / 16 / 32) */
  setCellSize(size: number): void {
    this.cellSize = size;
  }

  getCellSize(): number {
    return this.cellSize;
  }
}
