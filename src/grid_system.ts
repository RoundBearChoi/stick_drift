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
      //z: 1000, // we could use z, but we're already adding grid actor after the runner, so it should be fine
    });

    this.cellSize = cellSize;

    // critical: without this, excalibur culls the actor because it has no size/graphics
    this.graphics.forceOnScreen = true;

    // prefer graphics.onPostDraw (recommended by excalibur)
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

    // snap to whole-number multiples of cellSize
    // line renders don't have to be pixel perfect
    const startX = Math.floor(left / size) * size;
    const endX = Math.ceil(right / size) * size;
    const startY = Math.floor(top / size) * size;
    const endY = Math.ceil(bottom / size) * size;

    ctx.save();

    // vertical lines
    for (let x = startX; x <= endX; x += size) {
      ctx.drawLine(vec(x, startY), vec(x, endY), this.lineColor, this.lineThickness);
    }

    // horizontal lines
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
