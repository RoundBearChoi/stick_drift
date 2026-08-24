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
  up_force = 0;
  jump_buffer = 0;

  /** initial upward push for jump. decrease by 1 each fixed update until 0. */
  jump_initial_momentum = 15;

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

  /**
   * clear per-visit simulation state.
   * tuning values (speeds, anim ticks, collider size, etc.) are left alone.
   * call from resetRunner / scene enter so buffers do not leak across scenes.
   */
  reset(): void {
    this.horizontal_move_buffer = 0;
    this.fall_buffer = 0;
    this.up_force = 0;
    this.jump_buffer = 0;
    this.is_grounded = true;
  }
}
