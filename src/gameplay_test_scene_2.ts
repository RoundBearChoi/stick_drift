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
import { RunnerSpikeContactCheck } from './runner_spike_contact';
import { createBrick } from './brick_creator';
import { createSpike } from './spike_creator';
import { GridDebug } from './debug_grid';
import { CameraController } from './camera_controller';
import { CameraDebug } from './camera_debug';
import { SolidGridSystem } from './solid_grid_system';
import { LevelBoundariesDebug } from './level_boundaries_debug';
import { brickDef } from './brick_type';
import { spikeDef } from './spike_type';
import { createDebugFont } from './debug_font';
import { DraculaColorScheme } from './dracula_color_scheme';

export class GameplayTestScene2 extends Scene<GameContext> {
  private _game_ctx!: GameContext;
  private _stick_runner?: StickRunner;
  private _runner_controller?: RunnerController;
  private _runner_state_switcher?: RunnerStateSwitcher;
  private _runner_move_buffer_resolve?: RunnerMovementBufferResolve;
  private _runner_ground_checker?: RunnerGroundChecker;
  private _wall_slide_check?: RunnerWallSlideCheck;
  private _spike_contact_check?: RunnerSpikeContactCheck;
  private _camera_controller?: CameraController;
  private _camera_debug?: CameraDebug;
  private _grid?: GridDebug;
  private _levelBoundaries?: LevelBoundariesDebug;
  private _bricks: Actor[] = [];
  private _spikes: Actor[] = [];
  private _solid_grid_system?: SolidGridSystem;
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
        font: createDebugFont(),
      });
      this._titleLabel.color = DraculaColorScheme.cyan;
      this._titleLabel.get(TransformComponent)!.coordPlane = CoordPlane.Screen;
      this.add(this._titleLabel);
    }

    const level = this._game_ctx.level_ctx;

    // solid grid — always rebuild from current level dimensions + bricks + spikes
    this._solid_grid_system = new SolidGridSystem(level.width_cells, level.height_cells);

    // stick runner
    if (!this._stick_runner) {
      this._stick_runner = new StickRunner({
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

    if (!this._runner_state_switcher) {
      this._runner_state_switcher = new RunnerStateSwitcher(
        this._stick_runner,
        this._game_ctx
      );
    }

    // movement resolve + contact checkers need the solid grid — recreate when grid is new
    this._runner_move_buffer_resolve = new RunnerMovementBufferResolve(
      this._stick_runner,
      this._game_ctx,
      this._solid_grid_system
    );

    this._runner_ground_checker = new RunnerGroundChecker(
      this._stick_runner,
      this._game_ctx,
      this._solid_grid_system
    );

    this._wall_slide_check = new RunnerWallSlideCheck(
      this._stick_runner,
      this._game_ctx,
      this._solid_grid_system
    );

    this._spike_contact_check = new RunnerSpikeContactCheck(
      this._stick_runner,
      this._game_ctx,
      this._solid_grid_system
    );

    // reset every time we enter the scene
    this._stick_runner.resetRunner(this._game_ctx.runner_ctx);

    // bricks + spikes from level_ctx
    this.buildSolidsFromLevelCtx();

    // grid is added to scene after the runner so it draws on top
    if (!this._grid) {
      this._grid = new GridDebug(8);
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

    // order matters. ie spike contact runs after movement.
    this._runner_controller.register();
    this._runner_ground_checker.register();
    this._wall_slide_check.register();
    this._stick_runner.register(this._game_ctx);
    this._runner_move_buffer_resolve.register();
    this._spike_contact_check.register();
    this._runner_state_switcher.register();
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
    if (this._runner_state_switcher) {
      this._runner_state_switcher.unregister();
    }
    if (this._runner_move_buffer_resolve) {
      this._runner_move_buffer_resolve.unregister();
    }
    if (this._runner_ground_checker) {
      this._runner_ground_checker.unregister();
    }
    if (this._wall_slide_check) {
      this._wall_slide_check.unregister();
    }
    if (this._spike_contact_check) {
      this._spike_contact_check.unregister();
    }
    if (this._camera_controller) {
      this._camera_controller.unregister();
    }
  }

  /** load visual solids + register occupancy from level_ctx */
  private buildSolidsFromLevelCtx(): void {
    // clear previous visual actors (fresh scene instance normally starts empty)
    for (const actor of this._bricks) {
      actor.kill();
    }
    for (const actor of this._spikes) {
      actor.kill();
    }
    this._bricks = [];
    this._spikes = [];

    const level = this._game_ctx.level_ctx;
    if (!this._solid_grid_system) return;

    this._solid_grid_system.clearSolidData();

    for (const b of level.bricks) {
      const def = brickDef(b.type);
      const actor = createBrick(this.engine, { pos: vec(b.x, b.y), type: b.type });
      this.add(actor);
      this._bricks.push(actor);
      this._solid_grid_system.registerRect(b.x, b.y, def.width, def.height);
    }

    for (const s of level.spikes) {
      const def = spikeDef(s.type);
      const actor = createSpike(this.engine, {
        spike_pos: vec(s.x, s.y),
        spike_type: s.type,
        spike_facing: s.facing,
      });
      this.add(actor);
      this._spikes.push(actor);
      this._solid_grid_system.registerRect(s.x, s.y, def.width, def.height);
      this._solid_grid_system.registerSpikeFace(s.x, s.y, def.width, def.height, s.facing);
    }

    console.log(
      `🧱 gameplay_test_scene_2 loaded ${level.bricks.length} brick(s) + ${level.spikes.length} spike(s) from level_ctx`
    );
  }

  get solidGrid(): SolidGridSystem {
    if (!this._solid_grid_system) {
      throw new Error('SolidGrid not created yet. Activate the scene first.');
    }
    return this._solid_grid_system;
  }
}
