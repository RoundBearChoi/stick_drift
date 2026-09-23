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
import { applySpikeGraphicFacing, createSpike } from './spike_creator';
import { EditorMode, EditorModeOverlay, ObjectCategory } from './editor_mode_overlay';
import { EditorPlaceTool, EditorPlacedObject } from './editor_place_tool';
import { EditorSelectTool } from './editor_select_tool';
import { EditorMoveTool } from './editor_move_tool';
import { EditorDeleteTool } from './editor_delete_tool';
import { EditorRotateTool } from './editor_rotate_tool';
import { arrBrickPlacement, arrSpikePlacement } from './level_context';
import { SpikeFacing, SpikeType, spikeDef } from './spike_type';
import { assignZ } from './z_order';

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
  private _moveTool?: EditorMoveTool;
  private _deleteTool?: EditorDeleteTool;
  private _rotateTool?: EditorRotateTool;
  private _brickActors = new Map<number, Actor>(); // visual brick actors are keyed by placement id
  private _spikeActors = new Map<number, Actor>(); // visual spike actors are keyed by placement id

  /*
  data brick / spike — level_ctx.bricks[] / level_ctx.spikes[]. nothing more than { id, x, y, type, facing? }. no sprite no actor.
  visual brick / spike — the Actor created by createBrick() / createSpike() and stored in the maps. excaliburjs render actors.
  */

  onInitialize(_engine: Engine): void {}

  onActivate(context: SceneActivationContext<GameContext>): void {
    this._game_ctx = context.data!;
    console.log('onActivate level_editor_test_scene');

    // shared debug overlays (same pattern as test_scene_1)
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
      assignZ(this._titleLabel, 'hud');
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

    if (!this._moveTool) {
      this._moveTool = new EditorMoveTool(
        this._game_ctx,
        () => this._selectTool!.selectedSolids(),
        (id, x, y) => this.syncSolidActorPos(id, x, y)
      );
    }

    if (!this._deleteTool) {
      this._deleteTool = new EditorDeleteTool(
        this._game_ctx,
        () => this._selectTool!.selectedSolids(),
        (ids) => this.removeSolidActors(ids)
      );
    }

    if (!this._rotateTool) {
      this._rotateTool = new EditorRotateTool(
        () => this._selectTool!.selectedSolids(),
        (id, facing) => this.syncSpikeActorFacing(id, facing)
      );
    }

    this.applyModeVisuals();

    // free camera mover (arrow keys)
    if (!this._camMover) {
      this._camMover = new LevelEditorCamMover(this, this._game_ctx);
    }
    this._camMover.register();

    // restore last editor view (defaults to native center on first visit)
    this.camera.pos.x = this._game_ctx.editor_cam_x;
    this.camera.pos.y = this._game_ctx.editor_cam_y;
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
      this._moveTool?.handle(engine);
      this._deleteTool?.handle(engine);
      this._rotateTool?.handle(engine);
    }
  }

  onPostUpdate(engine: Engine, elapsed: number): void {
    this._game_ctx.update(engine, elapsed);
  }

  onDeactivate(): void {
    this._game_ctx.editor_cam_x = Math.round(this.camera.pos.x);
    this._game_ctx.editor_cam_y = Math.round(this.camera.pos.y);

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
    this._placeTool.activeSpikeFacing = this._modeOverlay.spikeFacing;
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
      this.spawnSpikeActor(obj.array);
      return;
    }
    this.spawnBrickActor(obj.array);
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
      spike_pos: vec(placed.x, placed.y),
      spike_type: placed.type,
      spike_facing: placed.facing,
    });
    this.add(actor);
    this._spikeActors.set(placed.id, actor);
  }

  private syncSolidActorPos(id: number, x: number, y: number): void {
    const actor = this._brickActors.get(id) ?? this._spikeActors.get(id);
    if (!actor) return;
    actor.pos.x = x;
    actor.pos.y = y;
  }

  private syncSpikeActorFacing(id: number, facing: SpikeFacing): void {
    const actor = this._spikeActors.get(id);
    if (!actor) return;

    const placed = this._game_ctx.level_ctx.spikes.find((s) => s.id === id);
    const def = spikeDef(placed?.type ?? SpikeType.Spike16x16);
    applySpikeGraphicFacing(actor, facing, def.width, def.height);
  }

  private removeSolidActors(ids: number[]): void {
    for (const id of ids) {
      const brick = this._brickActors.get(id);
      if (brick) {
        brick.kill();
        this._brickActors.delete(id);
      }

      const spike = this._spikeActors.get(id);
      if (spike) {
        spike.kill();
        this._spikeActors.delete(id);
      }
    }

    this._selectTool?.clear();
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
