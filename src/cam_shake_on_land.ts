import { CamShake } from './cam_shake';

const LAND_CAM_SHAKE: ReadonlyArray<readonly [number, number]> = [
  [ 2, -1], [ 2, -1],
  [-1,  1], [-1,  1],
  [ 1,  0], [ 1,  0],
  [-1,  0],
  [ 0,  0],
];

export class CamShakeOnLand implements CamShake {
  private _shakeTick = -1; // -1 = inactive
  private _wasGrounded = true; // start true so spawn/reset does not shake

  /** Call every fixed update. Returns the current shake offset. */
  update(isGrounded: boolean): readonly [number, number] {
    // rising edge only — do not cancel when we leave the ground again
    if (isGrounded && !this._wasGrounded) this._shakeTick = 0;
    this._wasGrounded = isGrounded;

    const offset = this.currentOffset();

    if (this._shakeTick >= 0 && this._shakeTick < LAND_CAM_SHAKE.length) {
      this._shakeTick++;
    }

    return offset;
  }

  reset_cam_shake(): void {
    this._shakeTick = -1;
    this._wasGrounded = true; // avoid a shake on the next tick after a reset
  }

  private currentOffset(): readonly [number, number] {
    if (this._shakeTick < 0 || this._shakeTick >= LAND_CAM_SHAKE.length) {
      return [0, 0];
    }
    return LAND_CAM_SHAKE[this._shakeTick];
  }
}
