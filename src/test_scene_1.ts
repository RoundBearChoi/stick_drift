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
import { GameContext } from './game_context';

export class TestScene1 extends Scene<GameContext> {
  private ctx!: GameContext;
  private titleLabel?: Label;
  private fpsLabel?: Label;

  onInitialize(_engine: Engine): void {
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

      // center both axes
      this.titleLabel.font.textAlign = TextAlign.Center; //x
      this.titleLabel.font.baseAlign = BaseAlign.Middle; //y
      this.titleLabel.color = Color.White;

      this.add(this.titleLabel);
    }

    if (!this.fpsLabel) {
      this.fpsLabel = new Label({
        text: 'render fps --  fixedupdate fps --',
        pos: vec(8, 8),
        font: this.ctx.defaultFont.clone(), // clone so we don’t affect other labels
      });

      this.fpsLabel.font.textAlign = TextAlign.Left;
      this.fpsLabel.font.baseAlign = BaseAlign.Top;
      this.fpsLabel.color = Color.White;

      this.add(this.fpsLabel);
    }
  }

  onPostUpdate(engine: Engine, elapsed: number): void {
    this.ctx.update(engine, elapsed);

    if (this.fpsLabel) {
      this.fpsLabel.text = this.ctx.fps.text;
    }
  }

  onDeactivate(): void {
  }
}
