import { InputAction, InputInterpreter } from '../input_interpreter';
import { StickRunner } from '../stick_runner';
import { RunnerContext } from '../runner_context';
import { RunnerState, RunnerStateName } from './runner_state';
import { RunnerIdle } from './runner_idle';
import { RunnerJump } from './runner_jump';
import { RunnerRunAccel } from './runner_run_accel';
import { RunnerWallSlide } from './runner_wall_slide';
import {
  applyAirRun,
  clearWallJumpCoyote,
  seedJumpRunMomentumFromStandstill,
  seedWallJumpFromSlide,
  tickWallJumpCoyote,
} from '../runner_air_run';
import { canEnterWallSlide } from '../runner_wall_slide_check';

export class RunnerFall implements RunnerState {
  readonly state_name = RunnerStateName.FALL;

  onEnter(runner: StickRunner, runnerCtx: RunnerContext): void {
    runner.playAnimationForState(
      this.state_name,
      runnerCtx.fall_animation_tick_per_frames
    );

    runnerCtx.fall_update_count = 0;
  }

  onFixedUpdate(
    runner: StickRunner,
    input: InputInterpreter,
    runnerCtx: RunnerContext
  ): void {
    if (runnerCtx.is_grounded) {
      runnerCtx.current_fall_accel = 0;
      runnerCtx.fall_update_count = 0;
      clearWallJumpCoyote(runnerCtx);

      // IMPORTANT: if jump is pressed right as runner is hitting ground, switch straight back to jump state instead of idle
      if (input.wasPressed(InputAction.JUMP)) {
        seedJumpRunMomentumFromStandstill(runnerCtx);
        runner.queueNewState(new RunnerJump('ground'));
        return;
      }

      const left = input.isHeld(InputAction.MOVE_LEFT);
      const right = input.isHeld(InputAction.MOVE_RIGHT);

      // held left/right on land → run accel, keep air momentum instead of resetting through idle
      if (right !== left) {
        runnerCtx.is_facing_right_side = right;
        runner.queueNewState(
          new RunnerRunAccel(Math.abs(runnerCtx.current_air_run_accel))
        );
        return;
      }

      runner.queueNewState(new RunnerIdle());
      return;
    }

    // press-away then jump: still a wall jump for a few ticks after leaving slide
    if (
      input.wasPressed(InputAction.JUMP) &&
      runnerCtx.wall_jump_coyote_ticks_remaining > 0
    ) {
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

    const awayLock = runnerCtx.wall_jump_away_ticks_remaining > 0;
    if (!awayLock && canEnterWallSlide(input, runnerCtx)) {
      runner.queueNewState(new RunnerWallSlide());
      return;
    }

    // states write energy only — resolver copies into move_down_buffer
    runnerCtx.fall_update_count++;
    if (runnerCtx.fall_update_count >= runnerCtx.fall_accel_interval) {
      runnerCtx.fall_update_count = 0;
      runnerCtx.current_fall_accel = Math.min(
        runnerCtx.current_fall_accel + runnerCtx.fall_accel_amount,
        runnerCtx.max_fall_acceleration
      );
    }

    // IMPORTANT: same air run (horizontal movement) logic is applied to jump & fall
    applyAirRun(input, runnerCtx);
    tickWallJumpCoyote(runnerCtx);
  }
}
