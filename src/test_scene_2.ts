import { Scene, Engine, SceneActivationContext, Color } from 'excalibur';
import { GameContext } from './game_context';

export class TestScene2 extends Scene<GameContext> {
  private ctx!: GameContext;

  onInitialize(engine: Engine): void {
    this.backgroundColor = Color.fromHex('#ff69b4');
  }

  onActivate(context: SceneActivationContext<GameContext>): void {
    this.ctx = context.data!;
    console.log('------ onActivate test_scene_2 ------');
  }

  onPostUpdate(engine: Engine, elapsed: number): void {
    this.ctx.update(engine, elapsed);
  }

  onDeactivate(): void {
  }
}
