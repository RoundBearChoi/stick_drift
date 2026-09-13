import {
  Scene,
  Engine,
  SceneActivationContext,
  Label,
  Actor,
  vec,
  CoordPlane,
  TransformComponent,
} from 'excalibur';
import { GameContext } from './game_context';
import { GridSystem } from './grid_system';
import { LevelBoundariesDebug } from './level_boundaries_debug';
import { createTopLeftFont } from './debug_font';
import { DraculaColorScheme } from './dracula_color_scheme';
import { NearestMouseToGrid } from './nearest_mouse_to_grid';
import { LevelEditorCamMover } from './level_editor_cam_mover';
import { createBrick } from './brick_creator';
import { createSpike } from './spike_creator';
import { EditorMode, EditorModeOverlay, ObjectCategory } from './editor_mode_overlay';
import { EditorPlaceTool, EditorPlacedObject } from './editor_place_tool';
import { EditorSelectTool } from './editor_select_tool';
import { arrBrickPlacement, arrSpikePlacement } from './level_context';

export class LevelEditorTestScene extends Scene<GameContext> {
  private _game_ctx!: GameContext;
  private _grid?: GridSystem;
  private _levelBoundaries?: LevelBoundariesDebug;
  private _titleLabel?: Label;
  private _nearestMouse?: NearestMouseToGrid;
  private _camMover?: LevelEditorCamMover;
  private _modeOverlay?: EditorModeOverlay;
  private _placeTool?: EditorPlaceTool;
  private _selectTool?: EditorSelectTool;
  private _brickActors = new Map<number, Actor>(); // visual brick actors are keyed by placement id
  private _spikeActors = new Map<number, Actor>(); // visual spike actors are keyed by placement id

  /*
  data brick / spike — level_ctx.bricks[] / level_ctx.spikes[]. nothing more than { id, x, y, type }. no sprite no actor.
  visual brick / spike — the Actor created by createBrick() / createSpike() and stored in the maps. excaliburjs render actors.
  */

  onInitialize(_engine: Engine): void {}

  onActivate(context: SceneActivationContext<GameContext>): void {
    this._game_ctx = context.data!;
    console.log('onActivate level_editor_test_scene');

    // shared debug overlays (same pattern as test_scene_1 / test_scene_2)
    this._game_ctx.fps_overlay.attach(this);
    this._game_ctx.screen_resolution_debug.attachToScene(this);

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

    if (!this._modeOverlay) {
      this._modeOverlay = new EditorModeOverlay();
    }
    this._modeOverlay.attach(this);

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

    // rebuild visual solids from shared level data (scene instances are fresh each cycle)
    this.rebuildSolidActors();

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

    if (!this._placeTool) {
      this._placeTool = new EditorPlaceTool(
        this._game_ctx,
        () => this._nearestMouse,
        (placed) => this.spawnPlacedObject(placed)
      );
    }
    this.syncPlacePalette();

    if (!this._selectTool) {
      this._selectTool = new EditorSelectTool(this, this._game_ctx);
    }
    this._selectTool.attach();

    this.applyModeVisuals();

    // free camera mover (arrow keys)
    if (!this._camMover) {
      this._camMover = new LevelEditorCamMover(this, this._game_ctx);
    }
    this._camMover.register();

    // every enter: world origin at view center (safety net even if scene were reused)
    this.camera.pos.x = 640 / 2;
    this.camera.pos.y = 360 / 2;
  }

  onPreUpdate(engine: Engine): void {
    const overlay = this._modeOverlay;
    if (!overlay) return;

    const prevMode = overlay.mode;
    overlay.handleInput(engine);
    if (overlay.mode !== prevMode) {
      this.applyModeVisuals();
    }
    this.syncPlacePalette();

    if (overlay.mode === EditorMode.PlaceObjects) {
      this._placeTool?.handle(engine);
    } else {
      this._selectTool?.handle(engine);
    }
  }

  onPostUpdate(engine: Engine, elapsed: number): void {
    this._game_ctx.update(engine, elapsed);
  }

  onDeactivate(): void {
    if (this._camMover) {
      this._camMover.unregister();
    }
    this._selectTool?.cancelDrag();
  }

  private syncPlacePalette(): void {
    if (!this._placeTool || !this._modeOverlay) return;
    this._placeTool.activeCategory = this._modeOverlay.category;
    this._placeTool.activeBrickType = this._modeOverlay.brickType;
    this._placeTool.activeSpikeType = this._modeOverlay.spikeType;
  }

  private applyModeVisuals(): void {
    const mode = this._modeOverlay?.mode ?? EditorMode.PlaceObjects;
    const isPlace = mode === EditorMode.PlaceObjects;

    if (this._nearestMouse) {
      this._nearestMouse.graphics.visible = isPlace;
    }
    this._selectTool?.setActive(!isPlace);
  }

  private spawnPlacedObject(obj: EditorPlacedObject): void {
    if (obj.category === ObjectCategory.Spikes) {
      this.spawnSpikeActor(obj.placed);
      return;
    }
    this.spawnBrickActor(obj.placed);
  }

  private spawnBrickActor(placed: arrBrickPlacement): void {
    const actor = createBrick(this.engine, {
      pos: vec(placed.x, placed.y),
      type: placed.type,
    });
    this.add(actor);
    this._brickActors.set(placed.id, actor);
  }

  private spawnSpikeActor(placed: arrSpikePlacement): void {
    const actor = createSpike(this.engine, {
      pos: vec(placed.x, placed.y),
      type: placed.type,
    });
    this.add(actor);
    this._spikeActors.set(placed.id, actor);
  }

  /** clear scene solid actors and recreate them from level_ctx */
  private rebuildSolidActors(): void {
    for (const actor of this._brickActors.values()) {
      actor.kill();
    }
    for (const actor of this._spikeActors.values()) {
      actor.kill();
    }
    this._brickActors.clear();
    this._spikeActors.clear();

    for (const b of this._game_ctx.level_ctx.bricks) {
      this.spawnBrickActor(b);
    }
    for (const s of this._game_ctx.level_ctx.spikes) {
      this.spawnSpikeActor(s);
    }
  }
}
