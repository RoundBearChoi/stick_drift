import {
  Scene,
  Engine,
  SceneActivationContext,
  Color,
  Label,
  vec,
} from 'excalibur';
import { GameContext } from './game_context';
import { createCenterFont } from './debug_font';

export class TestScene1 extends Scene<GameContext> {
  private ctx!: GameContext;
  private titleLabel?: Label;

  onInitialize(_engine: Engine): void {
  }

  onActivate(context: SceneActivationContext<GameContext>): void {
    this.ctx = context.data!;
    console.log('------ onActivate test_scene_1 ------');

    // shared FPS counter
    this.ctx.attachFpsLabel(this);

    if (!this.titleLabel) {
      this.titleLabel = new Label({
        text: 'test_scene_1',
        pos: vec(this.engine.halfDrawWidth, this.engine.halfDrawHeight),
        font: createCenterFont(),
      });

      this.titleLabel.color = Color.White;
      this.add(this.titleLabel);
    }
  }

  onPostUpdate(engine: Engine, elapsed: number): void {
    this.ctx.update(engine, elapsed);
  }

  onDeactivate(): void {
  }
}
