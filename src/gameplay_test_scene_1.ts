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
import { createRunner } from './runner_creator';
import { createBrick } from './brick_creator';
import { GridSystem } from './grid_system';
import { CameraController } from './camera_controller';

export class GameplayTestScene1 extends Scene<GameContext> {
  private _game_ctx!: GameContext;
  private _stick_runner?: StickRunner;
  private _runner_controller?: RunnerController;
  private _runner_movement_resolve?: RunnerMovementBufferResolve;
  private _camera_controller?: CameraController;
  private _grid?: GridSystem;
  private _bricks?: Actor[];

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

    if (!this._runner_movement_resolve) {
      this._runner_movement_resolve = new RunnerMovementBufferResolve(
        this._stick_runner,
        this._game_ctx
      );
    }

    // reset every time we enter the scene.
    // IMPORTANT: this is where the runner context is first passed to runner.
    // later it's also passed on every fixed update.
    this._stick_runner.resetRunner(this._game_ctx.runner_ctx);

    // three bricks
    if (!this._bricks) {
      this._bricks = [];

      const groundY = 170 + 112;

      const brick1 = createBrick(this.engine, {
        pos: vec(144 + 160 + 160, groundY),
      });
      const brick2 = createBrick(this.engine, {
        pos: vec(144 + 160 + 160 + 16, groundY),
      });
      const brick3 = createBrick(this.engine, {
        pos: vec(144 + 160 + 160 + 16 + 16, groundY),
      });

      this.add(brick1);
      this.add(brick2);
      this.add(brick3);

      this._bricks.push(brick1, brick2, brick3);
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
    // IMPORTANT: order matters. runner controller (state machine) first → movement resolve after
    this._stick_runner.register(this._game_ctx);
    this._runner_controller.register();
    this._runner_movement_resolve.register();
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
    if (this._runner_movement_resolve) {
      this._runner_movement_resolve.unregister();
    }
    if (this._camera_controller) {
      this._camera_controller.unregister();
    }
  }
}
