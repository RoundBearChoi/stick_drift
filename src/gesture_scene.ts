import {
  Scene,
  Engine,
  SceneActivationContext,
  Color,
  Label,
  vec,
} from 'excalibur';
import { GameContext } from './game_context';
import { createCenterFont } from './debug_font';

/**
 * "press any key"
 * unlock WebAudio on first user gesture
 */
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
        text: 'press any key',
        pos: vec(this.engine.halfDrawWidth, this.engine.halfDrawHeight),
        font: createCenterFont(),
      });

      this.press_any_key_label.color = Color.White;
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

    console.log('✅ first user gesture received.. going to test_scene_1');

    this.engine.goToScene('test_scene_1', {
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
