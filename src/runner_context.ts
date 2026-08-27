import { Vector, vec } from 'excalibur';

/** owned by game ctx so all runner-related numbers live in one place */
export class RunnerContext {
  run_speed = 4;

  idle_animation_tick_per_frames = 4;
  run_animation_tick_per_frames = 4;
  fall_animation_tick_per_frames = 4;

  /** bottom-center pivot */
  readonly anchor: Vector = vec(0.5, 1);

  is_grounded = true;
  is_facing_right_side = true;

  collider_width = 20;
  collider_height = 30;
  show_collider_debug = true;

  horizontal_move_buffer = 0; // unchecked move intent before collision check
  move_down_buffer = 0; // unchecked move intent before collision check
  move_up_buffer = 0; // unchecked move intent before collision check
  current_up_vector = 0;

  jump_start_momentum = 15;
  jump_momentum_decay = 1;
  /** 1 = decay every fixed tick, 2 = every other tick. jump-local so phase does not depend on when jump was pressed. */
  jump_momentum_decay_interval = 2;
  jump_momentum_decay_counter = 0;
  fall_acceleration = 0;
  max_fall_acceleration = 16;

  /** call from resetRunner / scene enter so buffers do not leak across scenes. */
  reset(): void {
    this.horizontal_move_buffer = 0;
    this.move_down_buffer = 0;
    this.current_up_vector = 0;
    this.move_up_buffer = 0;
    this.jump_momentum_decay_counter = 0;
    this.fall_acceleration = 0;
    this.is_grounded = true;
    this.is_facing_right_side = true;
  }
}
