import {
  Actor,
  Engine,
  ExcaliburGraphicsContext,
  vec,
} from 'excalibur';
import { CELL_SIZE } from './solid_grid';
import { DraculaColorScheme } from './dracula_color_scheme';

/**
 * visual helper for level_editor_test_scene.
 * Moves itself to the nearest grid point under the mouse and draws a small green circle.
 * Snap points match legal brick top-left positions (multiples of CELL_SIZE).
 */
export class NearestMouseToGrid extends Actor {
  private readonly _radius = 3;
  private readonly _color = DraculaColorScheme.green;

  constructor() {
    super({ name: 'NearestMouseToGrid' });

    // required so Excalibur does not cull an actor with no size/graphics
    this.graphics.forceOnScreen = true;

    this.graphics.onPostDraw = (ctx) => {
      // draw in local space (circle sits on the actor’s own position)
      ctx.drawCircle(vec(0, 0), this._radius, this._color);
    };
  }

  onPreUpdate(engine: Engine): void {
    const pointer = engine.input.pointers.primary;

    // Prefer the more explicit conversion path under CSS scaling
    let worldPos = pointer.lastWorldPos;

    // Fallback / more reliable path when CSS scale is active
    if (pointer.lastScreenPos) {
      worldPos = engine.screen.screenToWorldCoordinates(pointer.lastScreenPos);
    }

    if (!worldPos) return;

    // Snap to nearest grid point (matches brick placement)
    this.pos.x = Math.round(worldPos.x / CELL_SIZE) * CELL_SIZE;
    this.pos.y = Math.round(worldPos.y / CELL_SIZE) * CELL_SIZE;
  }
}
