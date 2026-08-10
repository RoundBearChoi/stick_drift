/**
 * track both visual (render) FPS and fixed-update FPS.
 * 1-second rolling window.
 */
export class FpsCounter {
  private frameCount = 0;
  private fixedCount = 0;
  private elapsed = 0;

  public render_fps = 0;
  public fixed_update_fps = 0;

  /**
   * call once per visual frame from GameContext.update()
   */
  update(realElapsedMs: number): void {
    this.frameCount++;
    this.elapsed += realElapsedMs;

    if (this.elapsed >= 1000) {
      this.render_fps = Math.round((this.frameCount * 1000) / this.elapsed);
      this.fixed_update_fps = Math.round((this.fixedCount * 1000) / this.elapsed);

      this.frameCount = 0;
      this.fixedCount = 0;
      this.elapsed = 0;
    }
  }

  /**
   * call once per fixedUpdate
   */
  tickFixed(): void {
    this.fixedCount++;
  }

  get text(): string {
    return `render fps ${this.render_fps}  fixedupdate fps ${this.fixed_update_fps}`;
  }
}
