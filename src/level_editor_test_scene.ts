import {
  Scene,
  Engine,
  SceneActivationContext,
  Label,
  Actor,
  vec,
  CoordPlane,
  TransformComponent,
  PointerButton,
} from 'excalibur';
import { GameContext } from './game_context';
import { GridSystem } from './grid_system';
import { LevelBoundariesDebug } from './level_boundaries_debug';
import { CELL_SIZE } from './solid_grid';
import { createTopLeftFont } from './debug_font';
import { DraculaColorScheme } from './dracula_color_scheme';
import { NearestMouseToGrid } from './nearest_mouse_to_grid';
import { LevelEditorCamMover } from './level_editor_cam_mover';
import { createBrick } from './brick_creator';
import { BRICK_SIZE } from './level_context';

export class LevelEditorTestScene extends Scene<GameContext> {
  private _game_ctx!: GameContext;
  private _grid?: GridSystem;
  private _levelBoundaries?: LevelBoundariesDebug;
  private _titleLabel?: Label;
  private _nearestMouse?: NearestMouseToGrid;
  private _camMover?: LevelEditorCamMover;
  /** visual brick actors kept in sync with level_ctx.bricks */
  private _brickActors: Actor[] = [];

  onInitialize(_engine: Engine): void {}

  onActivate(context: SceneActivationContext<GameContext>): void {
    this._game_ctx = context.data!;
    console.log('🌊 onActivate level_editor_test_scene');

    // shared debug overlays (same pattern as test_scene_1 / test_scene_2)
    this._game_ctx.fps_overlay.attach(this);
    this._game_ctx.resolution_debug.attachToScene(this);

    // title text
    if (!this._titleLabel) {
      this._titleLabel = new Label({
        text: 'TEST LEVEL EDITOR',
        pos: vec(8, 8 + 16 + 4),
        font: createTopLeftFont(),
      });
      this._titleLabel.color = DraculaColorScheme.cyan;
      this._titleLabel.get(TransformComponent)!.coordPlane = CoordPlane.Screen;
      this.add(this._titleLabel);
    }

    // grid (8 px cells, same as gameplay)
    if (!this._grid) {
      this._grid = new GridSystem(8);
      this.add(this._grid);
    }

    // yellow level edge lines
    if (!this._levelBoundaries) {
      const widthPx = this._game_ctx.level_ctx.width_px;
      const heightPx = this._game_ctx.level_ctx.height_px;
      this._levelBoundaries = new LevelBoundariesDebug(widthPx, heightPx);
      this.add(this._levelBoundaries);
    }

    // rebuild visual bricks from shared level data (scene instances are fresh each cycle)
    this.rebuildBrickActors();

    // green circle that snaps to nearest grid point under the mouse
    if (!this._nearestMouse) {
      this._nearestMouse = new NearestMouseToGrid();
      this.add(this._nearestMouse);
    }
    this._nearestMouse.setLevelBounds(
      this._game_ctx.level_ctx.width_px,
      this._game_ctx.level_ctx.height_px
    );
    // every enter: back to (0, 0) and wait for mouse movement again
    this._nearestMouse.resetToOrigin();

    // free camera mover (arrow keys)
    if (!this._camMover) {
      this._camMover = new LevelEditorCamMover(this, this._game_ctx);
    }
    this._camMover.register();

    // every enter: world origin at view center (safety net even if scene were reused)
    this.camera.pos.x = 640 / 2;
    this.camera.pos.y = 360 / 2;
  }

  /** temp hard coded left click */
  onPreUpdate(engine: Engine): void {
    for (const evt of engine.input.pointers.currentFrameDown) {
      if (evt.button === PointerButton.Left) {
        this.tryPlaceBrickAtCursor();
        break;
      }
    }
  }

  onPostUpdate(engine: Engine, elapsed: number): void {
    this._game_ctx.update(engine, elapsed);
  }

  onDeactivate(): void {
    if (this._camMover) {
      this._camMover.unregister();
    }
  }

  /**
   * place a brick at the current green-dot position if:
   * 1. green dot is inside the level
   * 2. the full 16×16 brick fits inside the level
   * 3. it does not overlap any existing brick
   */
  private tryPlaceBrickAtCursor(): void {
    if (!this._nearestMouse) return;

    // reject when the green dot itself is outside the level
    if (!this._nearestMouse.isInsideLevel) return;

    const placeX = this._nearestMouse.pos.x;
    const placeY = this._nearestMouse.pos.y;
    const level = this._game_ctx.level_ctx;

    if (!level.canPlaceBrick(placeX, placeY, BRICK_SIZE)) {
      return;
    }

    // commit data
    level.addBrick(placeX, placeY);

    // spawn visual
    const actor = createBrick(this.engine, { pos: vec(placeX, placeY) });
    this.add(actor);
    this._brickActors.push(actor);

    console.log(
      `🧱 placed brick at (${placeX}, ${placeY}) — total ${level.bricks.length}`
    );
  }

  /** clear scene brick actors and recreate them from level_ctx */
  private rebuildBrickActors(): void {
    for (const actor of this._brickActors) {
      actor.kill();
    }
    this._brickActors = [];

    const level = this._game_ctx.level_ctx;
    for (const b of level.bricks) {
      const actor = createBrick(this.engine, { pos: vec(b.x, b.y) });
      this.add(actor);
      this._brickActors.push(actor);
    }
  }
}
