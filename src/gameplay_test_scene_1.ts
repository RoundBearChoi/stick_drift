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

export class GameplayTestScene1 extends Scene<GameContext> {
  private _game_ctx!: GameContext;
  private _stick_runner?: StickRunner;
  private _controller?: StickRunnerController;
  private _grid?: GridSystem;

  onInitialize(_engine: Engine): void {}

  onActivate(context: SceneActivationContext<GameContext>): void {
    this._game_ctx = context.data!;
    console.log('🌊 onActivate gameplay_test_scene_1');

    if (!this._stick_runner) {
      this._stick_runner = createStickRunner(this.engine);
      this.add(this._stick_runner);
    }

    // Grid after the runner so it draws on top (also has high z)
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

    // deterministic start every time we enter the scene
    this._stick_runner.reset();

    // both need to be registered so they receive fixedUpdate
    this._stick_runner.register(this._game_ctx);
    this._controller.register();
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
  }
}
