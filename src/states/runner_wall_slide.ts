import { InputAction, InputInterpreter } from '../input_interpreter';
import { StickRunner } from '../stick_runner';
import { RunnerContext } from '../runner_context';
import { RunnerState, RunnerStateName } from './runner_state';
import { RunnerIdle } from './runner_idle';
import { RunnerFall } from './runner_fall';
import { applyAirRun } from '../runner_air_run';
import { transferAirUpToWallSlideUp } from '../up_vector_wall_slide_transfer';

export class RunnerWallSlide implements RunnerState {
  readonly state_name = RunnerStateName.WALL_SLIDE;

  onEnter(runner: StickRunner, runnerCtx: RunnerContext): void {
    runner.playAnimationForState(
      this.state_name,
      runnerCtx.wall_slide_animation_tick_per_frames
    );

    // remaining air-up becomes wall-slide-up (~85%, integer table).
    const remainingAirUp = runnerCtx.current_air_up_vector;
    runnerCtx.cancelUpwardMomentum();
    runnerCtx.current_wall_slide_up_vector = transferAirUpToWallSlideUp(remainingAirUp);
    runnerCtx.wall_slide_up_vector_decay_counter = 0;

    runnerCtx.current_air_run_accel = 0;
    runnerCtx.air_run_update_count = 0;
    runnerCtx.horizontal_move_buffer = 0;

    // drop leftover free-fall energy. down-slide starts only after wall-slide-up is gone.
    runnerCtx.current_fall_accel = 0;
    runnerCtx.fall_update_count = 0;
    runnerCtx.move_down_buffer = 0;
    runnerCtx.current_wall_slide_down_accel = 0;
    runnerCtx.wall_slide_update_count = 0;

    // face the wall we grabbed
    if (runnerCtx.wall_contact_right && !runnerCtx.wall_contact_left) {
      runnerCtx.is_facing_right_side = true;
    } else if (runnerCtx.wall_contact_left && !runnerCtx.wall_contact_right) {
      runnerCtx.is_facing_right_side = false;
    }
  }

  onFixedUpdate(
    runner: StickRunner,
    input: InputInterpreter,
    runnerCtx: RunnerContext
  ): void {
    if (runnerCtx.is_grounded) {
      runnerCtx.current_wall_slide_down_accel = 0;
      runnerCtx.wall_slide_update_count = 0;
      runnerCtx.current_wall_slide_up_vector = 0;
      runnerCtx.wall_slide_up_vector_decay_counter = 0;
      runnerCtx.current_fall_accel = 0;
      runnerCtx.fall_update_count = 0;
      runner.queueNewState(new RunnerIdle());
      return;
    }

    const left = input.isHeld(InputAction.MOVE_LEFT);
    const right = input.isHeld(InputAction.MOVE_RIGHT);
    const pressingAway =
      (runnerCtx.is_facing_right_side && left && !right) ||
      (!runnerCtx.is_facing_right_side && right && !left);

    const stillOnWall = runnerCtx.is_facing_right_side
      ? runnerCtx.wall_contact_right
      : runnerCtx.wall_contact_left;

    // wall ended, or player pushed off → regular fall
    if (!stillOnWall || pressingAway) {
      runnerCtx.current_fall_accel = runnerCtx.current_wall_slide_down_accel;
      runnerCtx.current_wall_slide_down_accel = 0;
      runnerCtx.wall_slide_update_count = 0;

      // leftover climb becomes regular air-up so peel-off can keep rising for a bit
      if (runnerCtx.current_wall_slide_up_vector > 0) {
        runnerCtx.current_air_up_vector = runnerCtx.current_wall_slide_up_vector;
        runnerCtx.air_up_vector_decay_counter = 0;
        runnerCtx.current_wall_slide_up_vector = 0;
        runnerCtx.wall_slide_up_vector_decay_counter = 0;
        runnerCtx.current_fall_accel = 0;
      }

      applyAirRun(input, runnerCtx);
      runner.queueNewState(new RunnerFall());
      return;
    }

    // still climbing the wall — up has priority, no down energy yet
    if (runnerCtx.current_wall_slide_up_vector > 0) {
      runnerCtx.horizontal_move_buffer = runnerCtx.is_facing_right_side ? 1 : -1;
      return;
    }

    runnerCtx.wall_slide_update_count++;
    if (
      runnerCtx.wall_slide_update_count >=
      runnerCtx.wall_slide_down_accel_interval
    ) {
      runnerCtx.wall_slide_update_count = 0;
      runnerCtx.current_wall_slide_down_accel = Math.min(
        runnerCtx.current_wall_slide_down_accel +
          runnerCtx.wall_slide_down_accel_amount,
        runnerCtx.max_wall_slide_down_acceleration
      );
    }

    // stay on the wall
    runnerCtx.horizontal_move_buffer = runnerCtx.is_facing_right_side ? 1 : -1;
  }
}
