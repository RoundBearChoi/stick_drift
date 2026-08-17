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
  deadzoneX = 64+32;

  /** vertical deadzone radius (only move when |dy| exceeds this) */
  deadzoneY = 28;

  /** max pixels the camera may move on one axis per fixed update */
  maxStep = 2;

  /**
   * vertical offset from the follow target's pos to the desired camera focus.
   * this is negative because y increases downward in excalibur.
   * runner sprites are 32×32 with bottom-center anchor, so roughly 32 + 16 = 48
   */
  targetOffsetY = -48;

  /** when true, draws a small X at the desired camera target + line to camera center */
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

    // keep whole numbers (this is defensive. when you put in integers nothing happens in Math.round)
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
    marker.graphics.onPostDraw = (ctx) => this.drawDebug(ctx);

    this.scene.add(marker);
    this._debugMarker = marker;
  }

  /**
   * debug overlay:
   * - X at the desired camera target (fully opaque)
   * - thin semi-transparent line from that target to the current camera center
   */
  private drawDebug(ctx: ExcaliburGraphicsContext): void {
    const solidRed: Color = DraculaColorScheme.red;

    // X at target (local origin) — keep solid so it stays easy to spot
    const half = 4;
    ctx.drawLine(vec(-half, -half), vec(half, half), solidRed, 1);
    ctx.drawLine(vec(half, -half), vec(-half, half), solidRed, 1);

    // thin line from target → camera center (camera.pos is the center of the screen)
    const cam = this.scene.camera;
    if (cam && this._debugMarker) {
      const localCamX = cam.pos.x - this._debugMarker.pos.x;
      const localCamY = cam.pos.y - this._debugMarker.pos.y;

      // same red with alpha so the line is quieter than the X
      const lineColor = solidRed.clone();
      lineColor.a = 0.45;

      ctx.drawLine(vec(0, 0), vec(localCamX, localCamY), lineColor, 0.1);
    }
  }

  register(): void {
    this.gameCtx.register(this);
  }

  unregister(): void {
    this.gameCtx.unregister(this);
  }
}
