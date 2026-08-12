import { Engine, WebAudio } from 'excalibur';
import { FixedTimestep } from './fixed_timestep';
import { FpsOverlay } from './fps_overlay';
import { ResolutionDebug } from './resolution_debug';
import { FixedFrameAnimation } from './fixed_frame_animation';

/**
 * single source of truth for native game resolution
 */
export const NATIVE_RESOLUTION = {
  width: 640,
  height: 360,
} as const;

export type Resolution = typeof NATIVE_RESOLUTION;

/**
 * single source of truth (similar to RbgGameContext in CFG3).
 * owns the simulation and runs manual fixed timestep.
 */
export class GameContext {
  readonly native_resolution = NATIVE_RESOLUTION;

  /** FPS counter + shared on-screen overlay */
  readonly fps_overlay = new FpsOverlay();

  /** shared on-screen resolution / scale debug label */
  readonly resolution_debug = new ResolutionDebug();

  private audio_unlocked = false;
  private readonly _fixed_timestep = new FixedTimestep(60, 5);
  private readonly fixed_anims = new Set<FixedFrameAnimation>(); // animations advance based on fixed updates

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
   * register so that animations can advance automatically based on fixed updates.
   */
  registerFixedAnim(anim: FixedFrameAnimation): void {
    this.fixed_anims.add(anim);
  }

  /**
   * unregister when the animation is no longer needed.
   */
  unregisterFixedAnim(anim: FixedFrameAnimation): void {
    this.fixed_anims.delete(anim);
  }

  /**
   * call this every visual frame from scene's onPostUpdate.
   * passes real elapsed time from Excalibur.
   */
  update(engine: Engine, realElapsed: number): void {
    this.fps_overlay.update(realElapsed);

    this._fixed_timestep.step(realElapsed, (dt) => {
      this.fixedUpdate(engine, dt);
    });
  }

  /**
   * run at 60 Hz.
   * all deterministic simulation logic is here.
   */
  private fixedUpdate(engine: Engine, dt: number): void {
    this.fps_overlay.tickFixed();

    // advance all registered fixed-frame animations
    for (const anim of this.fixed_anims) {
      anim.tick();
    }
  }
}
