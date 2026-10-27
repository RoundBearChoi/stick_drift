import {
  Actor,
  Color,
  ExcaliburGraphicsContext,
  vec,
} from 'excalibur';
import { SettingsContext } from './settings_context';
import { assignZ } from './z_order';

/**
 * only renders lines that intersect the current camera viewport.
 * not a Tickable — pure rendering.
 * show_grid_debug on SettingsContext is a live toggle (same pattern as runner debugs).
 */
export class GridDebug extends Actor {
  private cellSize: number;
  private lineColor = Color.fromRGB(140, 140, 160, 0.15);
  private lineThickness = 1;

  constructor(
    private readonly settings: SettingsContext,
    cellSize = 8
  ) {
    super({
      name: 'GridSystem',
    });
    assignZ(this, 'debug_graphics');

    this.cellSize = cellSize;

    // IMPORTANT: without this, excalibur culls the actor because it has no size/graphics
    this.graphics.forceOnScreen = true;

    // prefer graphics.onPostDraw (recommended by excalibur)
    this.graphics.onPostDraw = (ctx) => {
      this.drawGrid(ctx);
    };
  }

  private drawGrid(ctx: ExcaliburGraphicsContext): void {
    if (!this.settings.show_grid_debug) return;

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
}
