import { Actor, Vector, vec } from 'excalibur';
import { AsepriteResource } from '@excaliburjs/plugin-aseprite';
import { Resources } from './resources';
import { FrameBasedAnimation } from './frame_based_animation';
import { GameContext } from './game_context';
import { RunnerContext } from './runner_context';
import { Tickable } from './tickable';
import { RunnerState, RunnerStateName } from './states/runner_state';
import { RunnerIdle } from './states/runner_idle';
import { RunnerColliderDebug } from './runner_collider_debug';

export interface RunnerOptions {
  pos?: Vector;
}

/**
 * owns current state + queued state + animation.
 * does not read input itself — runner controller feeds input to the current state.
 * does not swap states mid-update — states queue, RunnerStateSwitcher commits.
 */
export class StickRunner extends Actor implements Tickable {
  private _runner_state: RunnerState = new RunnerIdle(); // starting state (onEnter deferred until reset)
  private _queued_state: RunnerState | null = null;
  private _frame_based_animation!: FrameBasedAnimation;
  private _isFacingRightSide = true;

  /** visual-only collider outline (completely separate from animation + gameplay) */
  private _colliderDebug: RunnerColliderDebug | null = null;

  constructor(options: RunnerOptions = {}) {
    super({
      pos: options.pos ?? vec(0, 0),
    });

    // onEnter cannot be called here. at construction time runner does not have access to runner context.
    // constructor only creates the object and sets placeholder state. no animation is attached yet.
    // onEnter is called either on scene start/reset or when a queued state is committed.
  }

  get state(): RunnerState {
    return this._runner_state;
  }

  get stateName(): RunnerStateName {
    return this._runner_state.state_name;
  }

  get isFacingRightSide(): boolean {
    return this._isFacingRightSide;
  }

  /**
   * sets facing direction and applies horizontal mirror via scale.x.
   * scale.x = -1 flips around the bottom-center anchor.
   */
  setFacingRightSide(facingRight: boolean): void {
    if (this._isFacingRightSide === facingRight) return;

    this._isFacingRightSide = facingRight;
    this.scale.x = facingRight ? 1 : -1;

    // keep the debug box un-mirrored (collider is facing-independent)
    this._colliderDebug?.syncFacing(this.scale.x);
  }

  /**
   * states call this during onFixedUpdate.
   * does not swap yet — RunnerStateSwitcher commits after the state's update returns.
   * last write wins if queued more than once in one tick.
   */
  queueNewState(newState: RunnerState): void {
    this._queued_state = newState;
  }

  /**
   * called by RunnerStateSwitcher after the current state's onFixedUpdate returns.
   * no-ops when nothing is queued.
   */
  commitQueuedState(runnerCtx: RunnerContext): void {
    if (!this._queued_state) return;

    const next = this._queued_state;
    this._queued_state = null;
    this.applyState(next, runnerCtx);
  }

  /** immediate swap. used by reset and by commitQueuedState. */
  private applyState(newState: RunnerState, runnerCtx: RunnerContext): void {
    this._runner_state.onExit?.(this);
    this._runner_state = newState;
    this._runner_state.onEnter(this, runnerCtx);

    console.log('state change:', newState.state_name);
  }

  /**
   * called by states on enter.
   * selects the correct Aseprite resource and applies the given animation speed.
   */
  playAnimationForState(
    stateName: RunnerStateName,
    advancesPerFrame: number
  ): void {
    let resource = Resources.stick_runner_idle;

    switch (stateName) {
      case RunnerStateName.RUN:
        resource = Resources.stick_runner_run;
        break;
      case RunnerStateName.JUMP:
        resource = Resources.stick_runner_jump;
        break;
      case RunnerStateName.FALL:
        resource = Resources.stick_runner_fall;
        break;
      case RunnerStateName.IDLE:
      default:
        resource = Resources.stick_runner_idle;
        break;
    }

    this._frame_based_animation = this.createAnimation(resource, advancesPerFrame);
    this._frame_based_animation.attachToActor(this);
  }

  private createAnimation(
    resource: AsepriteResource,
    advancesPerFrame: number
  ): FrameBasedAnimation {
    const source = resource.getAnimation();

    if (!source) {
      console.warn('Runner animation not loaded yet');
    }

    return new FrameBasedAnimation(source!, advancesPerFrame);
  }

  fixedUpdate(_dt: number): void {
    this._frame_based_animation?.tick();
  }

  register(gameCtx: GameContext): void {
    gameCtx.registerTickable(this);
  }

  unregister(gameCtx: GameContext): void {
    gameCtx.unregisterTickable(this);
  }

  setAnimationSpeed(advancesPerFrame: number): void {
    this._frame_based_animation?.setSpeed(advancesPerFrame);
  }

  /**
   * force a full re-enter of idle state.
   * animation graphic is attached even when already in the idle state. this recreates animation graphic from scratch.
   * (on every onEnter we call playAnimationForState)
   */
  resetRunner(runnerCtx: RunnerContext): void {
    // clear shared simulation buffers so nothing leaks across scene visits
    runnerCtx.reset();

    this._queued_state = null;
    this.applyState(new RunnerIdle(), runnerCtx);
    this.setFacingRightSide(true);
    this.anchor = runnerCtx.anchor;

    // collider debug (visual only)
    if (!this._colliderDebug) {
      this._colliderDebug = new RunnerColliderDebug(this);
    }
    this._colliderDebug.ensure(runnerCtx);
  }

  get currentFrameIndex(): number {
    return this._frame_based_animation?.currentFrameIndex ?? 0;
  }
}
