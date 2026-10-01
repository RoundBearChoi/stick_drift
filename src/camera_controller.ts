import {
  Actor,
  Scene,
  Vector,
  vec,
} from 'excalibur';
import { Tickable } from './tickable';
import { GameContext } from './game_context';
import {
  chaseSpeedFromOverflowX,
  chaseSpeedFromOverflowY,
} from './camera_chase_speed';

// hand-sampled exp curve
const DEATH_SHAKE: ReadonlyArray<readonly [number, number]> = [
  /*[8, -5], [8, -5],
  [-6,  4], [-6,  4],
  [ 4, -2], [ 4, -2],
  [-3,  2], [-3,  2],
  [ 2, -1], [ 2, -1],
  [-1,  1], [-1,  1],
  [ 1,  0], [ 1,  0],
  [-1,  0], [-1,  0],
  [ 0,  0],*/
  [ 6, -4], [ 6, -4],
  [-5,  3], [-5,  3],
  [ 3, -2], [ 3, -2],
  [-2,  1], [-2,  1],
  [ 1, -1], [ 1, -1],
  [-1,  1], [-1,  1],
  [ 1,  0], [ 1,  0],
  [-1,  0], [-1,  0],
  [ 0,  0],
];

/**
 * future-friendly stuff:
 * - setFollowTarget() so the follow source can change later
 * - snapToTarget() for scene transitions and/or resets
 * - movement logic is isolated so look-ahead / airborne bias / level bounds can be added later
 */
export class CameraController implements Tickable {
  /** horizontal deadzone radius (only move when |dx| exceeds this) */
  deadzoneX = 64+32;

  /** vertical deadzone radius (only move when |dy| exceeds this) */
  deadzoneY = 28;

  targetOffsetY = -32; // this is negative because y increases downward in excalibur.

  private _followTarget: Actor | null = null;

  private _baseX = 0;
  private _baseY = 0;
  private _hasBase = false;

  private _shakeTick = -1; // -1 means inactive
  private _wasDead = false; // flag so that cam shake starts once, instead of every tick while the runner stays dead

  constructor(
    private readonly scene: Scene,
    private readonly gameCtx: GameContext
  ) {}

  setFollowTarget(target: Actor | null): void {
    this._followTarget = target;
  }

  snapToTarget(): void {
    const desired = this.getDesiredTargetPos();
    if (!desired) return;

    this._shakeTick = -1;
    this._wasDead = this.gameCtx.runner_ctx.is_dead;

    this._baseX = Math.round(desired.x);
    this._baseY = Math.round(desired.y);
    this._hasBase = true;

    const cam = this.scene.camera;
    cam.pos.x = this._baseX;
    cam.pos.y = this._baseY;
  }

  fixedUpdate(_dt: number): void {
    const dead = this.gameCtx.runner_ctx.is_dead;
    if (dead && !this._wasDead) this._shakeTick = 0;
    if (!dead) this._shakeTick = -1;
    this._wasDead = dead;

    const desired = this.getDesiredTargetPos();
    if (!desired) return;

    const cam = this.scene.camera;
    if (!this._hasBase) {
      this._baseX = Math.round(cam.pos.x);
      this._baseY = Math.round(cam.pos.y);
      this._hasBase = true;
    }

    const rawDx = desired.x - this._baseX;
    const rawDy = desired.y - this._baseY;

    const overflowX = Math.max(0, Math.abs(rawDx) - this.deadzoneX);
    const overflowY = Math.max(0, Math.abs(rawDy) - this.deadzoneY);

    // resolve horizontal first, then vertical. pure axis-aligned integer moves.
    if (overflowX > 0) {
      const step = chaseSpeedFromOverflowX(overflowX);
      this._baseX += Math.sign(rawDx) * Math.min(Math.abs(rawDx), step);
    }

    if (overflowY > 0) {
      const step = chaseSpeedFromOverflowY(overflowY);
      this._baseY += Math.sign(rawDy) * Math.min(Math.abs(rawDy), step);
    }

    // keep whole numbers (this is defensive. when you put in integers nothing happens in Math.round)
    this._baseX = Math.round(this._baseX);
    this._baseY = Math.round(this._baseY);

    const [shake_x, shake_y] = this.currentShake();
    cam.pos.x = this._baseX + shake_x;
    cam.pos.y = this._baseY + shake_y;

    if (this._shakeTick >= 0 && this._shakeTick < DEATH_SHAKE.length) {
      this._shakeTick++;
    }
  }

  /**
   * calculate the position camera wants to sit on.
   * currently: target.pos + (0, targetOffsetY)
   *
   * later add:
   * - look-ahead based on facing / velocity
   * - different offsets while airborne
   * - soft focus points for cutscenes
   */
  getDesiredTargetPos(): Vector | null {
    if (!this._followTarget) return null;

    return vec(
      this._followTarget.pos.x,
      this._followTarget.pos.y + this.targetOffsetY
    );
  }

  register(): void {
    this.gameCtx.registerTickable(this);
  }

  unregister(): void {
    this.gameCtx.unregisterTickable(this);
  }

  private currentShake(): readonly [number, number] {
    if (this._shakeTick < 0 || this._shakeTick >= DEATH_SHAKE.length) return [0, 0];
    return DEATH_SHAKE[this._shakeTick];
  }
}
