import {
  Scene,
  Engine,
  SceneActivationContext,
  Label,
  vec,
  CoordPlane,
  TransformComponent,
} from 'excalibur';
import { GameContext, NATIVE_RESOLUTION } from './game_context';
import { createTopLeftFont } from './debug_font';

/**
 * "press any key"
 * unlock WebAudio on first user gesture
 */
const PRESS_ANY_KEY = 'press any key';

// QuinqueFive at size 5: 5px ink + 1px gap per cell.
const GLYPH_CELL = 6;
const FONT_SIZE = 5;
const TEXT_W = PRESS_ANY_KEY.length * GLYPH_CELL; // 78
const TEXT_X = (NATIVE_RESOLUTION.width - TEXT_W) / 2; // 281
const TEXT_Y = Math.round((NATIVE_RESOLUTION.height - FONT_SIZE) / 2); // 178

export class GestureScene extends Scene<GameContext> {
  private ctx!: GameContext;
  private press_any_key_label?: Label;
  private first_user_gesture_received = false;

  onInitialize(_engine: Engine): void {
  }

  onActivate(context: SceneActivationContext<GameContext>): void {
    this.ctx = context.data!;
    this.first_user_gesture_received = false;
    console.log('🌊 onActivate gesture_scene');

    if (!this.press_any_key_label) {
      this.press_any_key_label = new Label({
        text: PRESS_ANY_KEY,
        pos: vec(TEXT_X, TEXT_Y),
        font: createTopLeftFont(),
      });

      this.press_any_key_label.color = this.ctx.dracula_colors.white;
      this.press_any_key_label.get(TransformComponent)!.coordPlane = CoordPlane.Screen;
      this.add(this.press_any_key_label);
    }

    // register listeners for that first user gesture
    this.engine.input.keyboard.on('press', this.onUserGesture);
    this.engine.input.pointers.primary.on('down', this.onUserGesture);
  }

  private onUserGesture = (_evt?: unknown): void => {
    if (this.first_user_gesture_received) return;

    this.first_user_gesture_received = true;

    this.ctx.unlockAudio();

    console.log('✅ first user gesture received.. going to gameplay_test_scene_1');

    this.engine.goToScene('gameplay_test_scene_1', {
      sceneActivationData: this.ctx,
    });
  };

  onDeactivate(): void {
    // clean up listeners so they don't fire again later
    this.engine.input.keyboard.off('press', this.onUserGesture);
    this.engine.input.pointers.primary.off('down', this.onUserGesture);
  }

  onPostUpdate(engine: Engine, elapsed: number): void {
    // still drive fixed timestep even on the bootstrap scene
    this.ctx.update(engine, elapsed);
  }
}
