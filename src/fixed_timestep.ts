/**
 * Manual fixed-timestep clock.
 * Owns the accumulator and spiral-of-death protection.
 * Does not know about Excalibur or game logic.
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
   * Advance the clock with real elapsed time (ms).
   * Calls `onFixedUpdate` zero or more times at exactly `fixedDt`.
   * Returns the leftover accumulator (useful later for interpolation alpha).
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

  /** Optional: hard reset (scene transitions, pause, etc.) */
  reset(): void {
    this.accumulator = 0;
  }
}
