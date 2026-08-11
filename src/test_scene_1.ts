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
  private _game_ctx!: GameContext;
  private _title_label?: Label;
  private _runner?: Actor;

  onInitialize(_engine: Engine): void {}

  onActivate(context: SceneActivationContext<GameContext>): void {
    this._game_ctx = context.data!;
    console.log('🌊 onActivate test_scene_1');

    // shared FPS overlay
    this._game_ctx.fps_overlay.attach(this);

    // center title
    if (!this._title_label) {
      this._title_label = new Label({
        text: 'test_scene_1',
        pos: vec(this.engine.halfDrawWidth, this.engine.halfDrawHeight),
        font: createCenterFont(),
      });

      this._title_label.color = Color.White;
      this.add(this._title_label);
    }

    // runner sprite — horizontally centered
    if (!this._runner) {
      const sprite_runner_sheet = Resources.sprite_runner.getSpriteSheet();
      if (!sprite_runner_sheet) {
        console.warn('Runner spritesheet not loaded yet');
        return;
      }

      // debugging sprite position. checking pixel perfect
      // for this specific example, pivot is at center of sprite

      const spr = sprite_runner_sheet.getSprite(0, 0);
      const gap = 28; // pixels between text center and top of sprite

      const screen_half_width: number = this.engine.halfDrawWidth;
      const screen_half_height: number = this.engine.halfDrawHeight;
      const spr_height_center = spr.height / 2;

      console.log("------ position test ------")
      console.log({
        half_width: screen_half_width,
        half_height: screen_half_height,
        sprite_height_center: spr_height_center,
        final_y: screen_half_height + 28 + spr_height_center
      });

      this._runner = new Actor({
        pos: vec(
          screen_half_width,
          screen_half_height + gap + spr_height_center
        ),
      });

      this._runner.graphics.use(spr);
      this.add(this._runner);
    }
  }

  onPostUpdate(engine: Engine, elapsed: number): void {
    this._game_ctx.update(engine, elapsed);
  }

  onDeactivate(): void {}
}
