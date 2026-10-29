import { CamShake } from './cam_shake';

const DEATH_CAM_SHAKE: ReadonlyArray<readonly [number, number]> = [
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

export class CamShakeOnDeath implements CamShake {
  private _shakeTick = -1; // -1 = inactive
  private _wasDead = false;

  /** Call every fixed update. Returns the current shake offset. */
  update(isDead: boolean): readonly [number, number] {
    if (isDead && !this._wasDead) this._shakeTick = 0;
    if (!isDead) this._shakeTick = -1;
    this._wasDead = isDead;

    const offset = this.currentOffset();

    if (this._shakeTick >= 0 && this._shakeTick < DEATH_CAM_SHAKE.length) {
      this._shakeTick++;
    }

    return offset;
  }

  reset_cam_shake(): void {
    this._shakeTick = -1;
  }

  private currentOffset(): readonly [number, number] {
    if (this._shakeTick < 0 || this._shakeTick >= DEATH_CAM_SHAKE.length) {
      return [0, 0];
    }
    return DEATH_CAM_SHAKE[this._shakeTick];
  }
}
