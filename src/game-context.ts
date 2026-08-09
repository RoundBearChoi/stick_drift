import { Engine } from 'excalibur';

/*
 * single source of truth (similar to RbgGameContext in CFG3)
 * owns the simulation and runs manual fixed timestep accumulator.
 */
export class GameContext {
  // fixed timestep
  readonly fixedDt = 1000 / 60; // ~16.6667 ms → 60 Hz
  private accumulator = 0;
  private readonly maxStepsPerFrame = 5;

  //frameNumber = 0;

  // own entities here later
  // fighters: Fighter[] = [];

  /*
   * call this every visual frame from scene's onPostUpdate.
   * passes real elapsed time from Excalibur.
   */
  update(engine: Engine, realElapsed: number): void {
    this.accumulator += realElapsed;

    let steps = 0;
    while (this.accumulator >= this.fixedDt && steps < this.maxStepsPerFrame) {
      this.fixedUpdate(engine, this.fixedDt);
      this.accumulator -= this.fixedDt;
      steps++;
    }
  }

  /*
   * run at stable 60 Hz.
   * all deterministic simulation logic is here
   */
  private fixedUpdate(engine: Engine, dt: number): void {
    //this.frameNumber++;

  }
}
