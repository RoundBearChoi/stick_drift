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
import { RunnerGroundChecker } from './runner_ground_checker';
import { RunnerWallSlideCheck } from './runner_wall_slide_check';
import { createBrick } from './brick_creator';
import { GridDebug } from './debug_grid';
import { CameraController } from './camera_controller';
import { CameraDebug } from './camera_debug';
import { SolidGridSystem, CELL_SIZE } from './solid_grid_system';
import { LevelBoundariesDebug } from './level_boundaries_debug';
import { createDebugFont } from './debug_font';
import { DraculaColorScheme } from './dracula_color_scheme';
import { brickDef } from './brick_type';
import { GreenTrail } from './green_trail';
import { WhiteDust } from './white_dust';
import {
  parseLevelFile,
  LEVEL_FILE_FORMAT,
  LEVEL_FILE_VERSION,
  LevelFile,
} from './level_io';
import { createSpike } from './spike_creator';
import { spikeDef } from './spike_type';

export class GameplayTestScene1 extends Scene<GameContext> {
  private _game_ctx!: GameContext;
  private _stick_runner?: StickRunner;
  private _runner_controller?: RunnerController;
  private _state_switcher?: RunnerStateSwitcher;
  private _runner_move_buffer_resolve?: RunnerMovementBufferResolve;
  private _ground_checker?: RunnerGroundChecker;
  private _wall_slide_check?: RunnerWallSlideCheck;
  private _camera_controller?: CameraController;
  private _camera_debug?: CameraDebug;
  private _grid?: GridDebug;
  private _levelBoundaries?: LevelBoundariesDebug;
  private _solidActors: Actor[] = [];
  private _solid_grid?: SolidGridSystem;
  private _titleLabel?: Label;
  private _green_trail?: GreenTrail;
  private _white_dust?: WhiteDust;
  private readonly _runner_spawn = vec(320, 280);

  private _levelFile?: LevelFile;
  private _levelLoadPromise?: Promise<LevelFile>;
  private _levelLoaded = false;

  onInitialize(_engine: Engine): void {
    this._levelLoadPromise = this.loadDefaultLevel();
  }

  private async loadDefaultLevel(): Promise<LevelFile> {
    try {
      const response = await fetch('./res/levels/default_level.json');
      if (!response.ok) {
        throw new Error(`failed to load default_level.json: ${response.status}`);
      }
      const text = await response.text();
      const levelFile = parseLevelFile(text);
      this._levelFile = levelFile;
      return levelFile;
    } catch (err) {
      console.error(
        'failed to load default_level.json, falling back to empty level',
        err
      );
      const empty: LevelFile = {
        format: LEVEL_FILE_FORMAT,
        version: LEVEL_FILE_VERSION,
        width_cells: 160,
        height_cells: 90,
        bricks: [],
        spikes: [],
      };
      this._levelFile = empty;
      return empty;
    }
  }

  async onActivate(context: SceneActivationContext<GameContext>): Promise<void> {
    this._game_ctx = context.data!;
    console.log('🌊 onActivate gameplay_test_scene_1');

    // scene name label (top-left)
    if (!this._titleLabel) {
      this._titleLabel = new Label({
        text: 'gameplay_test_scene_1',
        pos: vec(8, 8),
        font: createDebugFont(),
      });
      this._titleLabel.color = DraculaColorScheme.cyan;
      this._titleLabel.get(TransformComponent)!.coordPlane = CoordPlane.Screen;
      this.add(this._titleLabel);
    }

    // consume the one-time load (await only if the fetch is still in flight)
    const levelFile = this._levelFile ?? (await this._levelLoadPromise!);

    if (!this._levelLoaded) {
      this._game_ctx.level_ctx.replaceAll(
        levelFile.width_cells,
        levelFile.height_cells,
        levelFile.bricks,
        levelFile.spikes
      );

      this._solid_grid = new SolidGridSystem(
        levelFile.width_cells,
        levelFile.height_cells
      );

      for (const b of levelFile.bricks) {
        const actor = createBrick(this.engine, {
          pos: vec(b.x, b.y),
          type: b.type,
        });
        this.add(actor);
        this._solidActors.push(actor);

        const { width, height } = brickDef(b.type);
        this._solid_grid.registerRect(b.x, b.y, width, height);
      }

      for (const s of levelFile.spikes) {
        const actor = createSpike(this.engine, {
          spike_pos: vec(s.x, s.y),
          spike_type: s.type,
          spike_facing: s.facing,
        });
        this.add(actor);
        this._solidActors.push(actor);

        const { width, height } = spikeDef(s.type);
        this._solid_grid.registerRect(s.x, s.y, width, height);
        this._solid_grid.registerSpikeFace(s.x, s.y, width, height, s.facing);
      }

      this._levelLoaded = true;
      console.log(
        `loaded level (${levelFile.bricks.length} bricks, ${levelFile.spikes.length} spikes)`
      );
    }

    // stick runner
    if (!this._stick_runner) {
      this._stick_runner = new StickRunner({
        pos: this._runner_spawn.clone(),
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

    if (!this._runner_move_buffer_resolve) {
      this._runner_move_buffer_resolve = new RunnerMovementBufferResolve(
        this._stick_runner,
        this._game_ctx,
        this._solid_grid!
      );
    }

    if (!this._ground_checker) {
      this._ground_checker = new RunnerGroundChecker(
        this._stick_runner,
        this._game_ctx,
        this._solid_grid!
      );
    }

    if (!this._wall_slide_check) {
      this._wall_slide_check = new RunnerWallSlideCheck(
        this._stick_runner,
        this._game_ctx,
        this._solid_grid!
      );
    }

    // reset every time we enter the scene.
    // this is where the runner context is first passed to runner.
    // later it's also passed on every fixed update.
    this._stick_runner.resetRunner(this._game_ctx.runner_ctx, this._runner_spawn);

    // grid is added to scene after the runner so it draws on top
    if (!this._grid) {
      this._grid = new GridDebug(8);
      this.add(this._grid);
    }

    // level boundaries debug (added to scene after grid so it draws on top of the grid lines)
    if (!this._levelBoundaries) {
      const widthPx = this._game_ctx.level_width_cells * CELL_SIZE;
      const heightPx = this._game_ctx.level_height_cells * CELL_SIZE;
      this._levelBoundaries = new LevelBoundariesDebug(widthPx, heightPx);
      this.add(this._levelBoundaries);
    }

    if (!this._green_trail) {
      this._green_trail = new GreenTrail(
        this._stick_runner,
        this._game_ctx,
        this.engine,
        this._solid_grid!
      );
    }
    this._green_trail.setSolidGrid(this._solid_grid!);
    this._green_trail.attachToScene((actor) => this.add(actor));
    this._green_trail.clear();

    if (!this._white_dust) {
      this._white_dust = new WhiteDust(this._stick_runner, this._game_ctx);
    }
    this._white_dust.attachToScene((actor) => this.add(actor));
    this._white_dust.clear();

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
    this._wall_slide_check.register();
    this._stick_runner.register(this._game_ctx);
    this._runner_move_buffer_resolve.register();
    this._green_trail.register();
    this._white_dust.register();
    this._state_switcher.register();
    this._camera_controller.register();
  }

  onPostUpdate(engine: Engine, elapsed: number): void {
    this._game_ctx.update(engine, elapsed);
  }

  onDeactivate(): void {
    // unregister so they stop being ticked after leaving the scene.
    // we reuse the same instances when we return instead of creating new ones.
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
    if (this._wall_slide_check) {
      this._wall_slide_check.unregister();
    }
    if (this._green_trail) {
      this._green_trail.unregister();
      this._green_trail.clear();
    }
    if (this._white_dust) {
      this._white_dust.unregister();
      this._white_dust.clear();
    }
    if (this._camera_controller) {
      this._camera_controller.unregister();
    }
  }

  /** exposed for future collision resolve step */
  get solidGrid(): SolidGridSystem {
    if (!this._solid_grid) {
      throw new Error('SolidGrid not created yet. Activate the scene first.');
    }
    return this._solid_grid;
  }
}
