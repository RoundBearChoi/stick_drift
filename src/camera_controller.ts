import { Actor, Scene, Vector, vec } from 'excalibur';
import { Tickable } from './tickable';
import { GameContext } from './game_context';

/**
 * Fixed-timestep camera that follows a target with deadzones and
 * integer axis-aligned steps. Designed for pixel-art feel.
 *
 * Future-friendly:
 * - setFollowTarget() so the follow source can change later
 *   (cutscenes, bosses, look-ahead points, etc.)
 * - snapToTarget() for scene transitions / resets
 * - all tuning knobs are instance fields so they can be changed at runtime
 * - movement logic is isolated so look-ahead / variable speed /
 *   airborne bias / level bounds can be added later without rewriting the core
 */
export class CameraController implements Tickable {
  // --- tunable ---

  /** horizontal deadzone radius (only move when |dx| exceeds this) */
  deadzoneX = 48;

  /** vertical deadzone radius */
  deadzoneY = 28;

  /** max pixels the camera may move on one axis per fixed update */
  maxStep = 2;

  /**
   * Vertical offset from the follow target's pos to the desired camera focus.
   * Negative because y increases downward in Excalibur.
   *
   * StickRunner sprites are 32×32 with bottom-center anchor, so:
   *   -32 (top of sprite) - 12 (small gap above head) = -44
   * Change this value to raise/lower where the camera wants to look relative to the character.
   */
  targetOffsetY = -44;

  // --- internal ---

  private followTarget: Actor | null = null;

  constructor(
    private readonly scene: Scene,
    private readonly gameCtx: GameContext
  ) {}

  /**
   * Set (or clear) the actor the camera should follow.
   * Passing null stops following.
   * Designed so later we can hand it any Actor, a dummy marker, etc.
   */
  setFollowTarget(target: Actor | null): void {
    this.followTarget = target;
  }

  /**
   * Immediately place the camera on the current desired target position.
   * Call on scene enter / after teleports / after reset.
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

    let dx = desired.x - cam.pos.x;
    let dy = desired.y - cam.pos.y;

    // deadzone
    if (Math.abs(dx) <= this.deadzoneX) dx = 0;
    if (Math.abs(dy) <= this.deadzoneY) dy = 0;

    // resolve horizontal first, then vertical → pure axis-aligned integer moves
    if (dx !== 0) {
      const step = Math.sign(dx) * Math.min(Math.abs(dx), this.maxStep);
      cam.pos.x += step;
    }

    if (dy !== 0) {
      const step = Math.sign(dy) * Math.min(Math.abs(dy), this.maxStep);
      cam.pos.y += step;
    }

    // keep whole numbers (defensive; steps are already integers)
    cam.pos.x = Math.round(cam.pos.x);
    cam.pos.y = Math.round(cam.pos.y);
  }

  /**
   * Computes the point the camera wants to sit on.
   * Currently: target.pos + (0, targetOffsetY)
   *
   * Later this is the single place to add:
   * - look-ahead based on facing / velocity
   * - different offsets while airborne
   * - soft focus points for cutscenes
   */
  private getDesiredTargetPos(): Vector | null {
    if (!this.followTarget) return null;

    return vec(
      this.followTarget.pos.x,
      this.followTarget.pos.y + this.targetOffsetY
    );
  }

  register(): void {
    this.gameCtx.register(this);
  }

  unregister(): void {
    this.gameCtx.unregister(this);
  }
}
