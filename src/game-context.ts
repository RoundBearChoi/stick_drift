import { Engine } from 'excalibur';

/**
 * GameContext – single source of truth (similar to RbgGameContext in CFG3)
 * Owns the simulation and runs a manual fixed timestep accumulator.
 */
export class GameContext {
  // ---------- Fixed timestep ----------
  readonly fixedDt = 1000 / 60;          // ~16.6667 ms → 60 Hz
  private accumulator = 0;
  private readonly maxStepsPerFrame = 5; // safety clamp

  // ---------- Simulation state ----------
  frameNumber = 0;
  isPaused = false;

  // You will put your own entities here later
  // fighters: Fighter[] = [];

  /**
   * Call this every visual frame from the scene's onPostUpdate.
   * Passes the real elapsed time from Excalibur.
   */
  update(engine: Engine, realElapsed: number): void {
    if (this.isPaused) return;

    this.accumulator += realElapsed;

    let steps = 0;
    while (this.accumulator >= this.fixedDt && steps < this.maxStepsPerFrame) {
      this.fixedUpdate(engine, this.fixedDt);
      this.accumulator -= this.fixedDt;
      steps++;
    }
  }

  /**
   * Runs at a stable 60 Hz.
   * Put all deterministic simulation logic here.
   */
  private fixedUpdate(engine: Engine, dt: number): void {
    this.frameNumber++;

    // TODO: update your fighters / entities here
    // for (const fighter of this.fighters) {
    //   fighter.update(this, engine, dt);
    // }

    // Example debug (remove later)
    // if (this.frameNumber % 60 === 0) {
    //   console.log(`Fixed frame ${this.frameNumber}`);
    // }
  }

  // ---------- Pause helpers ----------
  pause(): void {
    this.isPaused = true;
  }

  resume(): void {
    this.isPaused = false;
  }

  togglePause(): void {
    this.isPaused = !this.isPaused;
  }
}
