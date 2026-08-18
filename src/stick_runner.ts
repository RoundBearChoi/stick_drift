import { Actor, Vector, vec, ExcaliburGraphicsContext } from 'excalibur';
import { AsepriteResource } from '@excaliburjs/plugin-aseprite';
import { Resources } from './resources';
import { FrameBasedAnimation } from './frame_based_animation';
import { GameContext } from './game_context';
import { RunnerContext } from './runner_context';
import { Tickable } from './tickable';
import { RunnerState, RunnerStateName } from './states/runner_state';
import { RunnerIdle } from './states/runner_idle';
import { DraculaColorScheme } from './dracula_color_scheme';

export interface RunnerOptions {
  pos?: Vector;
}

/**
 * owns current state + animation.
 * does not read input itself — runner controller feeds input to the current state.
 */
export class StickRunner extends Actor implements Tickable {
  private _runner_state: RunnerState = new RunnerIdle(); // starting state (onEnter deferred until reset)
  private _frame_based_animation!: FrameBasedAnimation;
  private _isFacingRightSide = true;

  /** kept so the collider debug draw can read size + flag */
  private _runnerCtx: RunnerContext | null = null;

  /** separate actor so animation graphics stay completely untouched */
  private _colliderDebug: Actor | null = null;

  constructor(options: RunnerOptions = {}) {
    super({
      pos: options.pos ?? vec(0, 0),
    });

    // onEnter cannot be called here. at construction time runner does not have access to runner context.
    // constructor only creates the object and sets placeholder state. no animation is attached yet.
    // onEnter is called either on scene start/reset or when state changes.
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
  }

  /** states call this to transition. */
  setNewState(newState: RunnerState, runnerCtx: RunnerContext): void {
    if (this._runner_state.state_name === newState.state_name) return;

    this._runner_state.onExit?.(this);
    this._runner_state = newState;
    this._runner_state.onEnter(this, runnerCtx);
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
      case RunnerStateName.IDLE:
      case RunnerStateName.JUMP:
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
    this._runnerCtx = runnerCtx; // keep reference for debug draw

    this._runner_state.onExit?.(this); // if onExit exists on the current state, call it. if it doesn’t, do nothing.
    this._runner_state = new RunnerIdle();
    this._runner_state.onEnter(this, runnerCtx);
    this.setFacingRightSide(true);
    this.anchor = runnerCtx.anchor;

    this.ensureColliderDebug();
  }

  get currentFrameIndex(): number {
    return this._frame_based_animation?.currentFrameIndex ?? 0;
  }

  // ------ collider debug (completely separate from animation graphics) ------

  private ensureColliderDebug(): void {
    if (this._colliderDebug) return;

    const debug = new Actor({
      name: 'RunnerColliderDebug',
      // local origin stays at the runner’s pivot (bottom-center)
    });

    // same safety flag GridSystem / CameraController use
    debug.graphics.forceOnScreen = true;

    debug.graphics.onPostDraw = (ctx) => {
      this.drawColliderDebug(ctx);
    };

    this.addChild(debug); // inherits pos + scale.x (facing)
    this._colliderDebug = debug;
  }

  private drawColliderDebug(ctx: ExcaliburGraphicsContext): void {
    const runner_ctx = this._runnerCtx;
    if (!runner_ctx || !runner_ctx.show_collider_debug) return;

    const w = runner_ctx.collider_width;
    const h = runner_ctx.collider_height;
    const halfW = w / 2;

    // local space relative to bottom-center pivot.
    // +1 on both axes is rendering-only compensation so the 1px stroke (classic 1px rasterization mismatch).
    // collider stays clean (bottom at y = 0, centered on x). only the render is offset.
    const x0 = -halfW + 1;
    const y0 = -h + 1;
    const x1 = halfW + 1;
    const y1 = 1;

    const color = DraculaColorScheme.yellow;

    // four lines = outline (keeps animation graphics completely separate)
    ctx.drawLine(vec(x0, y0), vec(x1, y0), color, 1); // top
    ctx.drawLine(vec(x1, y0), vec(x1, y1), color, 1); // right
    ctx.drawLine(vec(x1, y1), vec(x0, y1), color, 1); // bottom
    ctx.drawLine(vec(x0, y1), vec(x0, y0), color, 1); // left

    // fill the top-left corner pixel (purely cosmetic — 1px outlines can leave the corner open)
    ctx.drawLine(vec(x0, y0), vec(x0 + 1, y0), color, 1);
  }
}
