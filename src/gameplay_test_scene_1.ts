import {
  Scene,
  Engine,
  SceneActivationContext,
} from 'excalibur';
import { GameContext } from './game_context';
import { StickRunner } from './stick_runner';
import { StickRunnerController } from './stick_runner_controller';
import { createStickRunner } from './stick_runner_creator';
import { GridSystem } from './grid_system';
import { CameraController } from './camera_controller';

export class GameplayTestScene1 extends Scene<GameContext> {
  private _game_ctx!: GameContext;
  private _stick_runner?: StickRunner;
  private _controller?: StickRunnerController;
  private _camera_controller?: CameraController;
  private _grid?: GridSystem;

  onInitialize(_engine: Engine): void {}

  onActivate(context: SceneActivationContext<GameContext>): void {
    this._game_ctx = context.data!;
    console.log('🌊 onActivate gameplay_test_scene_1');

    if (!this._stick_runner) {
      this._stick_runner = createStickRunner(this.engine);
      this.add(this._stick_runner);
    }

    // grid is added after the runner so it draws on top
    if (!this._grid) {
      this._grid = new GridSystem(8);
      this.add(this._grid);
    }

    if (!this._controller) {
      this._controller = new StickRunnerController(
        this._stick_runner,
        this._game_ctx
      );
    }

    if (!this._camera_controller) {
      this._camera_controller = new CameraController(this, this._game_ctx);
      this._camera_controller.setFollowTarget(this._stick_runner);
    }

    // reset every time we enter the scene.
    // IMPORTANT: this is where the runner context is first passed to runner.
    // later it's also passed on every fixed update.
    this._stick_runner.reset(this._game_ctx.runner_ctx);

    // snap camera so we don't start with a long catch-up
    this._camera_controller.snapToTarget();

    // all need to be registered so they receive fixedUpdate
    this._stick_runner.register(this._game_ctx);
    this._controller.register();
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
    if (this._controller) {
      this._controller.unregister();
    }
    if (this._camera_controller) {
      this._camera_controller.unregister();
    }
  }
}
