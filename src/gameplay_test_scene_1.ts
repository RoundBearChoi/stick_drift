import {
  Scene,
  Engine,
  SceneActivationContext,
  Actor,
  vec,
} from 'excalibur';
import { GameContext } from './game_context';
import { StickRunner } from './stick_runner';
import { RunnerController } from './runner_controller';
import { RunnerMovementBufferResolve } from './runner_movement_buffer_resolve';
import { GroundChecker } from './ground_checker';
import { createRunner } from './runner_creator';
import { createBrick } from './brick_creator';
import { GridSystem } from './grid_system';
import { CameraController } from './camera_controller';
import { SolidGrid } from './solid_grid';

export class GameplayTestScene1 extends Scene<GameContext> {
  private _game_ctx!: GameContext;
  private _stick_runner?: StickRunner;
  private _runner_controller?: RunnerController;
  private _runner_move_buffer_resolve?: RunnerMovementBufferResolve;
  private _ground_checker?: GroundChecker;
  private _camera_controller?: CameraController;
  private _grid?: GridSystem;
  private _bricks?: Actor[]; // keep reference to the actors
  private _solid_grid = new SolidGrid();

  onInitialize(_engine: Engine): void {}

  onActivate(context: SceneActivationContext<GameContext>): void {
    this._game_ctx = context.data!;
    console.log('🌊 onActivate gameplay_test_scene_1');

    // stick runner
    if (!this._stick_runner) {
      this._stick_runner = createRunner(this.engine);
      this.add(this._stick_runner);
    }

    if (!this._runner_controller) {
      this._runner_controller = new RunnerController(
        this._stick_runner,
        this._game_ctx
      );
    }

    if (!this._runner_move_buffer_resolve) {
      this._runner_move_buffer_resolve = new RunnerMovementBufferResolve(
        this._stick_runner,
        this._game_ctx,
        this._solid_grid
      );
    }

    if (!this._ground_checker) {
      this._ground_checker = new GroundChecker(
        this._stick_runner,
        this._game_ctx,
        this._solid_grid
      );
    }

    // reset every time we enter the scene.
    // IMPORTANT: this is where the runner context is first passed to runner.
    // later it's also passed on every fixed update.
    this._stick_runner.resetRunner(this._game_ctx.runner_ctx);

    // bricks
    if (!this._bricks) {
      this._bricks = [];

      const baseY = 280;

      // left side
      const brick0 = createBrick(this.engine, {
        pos: vec(64, baseY - 8),
      });

      // bottom
      const brick1 = createBrick(this.engine, {
        pos: vec(320, baseY + 96),
      });
      const brick2 = createBrick(this.engine, {
        pos: vec(144 + 160 + 160, baseY),
      });
      const brick3 = createBrick(this.engine, {
        pos: vec(144 + 160 + 160 + 16, baseY),
      });
      const brick4 = createBrick(this.engine, {
        pos: vec(144 + 160 + 160 + 16 + 16, baseY),
      });

      // right side
      const brick5 = createBrick(this.engine, {
        pos: vec(144 + 160 + 160 + 160, baseY - 8),
      });

      // add bricks to the scene
      this.add(brick0);
      this.add(brick1);
      this.add(brick2);
      this.add(brick3);
      this.add(brick4);
      this.add(brick5);

      // keep reference to the bricks
      this._bricks.push(brick0, brick1, brick2, brick3, brick4, brick5);

      // IMPORTANT: register into solid grid for collision check
      this._solid_grid.clearSolidData();
      for (const brick of this._bricks) {
        this._solid_grid.registerRect(brick.pos.x, brick.pos.y, 16, 16);
      }
    }

    // grid is added after the runner so it draws on top
    if (!this._grid) {
      this._grid = new GridSystem(8);
      this.add(this._grid);
    }

    // camera
    if (!this._camera_controller) {
      this._camera_controller = new CameraController(this, this._game_ctx);
      this._camera_controller.setFollowTarget(this._stick_runner);
    }

    // snap camera so we don't start with a long catch-up
    this._camera_controller.snapToTarget();

    // register so they receive fixedUpdate
    // IMPORTANT: order matters.
    // runner (anim) → controller (state / write buffer) → movement resolve (apply dx)
    // → ground checker (read final pos, update is_grounded, may force Fall)
    // → camera
    this._stick_runner.register(this._game_ctx);
    this._runner_controller.register();
    this._runner_move_buffer_resolve.register();
    this._ground_checker.register();
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

  /** exposed for future collision resolve step */
  get solidGrid(): SolidGrid {
    return this._solid_grid;
  }
}
