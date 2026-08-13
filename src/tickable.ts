/**
 * this is anything that needs to advance (tick) on fixed timesteps.
 * actors with animation, state, physics, timers, etc. implement this.
 */
export interface Tickable {
  fixedUpdate(dt: number): void;
}
