import { Vector, vec } from 'excalibur';

/** owned by game ctx so all runner-related numbers live in one place */
export class RunnerContext {
  /** pixels moved per fixed update while running */
  run_speed = 8;

  idle_animation_tick_per_frames = 4;
  run_animation_tick_per_frames = 4;
  fall_animation_tick_per_frames = 4;

  /** bottom-center pivot */
  readonly anchor: Vector = vec(0.5, 1);

  horizontal_move_buffer = 0;
  fall_buffer = 0;
  upward_momentum = 0;
  jump_buffer = 0;

  /** initial upward push for jump. decrease by 1 each fixed update until 0. */
  jump_initial_momentum = 10;

  /** collider size in world pixels. bottom-center aligned with runner anchor for now. */
  collider_width = 20;
  collider_height = 30;

  /** whether to draw the yellow collider debug box */
  show_collider_debug = true;

  /**
   * shared ground flag. updated every fixed update by GroundChecker.
   * states read it and decide whether to transition to fall.
   */
  is_grounded = true;
}
