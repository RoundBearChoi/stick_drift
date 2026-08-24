import {
  Actor,
  ExcaliburGraphicsContext,
  vec,
} from 'excalibur';
import { CELL_SIZE } from './solid_grid';
import { DraculaColorScheme } from './dracula_color_scheme';

/**
 * visual helper for level_editor_test_scene.
 * snap points are exactly the legal brick top-left positions (multiples of CELL_SIZE).
 */
export class NearestMouseToGrid extends Actor {
  private readonly _radius = 3;
  private readonly _color = DraculaColorScheme.green;

  constructor() {
    super({ name: 'NearestMouseToGrid' });

    // required so Excalibur does not cull an actor that has no size/graphics
    this.graphics.forceOnScreen = true;

    this.graphics.onPostDraw = (ctx) => {
      this.draw(ctx);
    };
  }

  private draw(ctx: ExcaliburGraphicsContext): void {
    const engine = this.scene?.engine;
    if (!engine) return;

    // lastWorldPos is already camera-aware world coordinates
    const worldPos = engine.input.pointers.primary.lastWorldPos;
    if (!worldPos) return; // pointer never active yet

    // Nearest grid point (true nearest, jumps at cell mid-points)
    // This produces exactly the same coordinates a brick's top-left would use.
    const snapX = Math.round(worldPos.x / CELL_SIZE) * CELL_SIZE;
    const snapY = Math.round(worldPos.y / CELL_SIZE) * CELL_SIZE;

    ctx.drawCircle(vec(snapX, snapY), this._radius, this._color);
  }
}
