/**
 * Tracks both visual (render) FPS and fixed-update FPS
 * using a simple 1-second rolling window.
 */
export class FpsCounter {
  private frameCount = 0;
  private fixedCount = 0;
  private elapsed = 0;

  /** Visual frames per second (onPostUpdate rate) */
  public renderFps = 0;

  /** Fixed updates per second (fixedUpdate rate) */
  public fixedUpdateFps = 0;

  /**
   * Call once per visual frame from GameContext.update()
   */
  update(realElapsedMs: number): void {
    this.frameCount++;
    this.elapsed += realElapsedMs;

    if (this.elapsed >= 1000) {
      this.renderFps = Math.round((this.frameCount * 1000) / this.elapsed);
      this.fixedUpdateFps = Math.round((this.fixedCount * 1000) / this.elapsed);

      this.frameCount = 0;
      this.fixedCount = 0;
      this.elapsed = 0;
    }
  }

  /**
   * Call once every time fixedUpdate runs
   */
  tickFixed(): void {
    this.fixedCount++;
  }

  get text(): string {
    return `FPS ${this.renderFps}  Fixed ${this.fixedUpdateFps}`;
  }
}
