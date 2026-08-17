import { Vector, vec } from 'excalibur';

/** owned by game ctx so all runner-related numbers live in one place */
export class RunnerContext {
  /** pixels moved per fixed update while running */
  run_speed = 8;

  /** fixed updates required to advance one animation frame while idle */
  idle_animation_tick_per_frames = 4;

  /** fixed updates required to advance one animation frame while running */
  run_animation_tick_per_frames = 4;

  /** bottom-center pivot */
  readonly anchor: Vector = vec(0.5, 1);

  /**
   * Intentional horizontal movement for this fixed update (in pixels).
   * States write to this. Resolver consumes it and then zeros it.
   */
  horizontal_move_buffer = 0;
}
