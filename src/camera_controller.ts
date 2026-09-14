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

/**
 * fixed-timestep camera that follows a target with deadzones and integer axis-aligned steps.
 * chase speed is looked up from overflow past the deadzone (further = faster).
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

  /**
   * vertical offset from the follow target's pos to the desired camera focus.
   * this is negative because y increases downward in excalibur.
   * runner sprites are 32 by 32 with bottom-center anchor, so roughly 32 + 16 = 48
   */
  targetOffsetY = -32;

  private _followTarget: Actor | null = null;

  constructor(
    private readonly scene: Scene,
    private readonly gameCtx: GameContext
  ) {}

  /**
   * set (or clear) the actor (target) the camera should follow. passing null stops following.
   */
  setFollowTarget(target: Actor | null): void {
    this._followTarget = target;
  }

  /**
   * immediately place the camera on the current desired target position. call on scene enter etc.
   */
  snapToTarget(): void {
    const desired = this.getDesiredTargetPos();
    if (!desired) return;

    const cam = this.scene.camera;
    cam.pos.x = Math.round(desired.x);
    cam.pos.y = Math.round(desired.y);
  }

  fixedUpdate(_dt: number): void {
    const desired = this.getDesiredTargetPos();
    if (!desired) return;

    const cam = this.scene.camera;

    const rawDx = desired.x - cam.pos.x;
    const rawDy = desired.y - cam.pos.y;

    const overflowX = Math.max(0, Math.abs(rawDx) - this.deadzoneX);
    const overflowY = Math.max(0, Math.abs(rawDy) - this.deadzoneY);

    // resolve horizontal first, then vertical. pure axis-aligned integer moves.
    if (overflowX > 0) {
      const step = chaseSpeedFromOverflowX(overflowX);
      cam.pos.x += Math.sign(rawDx) * Math.min(Math.abs(rawDx), step);
    }

    if (overflowY > 0) {
      const step = chaseSpeedFromOverflowY(overflowY);
      cam.pos.y += Math.sign(rawDy) * Math.min(Math.abs(rawDy), step);
    }

    // keep whole numbers (this is defensive. when you put in integers nothing happens in Math.round)
    cam.pos.x = Math.round(cam.pos.x);
    cam.pos.y = Math.round(cam.pos.y);
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
}
