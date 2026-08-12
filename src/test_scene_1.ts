import {
  Scene,
  Engine,
  SceneActivationContext,
  Actor,
  vec,
} from 'excalibur';
import { GameContext } from './game_context';
import { Resources } from './resources';
import { Runner } from './stick_runner';

export class TestScene1 extends Scene<GameContext> {
  private _game_ctx!: GameContext;
  private _wip_text?: Actor;
  private _runner?: Runner;

  onInitialize(_engine: Engine): void {}

  onActivate(context: SceneActivationContext<GameContext>): void {
    this._game_ctx = context.data!;
    console.log('🌊 onActivate test_scene_1');

    // shared FPS overlay
    this._game_ctx.fps_overlay.attach(this);

    // shared resolution debug (slightly below FPS)
    this._game_ctx.resolution_debug.attach(this);

    const screen_half_width = this.engine.halfDrawWidth;
    const screen_half_height = this.engine.halfDrawHeight;

    // WIP text sprite — slightly above the center line
    if (!this._wip_text) {
      const sheet = Resources.sprite_wip_text.getSpriteSheet();
      if (!sheet) {
        console.warn('WIP text spritesheet not loaded yet');
      } else {
        const spr = sheet.getSprite(0, 0);
        // place center of sprite a bit above the horizontal center line
        // so the tall text sits mostly in the upper half and leaves room below
        const above_center_offset = 24;

        this._wip_text = new Actor({
          pos: vec(
            screen_half_width,
            screen_half_height - above_center_offset
          ),
        });

        this._wip_text.graphics.use(spr);
        this.add(this._wip_text);

        console.log('------ wip_text position ------');
        console.log({
          sprite_size: { w: spr.width, h: spr.height },
          pos: this._wip_text.pos,
          top: this._wip_text.pos.y - spr.height / 2,
          bottom: this._wip_text.pos.y + spr.height / 2,
        });
      }
    }

    // add stick runner to scene
    if (!this._runner) {
      const gap_from_center = 110; // pixels from screen center down to runner center

      this._runner = new Runner({
        pos: vec(
          screen_half_width,
          screen_half_height + gap_from_center
        ),
        advancesPerFrame: 4,
      });

      this._runner.register(this._game_ctx);
      this.add(this._runner);

      console.log('------ runner created ------');
      console.log({
        half_width: screen_half_width,
        half_height: screen_half_height,
        final_y: screen_half_height + gap_from_center,
        advances_per_frame: 4,
      });
    }
  }

  onPostUpdate(engine: Engine, elapsed: number): void {
    this._game_ctx.update(engine, elapsed);
  }

  onDeactivate(): void {
    // clean up so the animation stops being ticked after leaving the scene
    if (this._runner) {
      this._runner.unregister(this._game_ctx);
    }
  }
}
