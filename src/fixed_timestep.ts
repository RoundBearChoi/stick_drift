/**
 * manual fixed-timestep clock.
 */
export class FixedTimestep {
  readonly fixedDt: number;
  private accumulator = 0;
  private readonly maxStepsPerFrame: number;

  constructor(hz = 60, maxStepsPerFrame = 5) {
    this.fixedDt = 1000 / hz;
    this.maxStepsPerFrame = maxStepsPerFrame;
  }

  /**
   * advance the clock with real elapsed time (ms).
   * calls onFixedUpdate 0 or more times at exactly fixedDt.
   * return the leftover accumulator (useful for interpolation).
   */
  step(realElapsedMs: number, onFixedUpdate: (dt: number) => void): number {
    this.accumulator += realElapsedMs;

    let steps = 0;
    while (this.accumulator >= this.fixedDt && steps < this.maxStepsPerFrame) {
      onFixedUpdate(this.fixedDt);
      this.accumulator -= this.fixedDt;
      steps++;
    }

    return this.accumulator;
  }

  /** 0..1 interpolation factor for rendering between fixed steps */
  get alpha(): number {
    return this.accumulator / this.fixedDt;
  }

  get leftover(): number {
    return this.accumulator;
  }

  /** optional: hard reset (scene transitions, pause, etc.) */
  reset(): void {
    this.accumulator = 0;
  }
}
