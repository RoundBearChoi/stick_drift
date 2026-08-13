import { Engine, WebAudio } from 'excalibur';
import { FixedTimestep } from './fixed_timestep';
import { FpsOverlay } from './fps_overlay';
import { ResolutionDebug } from './resolution_debug';

export const NATIVE_RESOLUTION = {
  width: 640,
  height: 360,
} as const;

export type Resolution = typeof NATIVE_RESOLUTION;

/**
 * Anything that needs to advance on the fixed timestep (60 Hz).
 * Actors that have animation, state machines, physics, timers, etc. should implement this.
 */
export interface Tickable {
  /** called once per fixed update */
  fixedUpdate(dt: number): void;
}

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

  /** things that advance every fixed frame (actors, systems, etc.) */
  private readonly _tickables = new Set<Tickable>();

  /** unlock WebAudio (must be called from first user gesture) */
  unlockAudio(): void {
    if (this.audio_unlocked) return;

    WebAudio.unlock();
    this.audio_unlocked = true;
    console.log('✅ WebAudio unlocked');
  }

  /** register something so it receives fixedUpdate every frame */
  register(tickable: Tickable): void {
    this._tickables.add(tickable);
  }

  /** unregister when it should no longer be ticked */
  unregister(tickable: Tickable): void {
    this._tickables.delete(tickable);
  }

  /** call this every visual frame from scene's onPostUpdate. pass real elapsed time from Excalibur. */
  update(engine: Engine, realElapsed: number): void {
    this.fps_overlay.update(realElapsed);

    this._fixed_timestep.step(realElapsed, (dt) => {
      this.fixedUpdate(engine, dt);
    });
  }

  /** run at 60 Hz. all deterministic simulation logic is here. */
  private fixedUpdate(engine: Engine, dt: number): void {
    this.fps_overlay.tickFixed();

    // advance every registered tickable
    for (const t of this._tickables) {
      t.fixedUpdate(dt);
    }
  }
}
