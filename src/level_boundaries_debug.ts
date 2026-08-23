import {
  Actor,
  ExcaliburGraphicsContext,
  vec,
} from 'excalibur';
import { DraculaColorScheme } from './dracula_color_scheme';
import {
  LEVEL_WIDTH_CELLS,
  LEVEL_HEIGHT_CELLS,
  CELL_SIZE,
} from './solid_grid';

/**
 * Draws the outer level boundary (0,0 → 1280×720) in yellow.
 * Only the segments that intersect the current camera viewport are rendered.
 * Pure visual — not a Tickable.
 */
export class LevelBoundariesDebug extends Actor {
  private readonly _width  = LEVEL_WIDTH_CELLS  * CELL_SIZE; // 1280
  private readonly _height = LEVEL_HEIGHT_CELLS * CELL_SIZE; // 720
  private readonly _color  = DraculaColorScheme.yellow;
  private readonly _thickness = 1;

  constructor() {
    super({ name: 'LevelBoundariesDebug' });

    // Required so Excalibur doesn't cull an actor with no size/graphics
    this.graphics.forceOnScreen = true;

    this.graphics.onPostDraw = (ctx) => this.draw(ctx);
  }

  private draw(ctx: ExcaliburGraphicsContext): void {
    const camera = this.scene?.camera;
    if (!camera) return;

    const { left, right, top, bottom } = camera.viewport;
    const w = this._width;
    const h = this._height;

    // --- Top edge (y = 0) ---
    this.drawClippedHorizontal(ctx, 0, 0, w, left, right, top, bottom);

    // --- Bottom edge (y = h) ---
    this.drawClippedHorizontal(ctx, h, 0, w, left, right, top, bottom);

    // --- Left edge (x = 0) ---
    this.drawClippedVertical(ctx, 0, 0, h, left, right, top, bottom);

    // --- Right edge (x = w) ---
    this.drawClippedVertical(ctx, w, 0, h, left, right, top, bottom);
  }

  /**
   * Draw a horizontal line at a fixed Y, clipped to the viewport.
   * Only draws if the line actually intersects the vertical range of the viewport.
   */
  private drawClippedHorizontal(
    ctx: ExcaliburGraphicsContext,
    y: number,
    x0: number,
    x1: number,
    viewLeft: number,
    viewRight: number,
    viewTop: number,
    viewBottom: number
  ): void {
    // Early out if the entire horizontal line is above or below the viewport
    if (y < viewTop || y > viewBottom) return;

    // Clamp X range to viewport
    const startX = Math.max(x0, viewLeft);
    const endX   = Math.min(x1, viewRight);

    if (startX < endX) {
      ctx.drawLine(vec(startX, y), vec(endX, y), this._color, this._thickness);
    }
  }

  /**
   * Draw a vertical line at a fixed X, clipped to the viewport.
   */
  private drawClippedVertical(
    ctx: ExcaliburGraphicsContext,
    x: number,
    y0: number,
    y1: number,
    viewLeft: number,
    viewRight: number,
    viewTop: number,
    viewBottom: number
  ): void {
    // Early out if the entire vertical line is left or right of the viewport
    if (x < viewLeft || x > viewRight) return;

    // Clamp Y range to viewport
    const startY = Math.max(y0, viewTop);
    const endY   = Math.min(y1, viewBottom);

    if (startY < endY) {
      ctx.drawLine(vec(x, startY), vec(x, endY), this._color, this._thickness);
    }
  }
}
