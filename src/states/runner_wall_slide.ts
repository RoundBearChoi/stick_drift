import { InputAction, InputInterpreter } from '../input_interpreter';
import { StickRunner } from '../stick_runner';
import { RunnerContext } from '../runner_context';
import { RunnerState, RunnerStateName } from './runner_state';
import { RunnerIdle } from './runner_idle';
import { RunnerFall } from './runner_fall';
import { RunnerJump } from './runner_jump';
import {
  applyAirRun,
  armWallJumpCoyote,
  clearWallJumpCoyote,
  seedWallJumpFromSlide,
} from '../runner_air_run';
import { transferUpVectorAcrossWallSlide } from '../up_vector_wall_slide_transfer';
import { transferDownVectorAcrossWallSlide } from '../down_vector_wall_slide_transfer';

export class RunnerWallSlide implements RunnerState {
  readonly state_name = RunnerStateName.WALL_SLIDE;

  onEnter(runner: StickRunner, runnerCtx: RunnerContext): void {
    //console.log("entering wall slide state");

    runner.playAnimationForState(
      this.state_name,
      runnerCtx.wall_slide_animation_tick_per_frames
    );

    // remaining air-up becomes wall-slide-up
    const remainingAirUp = runnerCtx.current_air_up_vector;
    const remainingFall = runnerCtx.current_fall_accel;
    runnerCtx.cancelUpwardMomentum();
    runnerCtx.current_wall_slide_up_vector =
      transferUpVectorAcrossWallSlide(remainingAirUp);
    runnerCtx.wall_slide_up_vector_decay_counter = 0;

    runnerCtx.current_air_run_accel = 0;
    runnerCtx.air_run_update_count = 0;
    runnerCtx.horizontal_move_buffer = 0;
    runnerCtx.wall_jump_away_ticks_remaining = 0;
    clearWallJumpCoyote(runnerCtx);

    // leftover free-fall becomes wall-slide-down.
    // climb still wins — no down energy while wall-slide-up remains.
    runnerCtx.current_fall_accel = 0;
    runnerCtx.fall_update_count = 0;
    runnerCtx.move_down_buffer = 0;
    runnerCtx.wall_slide_update_count = 0;
    if (runnerCtx.current_wall_slide_up_vector > 0) {
      runnerCtx.current_wall_slide_down_accel = 0;
    } else {
      runnerCtx.current_wall_slide_down_accel =
        transferDownVectorAcrossWallSlide(remainingFall);
    }

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
      clearWallJumpCoyote(runnerCtx);
      runner.queueNewState(new RunnerIdle());
      return;
    }

    if (input.wasPressed(InputAction.JUMP)) {
      seedWallJumpFromSlide(runnerCtx);
      runnerCtx.current_wall_slide_down_accel = 0;
      runnerCtx.wall_slide_update_count = 0;
      runnerCtx.current_wall_slide_up_vector = 0;
      runnerCtx.wall_slide_up_vector_decay_counter = 0;
      runnerCtx.current_fall_accel = 0;
      runnerCtx.fall_update_count = 0;
      runnerCtx.move_down_buffer = 0;
      runner.queueNewState(new RunnerJump('wall'));
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

      // leftover climb goes back to air-up
      if (runnerCtx.current_wall_slide_up_vector > 0) {
        runnerCtx.current_air_up_vector = transferUpVectorAcrossWallSlide(
          runnerCtx.current_wall_slide_up_vector
        );
        runnerCtx.air_up_vector_decay_counter = 0;
        runnerCtx.current_wall_slide_up_vector = 0;
        runnerCtx.wall_slide_up_vector_decay_counter = 0;
        runnerCtx.current_fall_accel = 0;
      }

      // snapshot wall facing before air-run can flip it
      armWallJumpCoyote(runnerCtx);
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
