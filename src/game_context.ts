import { Engine, WebAudio } from 'excalibur';
import { FixedTimestep } from './fixed_timestep';
import { FpsOverlay } from './fps_overlay';
import { ScreenResolutionDebug } from './screen_resolution_debug';
import { Tickable } from './tickable';
import { DraculaColorScheme } from './dracula_color_scheme';
import { InputInterpreter } from './input_interpreter';
import { RunnerContext } from './runner_context';
import { LevelContext } from './level_context';

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
  readonly dracula_colors = DraculaColorScheme;

  /** FPS counter + shared on-screen overlay */
  readonly fps_overlay = new FpsOverlay();

  readonly screen_resolution_debug = new ScreenResolutionDebug();

  readonly runner_ctx = new RunnerContext();
  readonly level_ctx = new LevelContext();

  readonly gravity = 4;

  /**
   * convenience accessors so existing call sites keep working.
   * preferred path for new code: game_ctx.level_ctx.width_cells / height_cells.
   * IMPORTANT: change only at scene/level start — not mid-frame.
   */
  get level_width_cells(): number {
    return this.level_ctx.width_cells;
  }
  set level_width_cells(value: number) {
    this.level_ctx.width_cells = value;
  }

  get level_height_cells(): number {
    return this.level_ctx.height_cells;
  }
  set level_height_cells(value: number) {
    this.level_ctx.height_cells = value;
  }

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

  registerTickable(tickable: Tickable): void {
    this._tickables.add(tickable);
  }

  unregisterTickable(tickable: Tickable): void {
    this._tickables.delete(tickable);
  }

  /** this gets called on every visual frame from scene's onPostUpdate. passes real elapsed time from Excalibur for fixed updates. */
  update(engine: Engine, realElapsed: number): void {
    this.fps_overlay.update(realElapsed);

    // sample input once for this visual frame
    if (this._input_interpreter) {
      this._input_interpreter.sample();
    }

    // count fixed updates so we know we can clear input after at least 1 fixed update
    let steps = 0;

    this._fixed_timestep.step(realElapsed, (dt) => {
      steps++;
      this.fixedUpdate(engine, dt);
    });

    // clear input only after at least one fixed step has run
    if (this._input_interpreter && steps > 0) {
      this._input_interpreter.endFrame();
    }
  }

  /** run at 60 Hz. all deterministic simulation logic is here. */
  private fixedUpdate(engine: Engine, dt: number): void {
    this.fps_overlay.tickFixed();

    for (const t of this._tickables) {
      t.fixedUpdate(dt);
    }
  }
}
