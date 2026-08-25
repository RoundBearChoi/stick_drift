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
 * the green circle is hidden when the snap point is outside the level bounds
 * (no clamping — simply not drawn).
 */
export class NearestMouseToGrid extends Actor {
  private readonly _radius = 3;
  private readonly _color = DraculaColorScheme.green;

  /** false until we observe a real mouse move */
  private _followMouse = false;

  /** first sampled page position — used to detect the initial move */
  private _prevPageX: number | null = null;
  private _prevPageY: number | null = null;

  /** level size in world pixels (set from LevelContext on scene activate) */
  private _levelWidthPx = 0;
  private _levelHeightPx = 0;

  /** whether the current snap point is inside the level */
  private _isInsideLevel = false;

  constructor() {
    super({
      name: 'NearestMouseToGrid',
      pos: vec(0, 0),
    });

    // required so Excalibur does not cull an actor with no size/graphics
    this.graphics.forceOnScreen = true;

    this.graphics.onPostDraw = (ctx) => {
      // only draw when the snap point is inside the level
      if (!this._isInsideLevel) return;

      // draw in local space (circle sits on the actor’s own position)
      ctx.drawCircle(vec(0, 0), this._radius, this._color);
    };
  }

  /**
   * tell the cursor the current level size so it can hide when outside.
   * call from the editor scene onActivate (and if level size ever changes).
   */
  setLevelBounds(widthPx: number, heightPx: number): void {
    this._levelWidthPx = widthPx;
    this._levelHeightPx = heightPx;
    this.refreshInsideFlag();
  }

  /** true when the snapped grid point itself is inside the level */
  get isInsideLevel(): boolean {
    return this._isInsideLevel;
  }

  /**
   * put the circle back at world origin and wait for a fresh mouse move.
   * call this from the scene's onActivate every time you enter.
   */
  resetToOrigin(): void {
    this.pos.x = 0;
    this.pos.y = 0;
    this._followMouse = false;
    this._prevPageX = null;
    this._prevPageY = null;
    this.refreshInsideFlag();
  }

  onPreUpdate(engine: Engine): void {
    const pointer = engine.input.pointers.primary;
    const pagePos = pointer.lastPagePos;
    if (!pagePos) return;

    // stay at (0, 0) until the mouse moves
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

    this.refreshInsideFlag();
  }

  private refreshInsideFlag(): void {
    // reject the green dot itself when outside the level (no clamp — just hide)
    this._isInsideLevel =
      this._levelWidthPx > 0 &&
      this._levelHeightPx > 0 &&
      this.pos.x >= 0 &&
      this.pos.y >= 0 &&
      this.pos.x < this._levelWidthPx &&
      this.pos.y < this._levelHeightPx;
  }
}
