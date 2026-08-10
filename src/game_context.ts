import { Engine, WebAudio } from 'excalibur';
import { FixedTimestep } from './fixed_timestep';
import { FpsOverlay } from './fps_overlay';

/**
 * single source of truth (similar to RbgGameContext in CFG3).
 * owns the simulation and runs manual fixed timestep.
 */
export class GameContext {
  private readonly fixed = new FixedTimestep(60, 5);

  /** FPS counter + shared on-screen overlay */
  readonly fps_overlay = new FpsOverlay();

  private audio_unlocked = false;

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
   * call this every visual frame from scene's onPostUpdate.
   * passes real elapsed time from Excalibur.
   */
  update(engine: Engine, realElapsed: number): void {
    this.fps_overlay.update(realElapsed);

    this.fixed.step(realElapsed, (dt) => {
      this.fixedUpdate(engine, dt);
    });
  }

  /**
   * run at 60 Hz.
   * all deterministic simulation logic is here.
   */
  private fixedUpdate(engine: Engine, dt: number): void {
    this.fps_overlay.tickFixed();
  }
}
