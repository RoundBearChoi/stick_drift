import {
  Actor,
  Engine,
  vec,
} from 'excalibur';
import { CELL_SIZE } from './solid_grid_system';
import { DraculaColorScheme } from './dracula_color_scheme';
import { getEditorWorldPos } from './editor_world_pos';

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

  /** extra snap cells for an in-progress place-drag line */
  private _guideDots: { x: number; y: number }[] = [];

  constructor() {
    super({
      name: 'NearestMouseToGrid',
      pos: vec(0, 0),
    });

    // required so Excalibur does not cull an actor with no size/graphics
    this.graphics.forceOnScreen = true;

    this.graphics.onPostDraw = (ctx) => {
      // guide dots are already inside the level; keep them visible even if
      // the live cursor itself has gone outside the bounds
      for (const cell of this._guideDots) {
        if (
          this._isInsideLevel &&
          cell.x === this.pos.x &&
          cell.y === this.pos.y
        ) {
          continue; // live cursor circle already covers this cell
        }
        ctx.drawCircle(
          vec(cell.x - this.pos.x, cell.y - this.pos.y),
          this._radius,
          this._color
        );
      }

      // only draw the follow-mouse circle when the snap point is inside the level
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

  /** extra green dots for the current place-drag line (empty = none) */
  setGuideDots(cells: readonly { x: number; y: number }[]): void {
    this._guideDots = cells.map((c) => ({ x: c.x, y: c.y }));
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
    this._guideDots = [];
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

    const worldPos = getEditorWorldPos(engine);
    if (!worldPos) return;

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
