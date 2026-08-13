/**
 * Anything that needs to advance on the fixed timestep (60 Hz).
 * Actors with animation, state, physics, timers, etc. implement this.
 */
export interface Tickable {
  fixedUpdate(dt: number): void;
}
