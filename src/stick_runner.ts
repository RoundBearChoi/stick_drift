import { Actor, Vector, vec } from 'excalibur';
import { AsepriteResource } from '@excaliburjs/plugin-aseprite';
import { Resources } from './resources';
import { FrameBasedAnimation } from './frame_based_animation';
import { GameContext } from './game_context';
import { Tickable } from './tickable';
import { RunnerState, RunnerStateName } from './states/runner_state';
import { IdleState } from './states/idle_state';

export interface RunnerOptions {
  pos?: Vector;
  visual_frames_per_tick?: number;
}

/**
 * owns current state + animation.
 * does not read input itself — runner controller feeds input to the current state.
 */
export class StickRunner extends Actor implements Tickable {
  private _runner_state: RunnerState = new IdleState(); // starting state
  private _frame_based_animation: FrameBasedAnimation;
  private readonly _default_visual_frames_per_tick: number;

  constructor(options: RunnerOptions = {}) {
    super({
      pos: options.pos ?? vec(0, 0),
      // bottom-center pivot — standard for game characters
      anchor: vec(0.5, 1),
    });

    this._default_visual_frames_per_tick = options.visual_frames_per_tick ?? 4;

    // start with idle animation; states will swap as needed via playAnimationForState
    this._frame_based_animation = this.createAnimation(Resources.stick_runner_idle);
    this._frame_based_animation.attachToActor(this);

    // enter initial state
    this._runner_state.onEnter(this);
  }

  get state(): RunnerState {
    return this._runner_state;
  }

  get stateName(): RunnerStateName {
    return this._runner_state.state_name;
  }

  /** states call this to transition. */
  setState(newState: RunnerState): void {
    if (this._runner_state.state_name === newState.state_name) return;

    this._runner_state.onExit?.(this);
    this._runner_state = newState;
    this._runner_state.onEnter(this);
  }

  /**
   * called by states on enter.
   * selects the correct Aseprite resource for the given state.
   */
  playAnimationForState(stateName: RunnerStateName): void {
    let resource = Resources.stick_runner_idle;

    switch (stateName) {
      case RunnerStateName.RUN:
        resource = Resources.stick_runner_run;
        break;
      case RunnerStateName.IDLE:
      case RunnerStateName.JUMP:
      default:
        resource = Resources.stick_runner_idle;
        break;
    }

    this._frame_based_animation = this.createAnimation(resource);
    this._frame_based_animation.attachToActor(this);
  }

  private createAnimation(resource: AsepriteResource): FrameBasedAnimation {
    const source = resource.getAnimation();

    if (!source) {
      console.warn('Runner animation not loaded yet');
    }

    return new FrameBasedAnimation(source!, this._default_visual_frames_per_tick);
  }

  fixedUpdate(_dt: number): void {
    this._frame_based_animation.tick();
  }

  register(gameCtx: GameContext): void {
    gameCtx.register(this);
  }

  unregister(gameCtx: GameContext): void {
    gameCtx.unregister(this);
  }

  setAnimationSpeed(advancesPerFrame: number): void {
    this._frame_based_animation.setSpeed(advancesPerFrame);
  }

  reset(): void {
    this.setState(new IdleState());
    this._frame_based_animation.reset();
  }

  get currentFrameIndex(): number {
    return this._frame_based_animation.currentFrameIndex;
  }
}
