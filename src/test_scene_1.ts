import {
  Scene,
  Engine,
  SceneActivationContext,
  Color,
  Label,
  vec,
  TextAlign,
  BaseAlign,
} from 'excalibur';
import { GameContext } from './game-context';

export class TestScene1 extends Scene<GameContext> {
  private ctx!: GameContext;
  private titleLabel?: Label;

  onInitialize(_engine: Engine): void {
    // keep non-context-dependent setup here if needed
  }

  onActivate(context: SceneActivationContext<GameContext>): void {
    this.ctx = context.data!;
    console.log('------ onActivate test_scene_1 ------');

    if (!this.titleLabel) {
      this.titleLabel = new Label({
        text: 'test_scene_1',
        pos: vec(this.engine.halfDrawWidth, this.engine.halfDrawHeight),
        font: this.ctx.defaultFont,
      });

      // Center both axes
      this.titleLabel.font.textAlign = TextAlign.Center;
      this.titleLabel.font.baseAlign = BaseAlign.Middle;
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
