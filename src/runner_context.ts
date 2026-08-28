import { Vector, vec } from 'excalibur';

/** owned by game ctx so all runner-related numbers live in one place */
export class RunnerContext {
  idle_animation_tick_per_frames = 4;
  run_animation_tick_per_frames = 4;
  fall_animation_tick_per_frames = 4;

  // bottom-center pivot
  readonly anchor: Vector = vec(0.5, 1);

  is_grounded = true;
  is_facing_right_side = true;

  collider_width = 20;
  collider_height = 30;

  // live toggle visual debug. not cleared by reset()
  show_collider_debug = true;
  show_jump_debug = true;
  show_fall_debug = true;

  run_speed = 5;

  horizontal_move_buffer = 0; // unchecked move intent before collision check
  move_down_buffer = 0; // unchecked move intent before collision check
  move_up_buffer = 0; // unchecked move intent before collision check
  current_up_vector = 0;

  jump_starting_momentum = 12;
  jump_momentum_decay = 1; // amount per decay
  jump_momentum_decay_interval = 2; // decay every other update
  jump_momentum_decay_counter = 0;

  min_jump_ticks_before_cut = 1; // minimum jump fixed updates before cancel
  release_hang_time = 6; // hang time before jump is completely cancelled by release
  release_hang_ticks_remaining = 0; // remaining hang time for current jump
  fall_acceleration = 0;
  max_fall_acceleration = 16;
  fall_acceleration_step = 1; // amount per increase
  fall_acceleration_interval = 1;
  fall_acceleration_counter = 0;

  /** same kill used by a real ceiling and by jump-release */
  cancelUpwardMomentum(): void {
    this.current_up_vector = 0;
    this.move_up_buffer = 0;
    this.jump_momentum_decay_counter = 0;
    this.release_hang_ticks_remaining = 0;
  }

  /** call from resetRunner / scene enter so buffers do not leak across scenes. */
  reset(): void {
    this.horizontal_move_buffer = 0;
    this.move_down_buffer = 0;
    this.current_up_vector = 0;
    this.move_up_buffer = 0;
    this.jump_momentum_decay_counter = 0;
    this.release_hang_ticks_remaining = 0;
    this.fall_acceleration = 0;
    this.fall_acceleration_counter = 0;
    this.is_grounded = true;
    this.is_facing_right_side = true;
  }
}
