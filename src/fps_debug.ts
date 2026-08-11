/**
 * track both visual (render) FPS and fixed-update FPS.
 * 1-second rolling window.
 */
export class FpsDebug {
  private _frame_count = 0;
  private _fixed_update_count = 0;
  private _elapsed = 0;

  private _render_fps = 0;
  private _fixed_update_fps = 0;

  /**
   * call once per visual frame from GameContext.update()
   */
  update(realElapsedMs: number): void {
    this._frame_count++;
    this._elapsed += realElapsedMs;

    if (this._elapsed >= 1000) {
      this._render_fps = Math.round((this._frame_count * 1000) / this._elapsed);
      this._fixed_update_fps = Math.round((this._fixed_update_count * 1000) / this._elapsed);

      this._frame_count = 0;
      this._fixed_update_count = 0;
      this._elapsed = 0;
    }
  }

  /**
   * call once per fixedUpdate
   */
  tickFixed(): void {
    this._fixed_update_count++;
  }

  get text(): string {
    return `RENDER FPS: ${this._render_fps}  FIXED UPDATE FPS: ${this._fixed_update_fps}`;
  }
}
