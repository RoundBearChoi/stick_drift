import {
  Actor,
  Engine,
  vec,
} from 'excalibur';
import { CELL_SIZE } from './solid_grid';
import { DraculaColorScheme } from './dracula_color_scheme';

/**
 * visual helper for level_editor_test_scene.
 * snap points match legal brick top-left positions (multiples of CELL_SIZE).
 * this script uses a fully manual page → screen conversion because Excalibur’s lastWorldPos / screenToWorldCoordinates drift under custom CSS integer scaling.
 * starts at world (0, 0). only begins following the mouse after the pointer
 */
export class NearestMouseToGrid extends Actor {
  private readonly _radius = 3;
  private readonly _color = DraculaColorScheme.green;

  /** false until we observe a real mouse move */
  private _followMouse = false;

  /** first sampled page position — used to detect the initial move */
  private _prevPageX: number | null = null;
  private _prevPageY: number | null = null;

  constructor() {
    super({
      name: 'NearestMouseToGrid',
      pos: vec(0, 0),
    });

    // required so Excalibur does not cull an actor with no size/graphics
    this.graphics.forceOnScreen = true;

    this.graphics.onPostDraw = (ctx) => {
      // draw in local space (circle sits on the actor’s own position)
      ctx.drawCircle(vec(0, 0), this._radius, this._color);
    };
  }

  onPreUpdate(engine: Engine): void {
    const pointer = engine.input.pointers.primary;
    const pagePos = pointer.lastPagePos;
    if (!pagePos) return;

    // stay at (0, 0) until the mouse actually moves
    if (!this._followMouse) {
      if (this._prevPageX === null || this._prevPageY === null) {
        this._prevPageX = pagePos.x;
        this._prevPageY = pagePos.y;
        return;
      }

      if (pagePos.x === this._prevPageX && pagePos.y === this._prevPageY) {
        return;
      }

      this._followMouse = true;
    }

    const canvas = engine.canvas;
    const rect = canvas.getBoundingClientRect();

    // internal resolution vs displayed CSS size
    // (this is the part that was drifting)
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    // page coordinates → internal screen coordinates
    const screenX = (pagePos.x - rect.left) * scaleX;
    const screenY = (pagePos.y - rect.top) * scaleY;

    const screenPos = vec(screenX, screenY);
    const worldPos = engine.screen.screenToWorldCoordinates(screenPos);

    // snap to nearest grid point (matches brick placement)
    this.pos.x = Math.round(worldPos.x / CELL_SIZE) * CELL_SIZE;
    this.pos.y = Math.round(worldPos.y / CELL_SIZE) * CELL_SIZE;
  }
}
