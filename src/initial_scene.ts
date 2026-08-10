import {
  Scene,
  Engine,
  SceneActivationContext,
  Color,
  Label,
  vec,
  TextAlign,
  BaseAlign,
  WebAudio,
  //Keys,
} from 'excalibur';
import { GameContext } from './game-context';

/**
 * initial bootstrap
 * "press any key to start" to unlock WebAudio on first user gesture
 */
export class InitialScene extends Scene<GameContext> {
  private ctx!: GameContext;
  private promptLabel?: Label;
  private hasStarted = false;

  onInitialize(_engine: Engine): void {
  }

  onActivate(context: SceneActivationContext<GameContext>): void {
    this.ctx = context.data!;
    this.hasStarted = false;
    console.log('------ onActivate initial_scene ------');

    if (!this.promptLabel) {
      this.promptLabel = new Label({
        text: 'press any key to start',
        pos: vec(this.engine.halfDrawWidth, this.engine.halfDrawHeight),
        font: this.ctx.defaultFont,
      });

      this.promptLabel.font.textAlign = TextAlign.Center;
      this.promptLabel.font.baseAlign = BaseAlign.Middle;
      this.promptLabel.color = Color.White;

      this.add(this.promptLabel);
    }

    // listen for first user gesture
    this.engine.input.keyboard.on('press', this.onUserGesture);
    this.engine.input.pointers.primary.on('down', this.onUserGesture);
  }

  private onUserGesture = (_evt?: unknown): void => {
    if (this.hasStarted) return;
    this.hasStarted = true;

    // request audio context unlock
    WebAudio.unlock();

    console.log('[initial_scene] user gesture received → going to test_scene_1');

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
