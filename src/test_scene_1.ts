import { Scene, Engine, SceneActivationContext, Color } from 'excalibur';
import { GameContext } from './game-context';

export class TestScene1 extends Scene<GameContext> {
  private ctx!: GameContext;

  onInitialize(engine: Engine): void {

  }

  onActivate(context: SceneActivationContext<GameContext>): void {
    this.ctx = context.data!;
    console.log('------ onActivate test_scene_1 ------');
  }

  /*
   * main update entry point
   * feed real elapsed time into GameContext which runs the fixed timestep
   */
  onPostUpdate(engine: Engine, elapsed: number): void {
    this.ctx.update(engine, elapsed);
  }

  onDeactivate(): void {
    // optional cleanup
  }
}
