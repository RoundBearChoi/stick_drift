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
import { CamShake } from './cam_shake';
import { CamShakeOnDeath } from './cam_shake_on_death';
import { CamShakeOnLand } from './cam_shake_on_land';
import { soundController } from './sound_controller';
import { StickRunner } from './stick_runner';
import { RunnerStateName } from './states/runner_state';

/**
 * future-friendly stuff:
 * - setFollowTarget() so the follow source can change later
 * - snapToTarget() for scene transitions and/or resets
 * - movement logic is isolated so look-ahead / airborne bias / level bounds can be added later
 */
export class CameraController implements Tickable {
  /** horizontal deadzone radius (only move when |dx| exceeds this) */
  deadzoneX = 50;

  /** vertical deadzone radius (only move when |dy| exceeds this) */
  deadzoneY = 40;

  targetOffsetY = -20; // this is negative because y increases downward in excalibur.

  // look-ahead tunables
  maxLookAheadX = 60;
  maxLookAheadY = 70;
  airborneExtraY = 20;

  lookAheadStepX = 2;
  lookAheadDecayX = 1;
  lookAheadStepY = 3;
  lookAheadDecayY = 2;

  private _followTarget: Actor | null = null;

  private _baseX = 0;
  private _baseY = 0;
  private _hasBase = false;

  private currentLookAheadX = 0;
  private currentLookAheadY = 0;

  /** last non-zero horizontal facing we want to hold (1 or -1) */
  private heldFacingX = 1;

  private readonly _deathShake = new CamShakeOnDeath();
  private readonly _landShake = new CamShakeOnLand();
  private readonly _shakes: CamShake[] = [this._deathShake, this._landShake];

  // rising-edge detection for land SFX (independent of cam shake)
  private _wasGroundedForSound = true;

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

    this.reset_cam_shakes();
    this._wasGroundedForSound = true; // avoid a land sound on the next tick after a reset

    this._baseX = Math.round(desired.x);
    this._baseY = Math.round(desired.y);
    this._hasBase = true;

    const cam = this.scene.camera;
    cam.pos.x = this._baseX;
    cam.pos.y = this._baseY;
  }

  fixedUpdate(_dt: number): void {
    this.updateLookAhead();

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
      const chaseSpeedX = chaseSpeedFromOverflowX(overflowX);
      this._baseX += Math.sign(rawDx) * Math.min(Math.abs(rawDx), chaseSpeedX);
    }

    if (overflowY > 0) {
      const chaseSpeedY = chaseSpeedFromOverflowY(overflowY);
      this._baseY += Math.sign(rawDy) * Math.min(Math.abs(rawDy), chaseSpeedY);
    }

    // keep whole numbers (this is defensive. when you put in integers nothing happens in Math.round)
    this._baseX = Math.round(this._baseX);
    this._baseY = Math.round(this._baseY);

    const grounded = this.gameCtx.runner_ctx.is_grounded;

    // land SFX on rising edge only
    if (grounded && !this._wasGroundedForSound) {
      soundController.playLand();
    }
    this._wasGroundedForSound = grounded;

    const [death_x, death_y] = this._deathShake.update(
      this.gameCtx.runner_ctx.is_dead
    );
    const [land_x, land_y] = this._landShake.update(grounded);
    cam.pos.x = this._baseX + death_x + land_x;
    cam.pos.y = this._baseY + death_y + land_y;
  }

  private moveToward(current: number, target: number, step: number): number {
    if (current === target) return current;
    const diff = target - current;
    const dir = Math.sign(diff);
    const abs = Math.abs(diff);
    return current + dir * Math.min(abs, step);
  }

  private clamp(v: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, v));
  }

  private updateLookAhead(): void {
    const runner_ctx = this.gameCtx.runner_ctx;
    if (!this._followTarget || runner_ctx.is_dead) {
      this.currentLookAheadX = this.moveToward(this.currentLookAheadX, 0, this.lookAheadDecayX);
      this.currentLookAheadY = this.moveToward(this.currentLookAheadY, 0, this.lookAheadDecayY);
      this.currentLookAheadX = Math.round(this.currentLookAheadX);
      this.currentLookAheadY = Math.round(this.currentLookAheadY);
      return;
    }

    const runner = this._followTarget as StickRunner;
    const isWallSliding = runner?.stateName === RunnerStateName.WALL_SLIDE;

    // Horizontal movement intent / actual momentum
    const movingHorizontally =
      Math.abs(runner_ctx.horizontal_move_buffer) > 0 ||
      Math.abs(runner_ctx.current_run_accel) > 0 ||
      Math.abs(runner_ctx.current_air_run_accel) > 0;

    // Runner is inside the horizontal deadzone relative to the camera base
    // (measured without the look-ahead offset itself)
    const inDeadzoneX =
      this._hasBase &&
      Math.abs(this._followTarget.pos.x - this._baseX) <= this.deadzoneX;

    // Decay horizontal look-ahead when not moving horizontally, on wall slide, or inside deadzone
    if (isWallSliding || !movingHorizontally || inDeadzoneX) {
      this.currentLookAheadX = this.moveToward(this.currentLookAheadX, 0, this.lookAheadDecayX);
    } else {
      // Build or reverse only while actively moving horizontally and outside the deadzone
      const facingX = runner_ctx.is_facing_right_side ? 1 : -1;
      this.heldFacingX = facingX;

      const targetX = this.heldFacingX * this.maxLookAheadX;

      const reversing =
        this.currentLookAheadX !== 0 &&
        Math.sign(this.currentLookAheadX) !== Math.sign(targetX);

      if (reversing) {
        // decay through zero
        this.currentLookAheadX = this.moveToward(this.currentLookAheadX, 0, this.lookAheadDecayX);
      } else {
        // build toward the held facing max
        this.currentLookAheadX = this.moveToward(this.currentLookAheadX, targetX, this.lookAheadStepX);
      }
    }

    this.currentLookAheadX = Math.round(
      this.clamp(this.currentLookAheadX, -this.maxLookAheadX, this.maxLookAheadX)
    );

    // Vertical: extra offset while jumping or falling
    const airborne = !runner_ctx.is_grounded;
    const jumping =
      airborne && (runner_ctx.current_air_up_vector > 0 || runner_ctx.min_jump_ticks_remaining > 0);
    const falling =
      airborne &&
      !jumping &&
      (runner_ctx.current_fall_accel > 0 || runner_ctx.current_wall_slide_down_accel > 0);

    let targetY = 0;
    if (jumping) {
      // look a bit higher (negative Y in Excalibur)
      targetY = -(this.maxLookAheadY + this.airborneExtraY);
    } else if (falling) {
      // look a bit lower
      targetY = this.maxLookAheadY + this.airborneExtraY;
    }

    this.currentLookAheadY = this.moveToward(this.currentLookAheadY, targetY, this.lookAheadStepY);
    this.currentLookAheadY = Math.round(
      this.clamp(
        this.currentLookAheadY,
        -(this.maxLookAheadY + this.airborneExtraY),
        this.maxLookAheadY + this.airborneExtraY
      )
    );
  }

  /**
   * calculate the position camera wants to sit on.
   * target.pos + look-ahead offsets + targetOffsetY
   *
   * look-ahead is applied here so the existing deadzone / chase logic
   * continues to operate on the offset target.
   */
  getDesiredTargetPos(): Vector | null {
    if (!this._followTarget) return null;

    return vec(
      this._followTarget.pos.x + this.currentLookAheadX,
      this._followTarget.pos.y + this.targetOffsetY + this.currentLookAheadY
    );
  }

  /** logical camera base position the deadzone is relative to (excludes shakes) */
  get basePos(): Vector | null {
    if (!this._hasBase) return null;
    return vec(this._baseX, this._baseY);
  }

  private reset_cam_shakes(): void {
    for (const s of this._shakes) {
      s.reset_cam_shake();
    }
  }
}
