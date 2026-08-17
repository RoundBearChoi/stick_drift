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
    const startX = Math.floor(left / size) * size;
    const endX = Math.ceil(right / size) * size;
    const startY = Math.floor(top / size) * size;
    const endY = Math.ceil(bottom / size) * size;

    ctx.save();

    // vertical lines — offset by 0.5 so a 1px stroke lands cleanly on the pixel
    // (avoids the classic half-pixel centering that makes lines look 1px off relative to sprites)
    for (let x = startX; x <= endX; x += size) {
      ctx.drawLine(vec(x + 0.5, startY), vec(x + 0.5, endY), this.lineColor, this.lineThickness);
    }

    // horizontal lines — same 0.5 offset
    for (let y = startY; y <= endY; y += size) {
      ctx.drawLine(vec(startX, y + 0.5), vec(endX, y + 0.5), this.lineColor, this.lineThickness);
    }

    ctx.restore();
  }

  /**
   * change grid density (e.g. 8 / 16 / 32)
   * maybe for later
   */
  //setCellSize(size: number): void {
  //  this.cellSize = size;
  //}

  //getCellSize(): number {
  //  return this.cellSize;
  //}
}
