import {
  Scene,
  Engine,
  SceneActivationContext,
  Actor,
  vec,
  Label,
  CoordPlane,
  TransformComponent,
} from 'excalibur';
import { GameContext } from './game_context';
import { StickRunner } from './stick_runner';
import { RunnerController } from './runner_controller';
import { RunnerStateSwitcher } from './runner_state_switcher';
import { RunnerMovementBufferResolve } from './runner_movement_buffer_resolve';
import { GroundChecker } from './runner_ground_checker';
import { createRunner } from './runner_creator';
import { createBrick } from './brick_creator';
import { GridSystem } from './grid_system';
import { CameraController } from './camera_controller';
import { CameraDebug } from './camera_debug';
import { SolidGrid } from './solid_grid';
import { LevelBoundariesDebug } from './level_boundaries_debug';
import { BRICK_SIZE } from './level_context';
import { createTopLeftFont } from './debug_font';
import { DraculaColorScheme } from './dracula_color_scheme';

export class GameplayTestScene2 extends Scene<GameContext> {
  private _game_ctx!: GameContext;
  private _stick_runner?: StickRunner;
  private _runner_controller?: RunnerController;
  private _state_switcher?: RunnerStateSwitcher;
  private _runner_move_buffer_resolve?: RunnerMovementBufferResolve;
  private _ground_checker?: GroundChecker;
  private _camera_controller?: CameraController;
  private _camera_debug?: CameraDebug;
  private _grid?: GridSystem;
  private _levelBoundaries?: LevelBoundariesDebug;
  private _bricks: Actor[] = [];
  private _solid_grid?: SolidGrid;
  private _titleLabel?: Label;

  onInitialize(_engine: Engine): void {}

  onActivate(context: SceneActivationContext<GameContext>): void {
    this._game_ctx = context.data!;
    console.log('🌊 onActivate gameplay_test_scene_2');

    // scene name label (top-left)
    if (!this._titleLabel) {
      this._titleLabel = new Label({
        text: 'gameplay_test_scene_2',
        pos: vec(8, 8),
        font: createTopLeftFont(),
      });
      this._titleLabel.color = DraculaColorScheme.cyan;
      this._titleLabel.get(TransformComponent)!.coordPlane = CoordPlane.Screen;
      this.add(this._titleLabel);
    }

    const level = this._game_ctx.level_ctx;

    // solid grid — always rebuild from current level dimensions + bricks
    this._solid_grid = new SolidGrid(level.width_cells, level.height_cells);

    // stick runner
    if (!this._stick_runner) {
      this._stick_runner = createRunner({
        pos: vec(320, 280),
      });
      this.add(this._stick_runner);
    }

    if (!this._runner_controller) {
      this._runner_controller = new RunnerController(
        this._stick_runner,
        this._game_ctx
      );
    }

    if (!this._state_switcher) {
      this._state_switcher = new RunnerStateSwitcher(
        this._stick_runner,
        this._game_ctx
      );
    }

    // movement resolve + ground checker need the solid grid — recreate when grid is new
    this._runner_move_buffer_resolve = new RunnerMovementBufferResolve(
      this._stick_runner,
      this._game_ctx,
      this._solid_grid
    );

    this._ground_checker = new GroundChecker(
      this._stick_runner,
      this._game_ctx,
      this._solid_grid
    );

    // reset every time we enter the scene
    this._stick_runner.resetRunner(this._game_ctx.runner_ctx);

    // bricks from level_ctx
    this.buildBricksFromLevelCtx();

    // grid is added to scene after the runner so it draws on top
    if (!this._grid) {
      this._grid = new GridSystem(8);
      this.add(this._grid);
    }

    // level boundaries debug
    if (!this._levelBoundaries) {
      this._levelBoundaries = new LevelBoundariesDebug(
        level.width_px,
        level.height_px
      );
      this.add(this._levelBoundaries);
    }

    // camera
    if (!this._camera_controller) {
      this._camera_controller = new CameraController(this, this._game_ctx);
      this._camera_controller.setFollowTarget(this._stick_runner);
    }

    // camera debug (pure visual, not tickable)
    if (!this._camera_debug) {
      this._camera_debug = new CameraDebug(this._camera_controller, this);
      this.add(this._camera_debug);
    }

    // snap camera first so we don't start with a long catch-up
    this._camera_controller.snapToTarget();

    // IMPORTANT: order matters.
    this._runner_controller.register();
    this._ground_checker.register();
    this._stick_runner.register(this._game_ctx);
    this._runner_move_buffer_resolve.register();
    this._state_switcher.register();
    this._camera_controller.register();
  }

  onPostUpdate(engine: Engine, elapsed: number): void {
    this._game_ctx.update(engine, elapsed);
  }

  onDeactivate(): void {
    if (this._stick_runner) {
      this._stick_runner.unregister(this._game_ctx);
    }
    if (this._runner_controller) {
      this._runner_controller.unregister();
    }
    if (this._state_switcher) {
      this._state_switcher.unregister();
    }
    if (this._runner_move_buffer_resolve) {
      this._runner_move_buffer_resolve.unregister();
    }
    if (this._ground_checker) {
      this._ground_checker.unregister();
    }
    if (this._camera_controller) {
      this._camera_controller.unregister();
    }
  }

  /** load visual bricks + register solids from level_ctx */
  private buildBricksFromLevelCtx(): void {
    // clear previous visual actors (fresh scene instance normally starts empty)
    for (const actor of this._bricks) {
      actor.kill();
    }
    this._bricks = [];

    const level = this._game_ctx.level_ctx;
    if (!this._solid_grid) return;

    this._solid_grid.clearSolidData();

    for (const b of level.bricks) {
      const actor = createBrick(this.engine, { pos: vec(b.x, b.y) });
      this.add(actor);
      this._bricks.push(actor);
      this._solid_grid.registerRect(b.x, b.y, BRICK_SIZE, BRICK_SIZE);
    }

    console.log(
      `🧱 gameplay_test_scene_2 loaded ${level.bricks.length} brick(s) from level_ctx`
    );
  }

  get solidGrid(): SolidGrid {
    if (!this._solid_grid) {
      throw new Error('SolidGrid not created yet. Activate the scene first.');
    }
    return this._solid_grid;
  }
}
