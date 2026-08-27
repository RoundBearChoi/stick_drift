import { Vector, vec } from 'excalibur';

/** owned by game ctx so all runner-related numbers live in one place */
export class RunnerContext {
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
  is_grounded = true;

  is_facing_right_side = true;

  /** initial upward push for jump. decrease by 1 each fixed update until 0. */
  jump_initial_momentum = 15;

  collider_width = 20;
  collider_height = 30;
  show_collider_debug = true;

  /** call from resetRunner / scene enter so buffers do not leak across scenes. */
  reset(): void {
    this.horizontal_move_buffer = 0;
    this.fall_buffer = 0;
    this.up_force = 0;
    this.jump_buffer = 0;
    this.is_grounded = true;
    this.is_facing_right_side = true;
  }
}
