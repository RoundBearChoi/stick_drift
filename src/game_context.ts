import { Engine, WebAudio } from 'excalibur';
import { FixedTimestep } from './fixed_timestep';
import { FpsOverlay } from './fps_overlay';
import { ResolutionDebug } from './resolution_debug';
import { Tickable } from './tickable';
import { DraculaColorScheme } from './dracula_color_scheme';
import { InputInterpreter } from './input_interpreter';
import { RunnerContext } from './runner_context';

export const NATIVE_RESOLUTION = {
  width: 640,
  height: 360,
} as const;

export type Resolution = typeof NATIVE_RESOLUTION;

/**
 * game ctx is the single source of truth (similar to RbgGameContext in CFG3).
 * owns the simulation and runs fixed timesteps.
 */
export class GameContext {
  readonly native_resolution = NATIVE_RESOLUTION;

  /** single source of truth for game colors (Dracula) */
  readonly dracula_colors = DraculaColorScheme;

  /** FPS counter + shared on-screen overlay */
  readonly fps_overlay = new FpsOverlay();

  /** shared on-screen resolution / scale debug label */
  readonly resolution_debug = new ResolutionDebug();

  /** runner tuning values (speed, animation ticks, etc.) */
  readonly runner_ctx = new RunnerContext();

  /** maintain a set of actors(tickables), cycle through them, call fixed update on each */
  private readonly _tickables = new Set<Tickable>();

  private readonly _fixed_timestep = new FixedTimestep(60, 5);
  private audio_unlocked = false;
  private _input_interpreter: InputInterpreter | null = null;

  /** create the input interpreter (call once after Engine exists) */
  createInputInterpreter(engine: Engine): void {
    this._input_interpreter = new InputInterpreter(engine);
  }

  get input(): InputInterpreter {
    if (!this._input_interpreter) {
      throw new Error('InputInterpreter not created yet. Call createInput(engine) first.');
    }
    return this._input_interpreter;
  }

  /** unlock WebAudio (must be called from first user gesture) */
  unlockAudio(): void {
    if (this.audio_unlocked) return;

    WebAudio.unlock();
    this.audio_unlocked = true;
    console.log('✅ WebAudio unlocked');
  }

  /** register for fixed updates */
  registerTickable(tickable: Tickable): void {
    this._tickables.add(tickable);
  }

  unregisterTickable(tickable: Tickable): void {
    this._tickables.delete(tickable);
  }

  /** this gets called on every visual frame from scene's onPostUpdate. passes real elapsed time from Excalibur for fixed updates. */
  update(engine: Engine, realElapsed: number): void {
    this.fps_overlay.update(realElapsed);

    // 1. sample input once for this visual frame
    if (this._input_interpreter) {
      this._input_interpreter.sample();
    }

    // 2. run fixed steps (all Tickables see the same input snapshot)
    this._fixed_timestep.step(realElapsed, (dt) => {
      this.fixedUpdate(engine, dt);
    });

    // 3. clear edge flags after all fixed steps
    if (this._input_interpreter) {
      this._input_interpreter.endFrame();
    }
  }

  /** run at 60 Hz. all deterministic simulation logic is here. */
  private fixedUpdate(engine: Engine, dt: number): void {
    this.fps_overlay.tickFixed();

    /** fixed update every tickable */
    for (const t of this._tickables) {
      t.fixedUpdate(dt);
    }
  }
}
