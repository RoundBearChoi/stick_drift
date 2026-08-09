import { Scene, Engine, SceneActivationContext, Color } from 'excalibur';
import { GameContext } from './game-context';

export class TestScene2 extends Scene<GameContext> {
  private ctx!: GameContext;

  onInitialize(engine: Engine): void {
    this.backgroundColor = Color.fromHex('#ff69b4'); // hot pink so we can clearly tell the difference
  }

  onActivate(context: SceneActivationContext<GameContext>): void {
    this.ctx = context.data!;
    console.log('------ onActivate test_scene_2 ------');
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
