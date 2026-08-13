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
  private _stick_runner?: StickRunner;

  onInitialize(_engine: Engine): void {}

  onActivate(context: SceneActivationContext<GameContext>): void {
    this._game_ctx = context.data!;
    console.log('🌊 onActivate test_scene_1');

    // shared FPS debug
    this._game_ctx.fps_overlay.attach(this);

    // shared resolution debug
    this._game_ctx.resolution_debug.attach(this);

    // add WIP text sprite (temp)
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
            this.engine.halfDrawWidth,
            this.engine.halfDrawHeight - above_center_offset
          ),
        });

        // pure white source × Dracula foreground (tint lives on the Graphic)
        spr.tint = this._game_ctx.dracula_colors.white;
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

    // add runner
    if (!this._stick_runner) {
      this._stick_runner = createStickRunner(this.engine);
      // pure white source × Dracula foreground
      this._stick_runner.applyTint(this._game_ctx.dracula_colors.white);
      this._stick_runner.register(this._game_ctx);
      this.add(this._stick_runner);
    }
  }

  onPostUpdate(engine: Engine, elapsed: number): void {
    this._game_ctx.update(engine, elapsed);
  }

  onDeactivate(): void {
    // clean up so the runner stops being ticked after leaving the scene
    if (this._stick_runner) {
      this._stick_runner.unregister(this._game_ctx);
    }
  }
}
