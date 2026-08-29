import { Vector, vec } from 'excalibur';

/** owned by game ctx so all runner-related numbers live in one place */
export class RunnerContext {
  readonly idle_animation_tick_per_frames = 4;
  readonly run_animation_tick_per_frames = 4;
  readonly run_accel_animation_tick_per_frames = 4;
  readonly decel_animation_tick_per_frames = 4;
  readonly fall_animation_tick_per_frames = 4;

  // bottom-center pivot
  readonly anchor: Vector = vec(0.5, 1);

  is_grounded = true;
  is_facing_right_side = true;

  readonly collider_width = 20;
  readonly collider_height = 30;

  // live toggle visual debug. not cleared by reset()
  show_collider_debug = true;
  show_jump_debug = true;
  show_fall_debug = true;

  readonly max_run_speed = 5; // cap for both grounded and airborne run
  readonly run_accel_amount = 1;
  readonly run_accel_interval = 1;
  run_accel_update_count = 0;
  current_run_accel = 0;

  readonly ground_decel_amount = 1;
  readonly ground_decel_interval = 1;
  ground_decel_update_count = 0;

  readonly jump_run_accel_amount = 1;
  readonly jump_run_accel_interval = 1;
  air_run_update_count = 0;
  current_jump_run_accel = 0;

  horizontal_move_buffer = 0; // unchecked move intent before collision check
  move_down_buffer = 0; // unchecked move intent before collision check
  move_up_buffer = 0; // unchecked move intent before collision check
  current_up_vector = 0;

  readonly jump_starting_momentum = 12;
  readonly jump_momentum_decay = 1; // amount per decay
  readonly jump_momentum_decay_interval = 2; // decay every other update
  jump_momentum_decay_counter = 0;

  /**
   * minimum jump fixed updates before cancel.
   * immediate release does not snap to 1-up on the first jump tick. we still have full force until minimum jump ticks, AND THEN hang at 1.
   */
  readonly min_jump_updates_before_cut = 1;
  readonly release_hang_time = 4; // runner stays in air for N fixed updates before falling
  readonly max_fall_acceleration = 15;
  readonly fall_accel_amount = 1; // amount per increase
  readonly fall_accel_interval = 1;
  release_hang_ticks_remaining = 0;
  fall_update_count = 0;
  current_fall_accel = 0;

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
    this.current_fall_accel = 0;
    this.fall_update_count = 0;
    this.current_run_accel = 0;
    this.run_accel_update_count = 0;
    this.ground_decel_update_count = 0;
    this.current_jump_run_accel = 0;
    this.air_run_update_count = 0;
    this.is_grounded = true;
    this.is_facing_right_side = true;
  }
}
