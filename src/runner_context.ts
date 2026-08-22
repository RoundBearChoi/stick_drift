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

  /**
   * decaying upward push written only by states (e.g. Jump onEnter sets it to jump_initial_momentum).
   * movement resolve feeds this into jump_buffer and decreases it by 1 every fixed update.
   */
  upward_momentum = 0;

  /**
   * per-frame upward intent (positive = pixels up). set from upward_momentum, then consumed + zeroed by movement resolve.
   * while this (or upward_momentum) remains, fall is suppressed.
   */
  jump_buffer = 0;

  /** temporary initial upward push for jump. decrease by 1 each fixed update until 0. */
  jump_initial_momentum = 5;

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
