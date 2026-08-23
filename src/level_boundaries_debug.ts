import {
  Actor,
  ExcaliburGraphicsContext,
  vec,
} from 'excalibur';
import { DraculaColorScheme } from './dracula_color_scheme';

/**
 * draw outer level boundary in yellow.
 * only the segments that intersect viewport are rendered.
 * pure visual — non tickable.
 *
 * size comes from the current level (GameContext.level_*_cells * CELL_SIZE)
 * so it can change when a different level is loaded.
 */
export class LevelBoundariesDebug extends Actor {
  private readonly _width: number;
  private readonly _height: number;
  private readonly _color = DraculaColorScheme.yellow;
  private readonly _thickness = 1;

  /**
   * @param widthPx  level width in world pixels
   * @param heightPx level height in world pixels
   */
  constructor(widthPx: number, heightPx: number) {
    super({ name: 'LevelBoundariesDebug' });

    this._width = widthPx;
    this._height = heightPx;

    // this is required so Excalibur doesn't cull an actor with no size/graphics
    this.graphics.forceOnScreen = true;

    this.graphics.onPostDraw = (ctx) => this.draw(ctx);
  }

  private draw(ctx: ExcaliburGraphicsContext): void {
    const camera = this.scene?.camera;
    if (!camera) return;

    const { left, right, top, bottom } = camera.viewport;
    const w = this._width;
    const h = this._height;

    // --- top edge (y = 0) ---
    this.drawClippedHorizontal(ctx, 0, 0, w, left, right, top, bottom);

    // --- bottom edge (y = h) ---
    this.drawClippedHorizontal(ctx, h, 0, w, left, right, top, bottom);

    // --- left edge (x = 0) ---
    this.drawClippedVertical(ctx, 0, 0, h, left, right, top, bottom);

    // --- right edge (x = w) ---
    this.drawClippedVertical(ctx, w, 0, h, left, right, top, bottom);
  }

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
    // early out if entire horizontal line is above or below viewport
    if (y < viewTop || y > viewBottom) return;

    // clamp X range to viewport
    const startX = Math.max(x0, viewLeft);
    const endX   = Math.min(x1, viewRight);

    if (startX < endX) {
      ctx.drawLine(vec(startX, y), vec(endX, y), this._color, this._thickness);
    }
  }

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
    // early out if entire vertical line is left or right of viewport
    if (x < viewLeft || x > viewRight) return;

    // clamp Y range to viewport
    const startY = Math.max(y0, viewTop);
    const endY   = Math.min(y1, viewBottom);

    if (startY < endY) {
      ctx.drawLine(vec(x, startY), vec(x, endY), this._color, this._thickness);
    }
  }
}
