import {
  Scene,
  Engine,
  SceneActivationContext,
  Color,
  Label,
  Actor,
  vec,
} from 'excalibur';
import { GameContext } from './game_context';
import { createCenterFont } from './debug_font';
import { Resources } from './resources';

export class TestScene1 extends Scene<GameContext> {
  private ctx!: GameContext;
  private titleLabel?: Label;
  private runner?: Actor;

  onInitialize(_engine: Engine): void {}

  onActivate(context: SceneActivationContext<GameContext>): void {
    this.ctx = context.data!;
    console.log('🌊 onActivate test_scene_1');

    // shared FPS overlay
    this.ctx.fps_overlay.attach(this);

    // Center title
    if (!this.titleLabel) {
      this.titleLabel = new Label({
        text: 'test_scene_1',
        pos: vec(this.engine.halfDrawWidth, this.engine.halfDrawHeight),
        font: createCenterFont(),
      });

      this.titleLabel.color = Color.White;
      this.add(this.titleLabel);
    }

    // Runner sprite — horizontally centered, placed below the title
    if (!this.runner) {
      const sheet = Resources.Runner.getSpriteSheet();
      if (!sheet) {
        console.warn('Runner spritesheet not loaded yet');
        return;
      }

      const sprite = sheet.getSprite(0, 0);
      const gap = 28; // pixels between text center and top of sprite

      this.runner = new Actor({
        pos: vec(
          this.engine.halfDrawWidth,
          this.engine.halfDrawHeight + gap + sprite.height / 2
        ),
      });

      this.runner.graphics.use(sprite);
      this.add(this.runner);
    }
  }

  onPostUpdate(engine: Engine, elapsed: number): void {
    this.ctx.update(engine, elapsed);
  }

  onDeactivate(): void {}
}
