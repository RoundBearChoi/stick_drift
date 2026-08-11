import {
  Scene,
  Engine,
  SceneActivationContext,
  Actor,
  vec,
} from 'excalibur';
import { GameContext } from './game_context';
import { Resources } from './resources';

export class TestScene1 extends Scene<GameContext> {
  private _game_ctx!: GameContext;
  private _wip_text?: Actor;
  private _runner?: Actor;

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

    // idle animation test
    if (!this._runner) {
      // getAnimation() with no argument uses all frames in the .aseprite file.
      // if you later add a Frame Tag in Aseprite (e.g. "run"), switch to Resources.sprite_runner.getAnimation('run')
      const runAnim = Resources.sprite_runner.getAnimation();

      if (!runAnim) {
        console.warn('Runner animation not loaded yet');
      } else {
        // larger gap so the runner sits clearly below the WIP text
        const gap_from_center = 110; // pixels from screen center down to runner center

        this._runner = new Actor({
          pos: vec(
            screen_half_width,
            screen_half_height + gap_from_center
          ),
        });

        this._runner.graphics.use(runAnim);
        this.add(this._runner);

        console.log('------ runner animation position ------');
        console.log({
          half_width: screen_half_width,
          half_height: screen_half_height,
          final_y: screen_half_height + gap_from_center,
        });
      }
    }
  }

  onPostUpdate(engine: Engine, elapsed: number): void {
    this._game_ctx.update(engine, elapsed);
  }

  onDeactivate(): void {}
}
