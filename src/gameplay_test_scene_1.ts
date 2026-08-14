import {
  Scene,
  Engine,
  SceneActivationContext,
} from 'excalibur';
import { GameContext } from './game_context';
import { StickRunner } from './stick_runner';
import { createStickRunner } from './stick_runner_creator';

export class GameplayTestScene1 extends Scene<GameContext> {
  private _game_ctx!: GameContext;
  private _stick_runner?: StickRunner;

  onInitialize(_engine: Engine): void {}

  onActivate(context: SceneActivationContext<GameContext>): void {
    this._game_ctx = context.data!;
    console.log('🌊 onActivate gameplay_test_scene_1');

    if (!this._stick_runner) {
      this._stick_runner = createStickRunner(this.engine);
      this._stick_runner.register(this._game_ctx);
      this.add(this._stick_runner);
    }
  }

  onPostUpdate(engine: Engine, elapsed: number): void {
    this._game_ctx.update(engine, elapsed);
  }

  onDeactivate(): void {
    // clean up so the runner stops being ticked after leaving the scene
    if (this._stick_runner) {
      this._stick_runner.unregister(this._game_ctx);
    }
  }
}
