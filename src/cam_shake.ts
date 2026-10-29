export interface CamShake {
  update(isActive: boolean): readonly [number, number];
  reset_cam_shake(): void;
}
