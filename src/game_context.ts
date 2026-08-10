import { Engine, WebAudio, Label, Color, vec, Scene } from 'excalibur';
import { FpsCounter } from './fps_counter';
import { createTopLeftFont } from './debug_font';
import { FixedTimestep } from './fixed_timestep';

/**
 * single source of truth (similar to RbgGameContext in CFG3).
 * owns the simulation and runs manual fixed timestep.
 */
export class GameContext {
  private readonly fixed = new FixedTimestep(60, 5);

  /** tracks render FPS and fixed-update FPS */
  readonly fps = new FpsCounter();

  private audio_unlocked = false;

  /** shared FPS overlay label */
  private fpsLabel?: Label;

  /**
   * unlock WebAudio (must be called from first user gesture)
   */
  unlockAudio(): void {
    if (this.audio_unlocked) return;

    WebAudio.unlock();
    this.audio_unlocked = true;
    console.log('✅ WebAudio unlocked');
  }

  /**
   * attach shared fps label to given scene.
   * call this from a scene's onActivate if you want the FPS overlay.
   * for now there's only one shared fps label, so we reuse it across scenes.
   */
  attachFpsLabel(scene: Scene): void {
    if (!this.fpsLabel) {
      this.fpsLabel = new Label({
        text: 'render fps: --  fixed update fps: --',
        pos: vec(8, 8),
        font: createTopLeftFont(),
      });
      this.fpsLabel.color = Color.White;
    }

    scene.add(this.fpsLabel);
  }

  /**
   * call this every visual frame from scene's onPostUpdate.
   * passes real elapsed time from Excalibur.
   */
  update(engine: Engine, realElapsed: number): void {
    this.fps.update(realElapsed);

    this.fixed.step(realElapsed, (dt) => {
      this.fixedUpdate(engine, dt);
    });

    // keep the shared label text up to date
    if (this.fpsLabel) {
      this.fpsLabel.text = this.fps.text;
    }
  }

  /**
   * run at 60 Hz.
   * all deterministic simulation logic is here.
   */
  private fixedUpdate(engine: Engine, dt: number): void {
    this.fps.tickFixed();
  }
}
