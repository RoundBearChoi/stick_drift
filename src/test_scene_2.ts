import {
  Scene,
  Engine,
  SceneActivationContext,
  Label,
  vec,
} from 'excalibur';
import { GameContext } from './game_context';
import { createCenterFont } from './debug_font';
import { DraculaColorScheme } from './dracula_color_scheme';

export class TestScene2 extends Scene<GameContext> {
  private ctx!: GameContext;
  private titleLabel?: Label;

  onInitialize(engine: Engine): void {
    this.backgroundColor = DraculaColorScheme.pink;
  }

  onActivate(context: SceneActivationContext<GameContext>): void {
    this.ctx = context.data!;
    console.log('🌊 onActivate test_scene_2');

    // shared FPS overlay
    this.ctx.fps_overlay.attach(this);

    // shared resolution debug (slightly below FPS)
    this.ctx.resolution_debug.attach(this);

    if (!this.titleLabel) {
      this.titleLabel = new Label({
        text: 'TEST_SCENE_2',
        pos: vec(this.engine.halfDrawWidth, this.engine.halfDrawHeight),
        font: createCenterFont(),
      });

      this.titleLabel.color = this.ctx.dracula_colors.white;
      this.add(this.titleLabel);
    }
  }

  onPostUpdate(engine: Engine, elapsed: number): void {
    this.ctx.update(engine, elapsed);
  }

  onDeactivate(): void {
  }
}
