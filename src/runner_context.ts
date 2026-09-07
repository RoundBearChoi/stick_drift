import { Vector, vec } from 'excalibur';

/** owned by game ctx so all runner-related numbers live in one place */
export class RunnerContext {
  get idle_animation_tick_per_frames() { return 4; }
  get run_animation_tick_per_frames() { return 4; }
  get run_accel_animation_tick_per_frames() { return 4; }
  get decel_animation_tick_per_frames() { return 4; }
  get fall_animation_tick_per_frames() { return 4; }
  get wall_slide_animation_tick_per_frames() { return 4; }

  // bottom-center pivot
  get anchor(): Vector { return vec(0.5, 1); }

  is_grounded = true;
  is_facing_right_side = true;
  wall_contact_left = false;
  wall_contact_right = false;

  get collider_width() { return 20; }
  get collider_height() { return 30; }

  // live toggle visual debug. not cleared by reset()
  show_collider_debug = true;
  show_jump_debug = true;
  show_fall_debug = true;

  get max_run_speed() { return 5; }
  get run_accel_amount() { return 1; }
  get run_accel_interval() { return 1; }
  run_accel_update_count = 0;
  current_run_accel = 0;

  get ground_decel_amount() { return 1; }
  get ground_decel_interval() { return 1; }
  ground_decel_update_count = 0;

  get jump_run_accel_amount() { return 1; }
  get jump_run_accel_interval() { return 1; }
  air_run_update_count = 0;
  current_air_run_accel = 0;

  horizontal_move_buffer = 0; // unchecked move intent before collision check
  move_down_buffer = 0; // unchecked move intent before collision check
  move_up_buffer = 0; // unchecked move intent before collision check

  get jump_up_starting_momentum() { return 12; }
  get jump_up_momentum_decay_amount() { return 1; }
  get jump_up_momentum_decay_interval() { return 2; }
  air_up_vector_decay_counter = 0;
  current_air_up_vector = 0;

  get max_fall_acceleration() { return 15; }
  get fall_accel_amount() { return 1; }
  get fall_accel_interval() { return 1; }
  fall_update_count = 0;
  current_fall_accel = 0;

  get wall_slide_down_accel_amount() { return 1; }
  get wall_slide_down_accel_interval() { return 2; }
  get max_wall_slide_down_acceleration() { return 12; }
  current_wall_slide_down_accel = 0;
  wall_slide_update_count = 0;

  current_wall_slide_up_vector = 0;
  wall_slide_up_vector_decay_counter = 0;
  get wall_slide_up_vector_decay_amount() { return 1; }
  get wall_slide_up_vector_decay_interval() { return 2; }

  // guaranteed full-force jump ticks until cut is allowed.
  get min_jump_ticks_from_ground() { return 1; }
  get min_jump_ticks_from_wall_slide() { return 3; }
  min_jump_ticks_remaining = 0;

  get release_hang_time() { return 4; }
  release_hang_ticks_remaining = 0;

  // horizontal kick away from the wall. clamped to max_run_speed on seed.
  get wall_jump_start_accel() { return 5; }
  // ticks where air-run treats input as holding away and wall-slide re-grab is skipped.
  get wall_jump_away_ticks() { return 3; }
  wall_jump_away_ticks_remaining = 0;

  // same kill is used for both physical ceiling and jump relase
  cancelUpwardMomentum(): void {
    this.current_air_up_vector = 0;
    this.move_up_buffer = 0;
    this.air_up_vector_decay_counter = 0;
    this.release_hang_ticks_remaining = 0;
    this.min_jump_ticks_remaining = 0;
    this.current_wall_slide_up_vector = 0;
    this.wall_slide_up_vector_decay_counter = 0;
  }

  /** call from resetRunner / scene enter so buffers do not leak across scenes. */
  reset(): void {
    this.horizontal_move_buffer = 0;
    this.move_down_buffer = 0;
    this.current_air_up_vector = 0;
    this.move_up_buffer = 0;
    this.air_up_vector_decay_counter = 0;
    this.release_hang_ticks_remaining = 0;
    this.min_jump_ticks_remaining = 0;
    this.wall_jump_away_ticks_remaining = 0;
    this.current_fall_accel = 0;
    this.fall_update_count = 0;
    this.current_run_accel = 0;
    this.run_accel_update_count = 0;
    this.ground_decel_update_count = 0;
    this.current_air_run_accel = 0;
    this.air_run_update_count = 0;
    this.current_wall_slide_down_accel = 0;
    this.wall_slide_update_count = 0;
    this.current_wall_slide_up_vector = 0;
    this.wall_slide_up_vector_decay_counter = 0;
    this.wall_contact_left = false;
    this.wall_contact_right = false;
    this.is_grounded = true;
    this.is_facing_right_side = true;
  }
}
