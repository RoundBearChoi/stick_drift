import {
  Scene,
  Engine,
  SceneActivationContext,
  Actor,
  vec,
} from 'excalibur';
import { GameContext } from './game_context';
import { Resources } from './resources';
import { StickRunner } from './stick_runner';
import { createStickRunner } from './stick_runner_creator';

export class TestScene1 extends Scene<GameContext> {
  private _game_ctx!: GameContext;
  private _wip_text?: Actor;
  private _runner?: StickRunner;

  onInitialize(_engine: Engine): void {}

  onActivate(context: SceneActivationContext<GameContext>): void {
    this._game_ctx = context.data!;
    console.log('🌊 onActivate test_scene_1');

    // shared FPS debug
    this._game_ctx.fps_overlay.attach(this);

    // shared resolution debug
    this._game_ctx.resolution_debug.attach(this);

    const screen_half_width = this.engine.halfDrawWidth;
    const screen_half_height = this.engine.halfDrawHeight;

    // add WIP text sprite
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

    // create + add stick runner
    if (!this._runner) {
      this._runner = createStickRunner(this.engine);
      this._runner.register(this._game_ctx);
      this.add(this._runner);
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
