import {
  Scene,
  Engine,
  SceneActivationContext,
  Label,
  vec,
} from 'excalibur';
import { GameContext } from './game_context';
import { GridSystem } from './grid_system';
import { LevelBoundariesDebug } from './level_boundaries_debug';
import { CELL_SIZE } from './solid_grid';
import { createTopLeftFont } from './debug_font';
import { DraculaColorScheme } from './dracula_color_scheme';

export class LevelEditorTestScene extends Scene<GameContext> {
  private _game_ctx!: GameContext;
  private _grid?: GridSystem;
  private _levelBoundaries?: LevelBoundariesDebug;
  private _titleLabel?: Label;

  onInitialize(_engine: Engine): void {}

  onActivate(context: SceneActivationContext<GameContext>): void {
    this._game_ctx = context.data!;
    console.log('🌊 onActivate level_editor_test_scene');

    // shared debug overlays (same pattern as test_scene_1 / test_scene_2)
    this._game_ctx.fps_overlay.attach(this);
    this._game_ctx.resolution_debug.attachToScene(this);

    // title text — top-left, below the FPS / resolution lines
    if (!this._titleLabel) {
      this._titleLabel = new Label({
        text: 'TEST LEVEL EDITOR',
        pos: vec(8, 8 + 16 + 4), // under FPS (y=8) + resolution (y=18)
        font: createTopLeftFont(),
      });
      this._titleLabel.color = DraculaColorScheme.cyan; // or .yellow / .white
      this.add(this._titleLabel);
    }

    // grid (8 px cells, same as gameplay)
    if (!this._grid) {
      this._grid = new GridSystem(8);
      this.add(this._grid);
    }

    // yellow level edge lines
    if (!this._levelBoundaries) {
      const widthPx = this._game_ctx.level_width_cells * CELL_SIZE;
      const heightPx = this._game_ctx.level_height_cells * CELL_SIZE;
      this._levelBoundaries = new LevelBoundariesDebug(widthPx, heightPx);
      this.add(this._levelBoundaries);
    }
  }

  onPostUpdate(engine: Engine, elapsed: number): void {
    this._game_ctx.update(engine, elapsed);
  }

  onDeactivate(): void {
    // nothing to unregister yet (no tickables registered)
  }
}
