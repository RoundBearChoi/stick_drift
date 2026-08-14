import { Actor, Vector, vec } from 'excalibur';
import { AsepriteResource } from '@excaliburjs/plugin-aseprite';
import { Resources } from './resources';
import { FrameBasedAnimation } from './frame_based_animation';
import { GameContext } from './game_context';
import { Tickable } from './tickable';
import { RunnerState } from './states/runner_state';
import { IdleState } from './states/idle_state';

export interface RunnerOptions {
  pos?: Vector;
  advancesPerFrame?: number;
}

/**
 * owns current state + animation.
 * Does not read input itself — runner controller feeds input to the current state.
 */
export class StickRunner extends Actor implements Tickable {
  private _state: RunnerState = new IdleState();
  private _frame_based_animation: FrameBasedAnimation;
  private readonly _defaultAdvancesPerFrame: number;

  constructor(options: RunnerOptions = {}) {
    super({
      pos: options.pos ?? vec(0, 0),
      // bottom-center pivot — standard for game characters
      anchor: vec(0.5, 1),
    });

    this._defaultAdvancesPerFrame = options.advancesPerFrame ?? 4;

    // currently only one animation exists. all states fall back to it.
    this._frame_based_animation = this.createAnimation(Resources.sprite_runner);
    this._frame_based_animation.attachToActor(this);

    // enter initial state
    this._state.enter(this);
  }

  get state(): RunnerState {
    return this._state;
  }

  get stateName(): string {
    return this._state.name;
  }

  /** states call this to transition. */
  setState(newState: RunnerState): void {
    if (this._state.name === newState.name) return;

    this._state.exit?.(this);
    this._state = newState;
    this._state.enter(this);
  }

  /**
   * called by states on enter.
   */
  playAnimationForState(_stateName: string): void {
    const resource = Resources.sprite_runner;

    this._frame_based_animation = this.createAnimation(resource);
    this._frame_based_animation.attachToActor(this);
  }

  private createAnimation(resource: AsepriteResource): FrameBasedAnimation {
    const source = resource.getAnimation();

    if (!source) {
      console.warn('Runner animation not loaded yet');
    }

    return new FrameBasedAnimation(source!, this._defaultAdvancesPerFrame);
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
