import {
  Actor,
  Color,
  ExcaliburGraphicsContext,
  Scene,
  Vector,
  vec,
} from 'excalibur';
import { Tickable } from './tickable';
import { GameContext } from './game_context';
import { DraculaColorScheme } from './dracula_color_scheme';

/**
 * fixed-timestep camera that follows a target with deadzones and integer axis-aligned steps.
 *
 * future-friendly stuff:
 * - setFollowTarget() so the follow source can change later
 * - snapToTarget() for scene transitions and/or resets
 * - movement logic is isolated so look-ahead / variable speed / airborne bias / level bounds can be added later
 */
export class CameraController implements Tickable {
  /** horizontal deadzone radius (only move when |dx| exceeds this) */
  deadzoneX = 48;

  /** vertical deadzone radius (only move when |dy| exceeds this) */
  deadzoneY = 28;

  /** max pixels the camera may move on one axis per fixed update */
  maxStep = 2;

  /**
   * vertical offset from the follow target's pos to the desired camera focus.
   * this is negative because y increases downward in excalibur.
   * stickRunner sprites are 32×32 with bottom-center anchor, so roughly 32 + 16 = 48
   */
  targetOffsetY = -48;

  /** when true, draws a small X at the desired camera target */
  showTargetDebug = true;

  private _followTarget: Actor | null = null;
  private _debugMarker: Actor | null = null;

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

    this.syncDebugMarker(desired);
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

    this.syncDebugMarker(desired);
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
  private getDesiredTargetPos(): Vector | null {
    if (!this._followTarget) return null;

    return vec(
      this._followTarget.pos.x,
      this._followTarget.pos.y + this.targetOffsetY
    );
  }

  private syncDebugMarker(desired: Vector): void {
    if (!this.showTargetDebug) {
      if (this._debugMarker) {
        this._debugMarker.graphics.visible = false;
      }
      return;
    }

    this.ensureDebugMarker();
    if (!this._debugMarker) return;

    this._debugMarker.graphics.visible = true;
    this._debugMarker.pos.x = Math.round(desired.x);
    this._debugMarker.pos.y = Math.round(desired.y);
  }

  private ensureDebugMarker(): void {
    if (this._debugMarker) return;

    const marker = new Actor({ name: 'CameraTargetDebug' });
    marker.graphics.forceOnScreen = true;
    marker.graphics.onPostDraw = (ctx) => this.drawTargetX(ctx);

    this.scene.add(marker);
    this._debugMarker = marker;
  }

  /**
   * mark camera target with an X
   */
  private drawTargetX(ctx: ExcaliburGraphicsContext): void {
    // local space: actor pos is already the target, so draw around origin
    const half = 4;
    const color: Color = DraculaColorScheme.red;
    const thickness = 1;

    ctx.drawLine(vec(-half, -half), vec(half, half), color, thickness);
    ctx.drawLine(vec(half, -half), vec(-half, half), color, thickness);
  }

  register(): void {
    this.gameCtx.register(this);
  }

  unregister(): void {
    this.gameCtx.unregister(this);
  }
}
